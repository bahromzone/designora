"""
Payments Router — monetizatsiya yadrosi.

Prefix: /api/payments

- POST /checkout          → Order yaratadi (pending), to'lov URL qaytaradi
- GET  /orders/{order_id} → buyurtma holatini tekshirish (frontend polling)
- POST /payme             → Payme Merchant API webhook (JSON-RPC 2.0)
- POST /click/prepare     → Click Prepare bosqichi
- POST /click/complete    → Click Complete bosqichi

Bu fayl ATAYLAB faqat transport qatlami: so'rovni o'qiydi va provayder
protokoliga javob qaytaradi. Qolgan mas'uliyatlar servislarda:

- `services/payments/access.py`        — Enrollment, Progress, Payment, kupon
- `services/payments/payme_gateway.py` — JSON-RPC auth, holat va xato kodlari
- `services/payments/click_gateway.py` — kalit, md5 imzo, xato kodlari
- `services/payments/checkout_url.py`  — provayder redirect URL'i

XAVFSIZLIK: ikkala webhook ham fail closed ishlaydi. Kalit sozlanmagan bo'lsa
(`payme_gateway.authorize`, `click_gateway.secret`) so'rov rad etiladi, aks
holda istalgan odam "to'ladim" deb pullik kursni bepul ocha olardi.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User
from app.services.payments import click_gateway, payme_gateway
from app.services.payments.access import grant_access, revoke_access
from app.services.payments.checkout_url import build_pay_url
from app.services.payments.primitives import safe_float, safe_int, to_millis

router = APIRouter(prefix="/api/payments", tags=["Payments"])


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
        .filter(Course.id == body.course_id, Course.is_active.is_(True))
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    if (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="Siz allaqachon bu kursga egasiz")

    base_amount = course.price or 0

    # Bepul kurs — to'lovsiz to'g'ridan-to'g'ri enroll
    if base_amount <= 0:
        order = Order(user_id=user.id, course_id=course.id, amount=0, provider="free")
        db.add(order)
        db.flush()
        grant_access(db, order)
        db.commit()
        return {"free": True, "order_id": order.id, "status": "paid"}

    amount, discount, coupon_code = _apply_coupon(db, base_amount, body.coupon_code)

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

    return {
        "free": False,
        "order_id": order.id,
        "amount": amount,
        "discount": discount,
        "provider": body.provider,
        "pay_url": build_pay_url(body.provider, order),
    }


def _apply_coupon(
    db: Session, base_amount: int, code: str | None
) -> tuple[int, int, str | None]:
    if not code:
        return base_amount, 0, None

    coupon = db.query(Coupon).filter(Coupon.code == code.strip().upper()).first()
    if not coupon or not coupon.is_valid():
        raise HTTPException(
            status_code=400, detail="Kupon yaroqsiz yoki muddati o'tgan"
        )
    discount = coupon.apply(base_amount)
    return max(0, base_amount - discount), discount, coupon.code


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
def _payme_check_perform(db: Session, req_id, params: dict) -> dict:
    order = payme_gateway.find_order(db, params)
    if not order:
        return payme_gateway.error(
            req_id, payme_gateway.ERR_ACCOUNT_NOT_FOUND, "Buyurtma topilmadi"
        )
    if not payme_gateway.amount_matches(params, order):
        return payme_gateway.error(
            req_id, payme_gateway.ERR_INVALID_AMOUNT, "Summa noto'g'ri"
        )
    return payme_gateway.result(req_id, {"allow": True})


def _payme_create(db: Session, req_id, params: dict) -> dict:
    order = payme_gateway.find_order(db, params)
    if not order:
        return payme_gateway.error(
            req_id, payme_gateway.ERR_ACCOUNT_NOT_FOUND, "Buyurtma topilmadi"
        )
    if not payme_gateway.amount_matches(params, order):
        return payme_gateway.error(
            req_id, payme_gateway.ERR_INVALID_AMOUNT, "Summa noto'g'ri"
        )

    txn = params.get("id")
    if order.provider_transaction_id and order.provider_transaction_id != txn:
        return payme_gateway.error(
            req_id, payme_gateway.ERR_CANNOT_PERFORM, "Boshqa tranzaksiya mavjud"
        )
    if order.status == "cancelled":
        return payme_gateway.error(
            req_id, payme_gateway.ERR_CANNOT_PERFORM, "Buyurtma bekor qilingan"
        )

    order.provider = "payme"
    order.provider_transaction_id = txn
    order.provider_state = payme_gateway.STATE_CREATED
    db.commit()
    return payme_gateway.result(
        req_id,
        {
            "create_time": to_millis(),
            "transaction": str(order.id),
            "state": payme_gateway.STATE_CREATED,
        },
    )


def _payme_perform(db: Session, req_id, params: dict) -> dict:
    order = payme_gateway.find_by_transaction(db, params.get("id"))
    if not order:
        return payme_gateway.error(
            req_id, payme_gateway.ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
        )
    # Bekor qilingan buyurtmani qayta "to'landi" qilib bo'lmaydi.
    if order.status == "cancelled":
        return payme_gateway.error(
            req_id, payme_gateway.ERR_CANNOT_PERFORM, "Tranzaksiya bekor qilingan"
        )
    if order.provider_state != payme_gateway.STATE_PERFORMED:
        grant_access(db, order)
        order.provider_state = payme_gateway.STATE_PERFORMED
        db.commit()
    return payme_gateway.result(
        req_id,
        {
            "perform_time": to_millis(order.paid_at),
            "transaction": str(order.id),
            "state": payme_gateway.STATE_PERFORMED,
        },
    )


def _payme_cancel(db: Session, req_id, params: dict) -> dict:
    order = payme_gateway.find_by_transaction(db, params.get("id"))
    if not order:
        return payme_gateway.error(
            req_id, payme_gateway.ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
        )
    # Bekor holati: yaratilgan bo'lsa -1, bajarilgan bo'lsa -2.
    cancel_state = -abs(order.provider_state or 1)
    # Statusni o'zgartirish yetarli emas — Enrollment ham bekor qilinadi,
    # aks holda refunddan keyin kurs ochiq qoladi.
    revoke_access(db, order, reason=params.get("reason"))
    order.provider_state = cancel_state
    db.commit()
    return payme_gateway.result(
        req_id,
        {
            "cancel_time": order.cancel_time_ms,
            "transaction": str(order.id),
            "state": order.provider_state,
        },
    )


def _payme_check(db: Session, req_id, params: dict) -> dict:
    order = payme_gateway.find_by_transaction(db, params.get("id"))
    if not order:
        return payme_gateway.error(
            req_id, payme_gateway.ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
        )
    return payme_gateway.result(
        req_id,
        {
            "create_time": to_millis(order.created_at),
            "perform_time": to_millis(order.paid_at) if order.paid_at else 0,
            "cancel_time": order.cancel_time_ms or 0,
            "transaction": str(order.id),
            "state": order.provider_state or 0,
            "reason": order.cancel_reason,
        },
    )


PAYME_METHODS = {
    "CheckPerformTransaction": _payme_check_perform,
    "CreateTransaction": _payme_create,
    "PerformTransaction": _payme_perform,
    "CancelTransaction": _payme_cancel,
    "CheckTransaction": _payme_check,
}


@router.post("/payme")
async def payme_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}

    req_id = body.get("id")
    params = body.get("params") or {}
    if not isinstance(params, dict):
        params = {}

    # Auth HAR DOIM metod dispatch'idan oldin.
    if not payme_gateway.authorize(request):
        return payme_gateway.error(
            req_id, payme_gateway.ERR_INSUFFICIENT_PRIVILEGE, "Ruxsat yo'q"
        )

    handler = PAYME_METHODS.get(body.get("method"))
    if handler is None:
        return payme_gateway.error(
            req_id, payme_gateway.ERR_METHOD_NOT_FOUND, "Metod topilmadi"
        )
    return handler(db, req_id, params)


# ──────────────────────────────────────────────────────────────────
# CLICK — Prepare + Complete
# ──────────────────────────────────────────────────────────────────
@router.post("/click/prepare")
async def click_prepare(request: Request, db: Session = Depends(get_db)):
    secret = click_gateway.secret()
    if not secret:
        return click_gateway.not_configured("prepare")

    form = dict(await request.form())
    order = click_gateway.find_order(db, form.get("merchant_trans_id"))
    if not order:
        return click_gateway.failure(
            click_gateway.ERR_ORDER_NOT_FOUND, "Buyurtma topilmadi"
        )

    # sign_string = md5(click_trans_id + service_id + SECRET_KEY
    #                   + merchant_trans_id + amount + action + sign_time)
    expected = click_gateway.signature(
        form.get("click_trans_id"),
        form.get("service_id"),
        secret,
        form.get("merchant_trans_id"),
        form.get("amount"),
        form.get("action"),
        form.get("sign_time"),
    )
    if not click_gateway.signature_matches(expected, form.get("sign_string")):
        return click_gateway.failure(click_gateway.ERR_SIGN, "Imzo noto'g'ri")

    amount = safe_float(form.get("amount"))
    if amount is None or abs(amount - (order.amount or 0)) > 0.01:
        return click_gateway.failure(click_gateway.ERR_AMOUNT, "Summa mos kelmadi")
    if order.status == "paid":
        return click_gateway.failure(
            click_gateway.ERR_ALREADY_PAID, "Allaqachon to'langan"
        )
    if order.status == "cancelled":
        return click_gateway.failure(
            click_gateway.ERR_CANCELLED, "Buyurtma bekor qilingan"
        )

    order.provider = "click"
    order.provider_transaction_id = form.get("click_trans_id")
    db.commit()
    return click_gateway.success(
        order,
        form.get("click_trans_id"),
        merchant_prepare_id=order.id,
    )


@router.post("/click/complete")
async def click_complete(request: Request, db: Session = Depends(get_db)):
    secret = click_gateway.secret()
    if not secret:
        return click_gateway.not_configured("complete")

    form = dict(await request.form())
    order = click_gateway.find_order(db, form.get("merchant_trans_id"))
    if not order:
        return click_gateway.failure(
            click_gateway.ERR_ORDER_NOT_FOUND, "Buyurtma topilmadi"
        )

    expected = click_gateway.signature(
        form.get("click_trans_id"),
        form.get("service_id"),
        secret,
        form.get("merchant_trans_id"),
        form.get("merchant_prepare_id"),
        form.get("amount"),
        form.get("action"),
        form.get("sign_time"),
    )
    if not click_gateway.signature_matches(expected, form.get("sign_string")):
        return click_gateway.failure(click_gateway.ERR_SIGN, "Imzo noto'g'ri")

    # error < 0 → Click bekor qildi (yoki pul qaytarildi): kirish ham yopiladi.
    if (safe_int(form.get("error")) or 0) < 0:
        revoke_access(db, order)
        db.commit()
        return click_gateway.failure(
            click_gateway.ERR_CANCELLED, "Tranzaksiya bekor qilindi"
        )

    amount = safe_float(form.get("amount"))
    if amount is None or abs(amount - (order.amount or 0)) > 0.01:
        return click_gateway.failure(click_gateway.ERR_AMOUNT, "Summa mos kelmadi")

    if order.status == "cancelled":
        return click_gateway.failure(
            click_gateway.ERR_CANCELLED, "Buyurtma bekor qilingan"
        )

    if order.status != "paid":
        grant_access(db, order)
    db.commit()
    return click_gateway.success(
        order,
        form.get("click_trans_id"),
        merchant_confirm_id=order.id,
    )
