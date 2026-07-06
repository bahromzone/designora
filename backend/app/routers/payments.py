"""
Payments Router — monetizatsiya yadrosi (BOSQICH 2).

Prefix: /api/payments

- POST /checkout                → Order yaratadi (pending), to'lov URL qaytaradi
- POST /payme                   → Payme Merchant API webhook (JSON-RPC 2.0)
- POST /click/prepare           → Click Prepare bosqichi
- POST /click/complete          → Click Complete bosqichi
- GET  /orders/{order_id}       → buyurtma holatini tekshirish (frontend polling)

To'lov muvaffaqiyatli bo'lgach _grant_access() Enrollment yaratadi —
access control (learning.py) avtomatik ochiladi.
"""

import base64
import hashlib
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.payment import Payment
from app.models.progress import Progress
from app.models.user import User

router = APIRouter(prefix="/api/payments", tags=["Payments"])


def _now():
    return datetime.now(UTC)


# Payme holat kodlari
PAYME_STATE_CREATED = 1
PAYME_STATE_PERFORMED = 2

# Payme JSON-RPC xato kodlari
PAYME_ERR_INSUFFICIENT_PRIVILEGE = -32504
PAYME_ERR_METHOD_NOT_FOUND = -32601
PAYME_ERR_INVALID_AMOUNT = -31001
PAYME_ERR_ACCOUNT_NOT_FOUND = -31050
PAYME_ERR_CANNOT_PERFORM = -31008
PAYME_ERR_TRANSACTION_NOT_FOUND = -31003


# ──────────────────────────────────────────────────────────────────
# Access grant — to'lov 'paid' bo'lganda chaqiriladi
# ──────────────────────────────────────────────────────────────────
def _grant_access(db: Session, order: Order) -> None:
    """Order paid bo'lganda: Enrollment yaratadi + legacy Payment yozadi."""
    if order.status == "paid":
        return  # idempotent

    order.status = "paid"
    order.paid_at = _now()

    if order.course_id:
        exists = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == order.user_id,
                Enrollment.course_id == order.course_id,
            )
            .first()
        )
        if not exists:
            db.add(
                Enrollment(
                    user_id=order.user_id,
                    course_id=order.course_id,
                    progress_percent=0,
                )
            )
            course = db.query(Course).filter(Course.id == order.course_id).first()
            if course:
                course.students_count = (course.students_count or 0) + 1
            if (
                not db.query(Progress)
                .filter(
                    Progress.user_id == order.user_id,
                    Progress.course_id == order.course_id,
                )
                .first()
            ):
                db.add(
                    Progress(
                        user_id=order.user_id,
                        course_id=order.course_id,
                        percent=0,
                        minutes_spent=0,
                    )
                )

    # Legacy Payment yozuvi (admin panel shundan o'qiydi)
    db.add(
        Payment(
            user_id=order.user_id,
            course_id=order.course_id,
            amount=order.amount,
            status="paid",
            provider=order.provider,
        )
    )

    # Kupon hisoblagichini oshirish
    if order.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == order.coupon_code).first()
        if coupon:
            coupon.used_count = (coupon.used_count or 0) + 1


# ──────────────────────────────────────────────────────────────────
# CHECKOUT — buyurtma yaratish
# ──────────────────────────────────────────────────────────────────
class CheckoutBody(BaseModel):
    course_id: int
    provider: str  # payme / click
    coupon_code: str | None = None


@router.post("/checkout")
def checkout(
    body: CheckoutBody,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")

    course = (
        db.query(Course)
        .filter(Course.id == body.course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    # Allaqachon yozilganmi?
    if (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="Siz allaqachon bu kursga egasiz")

    base_amount = course.price or 0

    # Bepul kurs — to'lovsiz to'g'ridan-to'g'ri enroll
    if base_amount <= 0:
        order = Order(
            user_id=user.id, course_id=course.id, amount=0, provider="free"
        )
        db.add(order)
        db.flush()
        _grant_access(db, order)
        db.commit()
        return {"free": True, "order_id": order.id, "status": "paid"}

    # Kupon
    discount = 0
    coupon_code = None
    if body.coupon_code:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.code == body.coupon_code.strip().upper())
            .first()
        )
        if not coupon or not coupon.is_valid():
            raise HTTPException(
                status_code=400, detail="Kupon yaroqsiz yoki muddati o'tgan"
            )
        discount = coupon.apply(base_amount)
        coupon_code = coupon.code

    amount = max(0, base_amount - discount)

    order = Order(
        user_id=user.id,
        course_id=course.id,
        amount=amount,
        provider=body.provider,
        coupon_code=coupon_code,
        discount_amount=discount,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    pay_url = _build_pay_url(body.provider, order)
    return {
        "free": False,
        "order_id": order.id,
        "amount": amount,
        "discount": discount,
        "provider": body.provider,
        "pay_url": pay_url,
    }


def _build_pay_url(provider: str, order: Order) -> str:
    if provider == "payme":
        # amount tiyin da: so'm * 100
        raw = (
            f"m={settings.PAYME_MERCHANT_ID};"
            f"ac.order_id={order.id};"
            f"a={order.amount * 100}"
        )
        encoded = base64.b64encode(raw.encode()).decode()
        return f"{settings.PAYME_CHECKOUT_URL}/{encoded}"

    if provider == "click":
        return (
            f"{settings.CLICK_CHECKOUT_URL}"
            f"?service_id={settings.CLICK_SERVICE_ID}"
            f"&merchant_id={settings.CLICK_MERCHANT_ID}"
            f"&amount={order.amount}"
            f"&transaction_param={order.id}"
            f"&return_url={settings.FRONTEND_URL}/tolov/natija/{order.id}"
        )

    raise HTTPException(status_code=400, detail="Noma'lum to'lov provayderi")


@router.get("/orders/{order_id}")
def order_status(
    order_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or not user or order.user_id != user.id:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return {
        "order_id": order.id,
        "status": order.status,
        "course_id": order.course_id,
        "amount": order.amount,
    }


# ──────────────────────────────────────────────────────────────────
# PAYME — Merchant API (JSON-RPC 2.0)
# ──────────────────────────────────────────────────────────────────
def _payme_auth(request: Request) -> bool:
    """Authorization: Basic base64('Paycom:<PAYME_KEY>')."""
    header = request.headers.get("Authorization", "")
    if not header.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(header[6:]).decode()
        _, key = decoded.split(":", 1)
    except Exception:
        return False
    return key == settings.PAYME_KEY


def _payme_error(req_id, code, message):
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {
            "code": code,
            "message": {"uz": message, "ru": message, "en": message},
        },
    }


@router.post("/payme")
async def payme_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    req_id = body.get("id")
    method = body.get("method")
    params = body.get("params", {})

    if not _payme_auth(request):
        return _payme_error(req_id, PAYME_ERR_INSUFFICIENT_PRIVILEGE, "Ruxsat yo'q")

    # ── CheckPerformTransaction ──
    if method == "CheckPerformTransaction":
        order = _payme_find_order(db, params)
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_ACCOUNT_NOT_FOUND, "Buyurtma topilmadi"
            )
        if params.get("amount") != order.amount * 100:
            return _payme_error(req_id, PAYME_ERR_INVALID_AMOUNT, "Summa noto'g'ri")
        return {"jsonrpc": "2.0", "id": req_id, "result": {"allow": True}}

    # ── CreateTransaction ──
    if method == "CreateTransaction":
        order = _payme_find_order(db, params)
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_ACCOUNT_NOT_FOUND, "Buyurtma topilmadi"
            )
        if params.get("amount") != order.amount * 100:
            return _payme_error(req_id, PAYME_ERR_INVALID_AMOUNT, "Summa noto'g'ri")

        txn = params.get("id")
        if order.provider_transaction_id and order.provider_transaction_id != txn:
            return _payme_error(
                req_id, PAYME_ERR_CANNOT_PERFORM, "Boshqa tranzaksiya mavjud"
            )

        order.provider = "payme"
        order.provider_transaction_id = txn
        order.provider_state = PAYME_STATE_CREATED
        db.commit()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "create_time": int(_now().timestamp() * 1000),
                "transaction": str(order.id),
                "state": PAYME_STATE_CREATED,
            },
        }

    # ── PerformTransaction ──
    if method == "PerformTransaction":
        order = _payme_find_by_txn(db, params.get("id"))
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
            )
        if order.provider_state != PAYME_STATE_PERFORMED:
            _grant_access(db, order)
            order.provider_state = PAYME_STATE_PERFORMED
            db.commit()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "perform_time": int((order.paid_at or _now()).timestamp() * 1000),
                "transaction": str(order.id),
                "state": PAYME_STATE_PERFORMED,
            },
        }

    # ── CancelTransaction ──
    if method == "CancelTransaction":
        order = _payme_find_by_txn(db, params.get("id"))
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
            )
        order.status = "cancelled"
        order.cancel_reason = params.get("reason")
        order.provider_state = -abs(order.provider_state or 1)
        db.commit()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "cancel_time": int(_now().timestamp() * 1000),
                "transaction": str(order.id),
                "state": order.provider_state,
            },
        }

    # ── CheckTransaction ──
    if method == "CheckTransaction":
        order = _payme_find_by_txn(db, params.get("id"))
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
            )
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "create_time": int(order.created_at.timestamp() * 1000),
                "perform_time": (
                    int(order.paid_at.timestamp() * 1000) if order.paid_at else 0
                ),
                "cancel_time": 0,
                "transaction": str(order.id),
                "state": order.provider_state or 0,
                "reason": order.cancel_reason,
            },
        }

    return _payme_error(req_id, PAYME_ERR_METHOD_NOT_FOUND, "Metod topilmadi")


def _payme_find_order(db: Session, params: dict) -> Order | None:
    account = params.get("account", {})
    order_id = account.get("order_id")
    if not order_id:
        return None
    return db.query(Order).filter(Order.id == int(order_id)).first()


def _payme_find_by_txn(db: Session, txn: str) -> Order | None:
    if not txn:
        return None
    return db.query(Order).filter(Order.provider_transaction_id == txn).first()


# ──────────────────────────────────────────────────────────────────
# CLICK — Prepare + Complete
# ──────────────────────────────────────────────────────────────────
def _click_signature(*parts) -> str:
    return hashlib.md5("".join(str(p) for p in parts).encode()).hexdigest()


@router.post("/click/prepare")
async def click_prepare(request: Request, db: Session = Depends(get_db)):
    form = dict((await request.form()))
    order_id = form.get("merchant_trans_id")
    order = (
        db.query(Order).filter(Order.id == int(order_id)).first() if order_id else None
    )
    if not order:
        return {"error": -5, "error_note": "Buyurtma topilmadi"}

    # sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
    #                   + amount + action + sign_time)
    expected = _click_signature(
        form.get("click_trans_id"),
        form.get("service_id"),
        settings.CLICK_SECRET_KEY,
        form.get("merchant_trans_id"),
        form.get("amount"),
        form.get("action"),
        form.get("sign_time"),
    )
    if expected != form.get("sign_string"):
        return {"error": -1, "error_note": "Imzo noto'g'ri"}

    if abs(float(form.get("amount", 0)) - (order.amount or 0)) > 0.01:
        return {"error": -2, "error_note": "Summa mos kelmadi"}
    if order.status == "paid":
        return {"error": -4, "error_note": "Allaqachon to'langan"}

    order.provider = "click"
    order.provider_transaction_id = form.get("click_trans_id")
    db.commit()
    return {
        "error": 0,
        "error_note": "Success",
        "click_trans_id": form.get("click_trans_id"),
        "merchant_trans_id": order_id,
        "merchant_prepare_id": order.id,
    }


@router.post("/click/complete")
async def click_complete(request: Request, db: Session = Depends(get_db)):
    form = dict((await request.form()))
    order_id = form.get("merchant_trans_id")
    order = (
        db.query(Order).filter(Order.id == int(order_id)).first() if order_id else None
    )
    if not order:
        return {"error": -5, "error_note": "Buyurtma topilmadi"}

    expected = _click_signature(
        form.get("click_trans_id"),
        form.get("service_id"),
        settings.CLICK_SECRET_KEY,
        form.get("merchant_trans_id"),
        form.get("merchant_prepare_id"),
        form.get("amount"),
        form.get("action"),
        form.get("sign_time"),
    )
    if expected != form.get("sign_string"):
        return {"error": -1, "error_note": "Imzo noto'g'ri"}

    # error < 0 → Click bekor qildi
    if int(form.get("error", 0)) < 0:
        order.status = "cancelled"
        db.commit()
        return {"error": -9, "error_note": "Tranzaksiya bekor qilindi"}

    # Summa tekshiruvi
    if abs(float(form.get("amount", 0)) - (order.amount or 0)) > 0.01:
        return {"error": -2, "error_note": "Summa mos kelmadi"}

    if order.status != "paid":
        _grant_access(db, order)
    db.commit()
    return {
        "error": 0,
        "error_note": "Success",
        "click_trans_id": form.get("click_trans_id"),
        "merchant_trans_id": order_id,
        "merchant_confirm_id": order.id,
    }