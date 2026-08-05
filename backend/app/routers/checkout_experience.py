# ruff: noqa: E501
"""Roadmap 3.22 checkout quote, retry, receipt and refund visibility."""

from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.order import Order
from app.models.user import User
from app.routers.payments import _build_pay_url

router = APIRouter(prefix="/api/payments", tags=["Checkout UX"])
PROVIDERS = {"payme", "click"}


class SafeCheckoutBody(BaseModel):
    course_id: int
    provider: Literal["payme", "click"]
    coupon_code: str | None = None
    idempotency_key: str | None = Field(default=None, min_length=16, max_length=128)


def _user(db: Session, email: str) -> User:
    row = db.query(User).filter(User.email == email).first()
    if not row:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return row


def _price(
    db: Session, course: Course, code: str | None
) -> tuple[int, int, str | None]:
    discount = 0
    normalized = None
    if code:
        coupon = db.query(Coupon).filter(Coupon.code == code.strip().upper()).first()
        if not coupon or not coupon.is_valid():
            raise HTTPException(
                status_code=400, detail="Kupon yaroqsiz yoki muddati o'tgan"
            )
        discount = coupon.apply(course.price or 0)
        normalized = coupon.code
    return max(0, (course.price or 0) - discount), discount, normalized


def _order_response(order: Order, *, reused: bool) -> dict:
    return {
        "order_id": order.id,
        "status": order.status,
        "amount": order.amount,
        "discount": order.discount_amount,
        "provider": order.provider,
        "pay_url": (
            _build_pay_url(order.provider, order) if order.status == "pending" else None
        ),
        "reused": reused,
    }


@router.get("/quote/{course_id}")
def quote(
    course_id: int, coupon_code: str | None = None, db: Session = Depends(get_db)
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active.is_(True))
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    total, discount, code = _price(db, course, coupon_code)
    return {
        "course_id": course.id,
        "title": course.title,
        "original_amount": course.price or 0,
        "discount": discount,
        "total": total,
        "currency": "UZS",
        "coupon_code": code,
        "providers": sorted(PROVIDERS),
    }


@router.post("/checkout-safe")
def safe_checkout(
    body: SafeCheckoutBody,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    course = (
        db.query(Course)
        .filter(Course.id == body.course_id, Course.is_active.is_(True))
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    total, discount, code = _price(db, course, body.coupon_code)

    if body.idempotency_key:
        keyed = (
            db.query(Order)
            .filter(Order.idempotency_key == body.idempotency_key)
            .first()
        )
        if keyed:
            if keyed.user_id != user.id or keyed.course_id != course.id:
                raise HTTPException(status_code=409, detail="Idempotency key band")
            if keyed.provider != body.provider:
                raise HTTPException(
                    status_code=409, detail="Provider o'zgartirilmadi"
                )
            return _order_response(keyed, reused=True)

    cutoff = datetime.now(UTC) - timedelta(minutes=15)
    pending = (
        db.query(Order)
        .filter(
            Order.user_id == user.id,
            Order.course_id == course.id,
            Order.status == "pending",
            Order.provider == body.provider,
            Order.created_at >= cutoff,
        )
        .order_by(Order.id.desc())
        .first()
    )
    if pending:
        if body.idempotency_key and pending.idempotency_key is None:
            pending.idempotency_key = body.idempotency_key
            db.commit()
        return _order_response(pending, reused=True)

    order = Order(
        user_id=user.id,
        course_id=course.id,
        original_amount=course.price or 0,
        amount=total,
        discount_amount=discount,
        coupon_code=code,
        provider=body.provider,
        status="pending",
        idempotency_key=body.idempotency_key,
    )
    db.add(order)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if body.idempotency_key:
            keyed = (
                db.query(Order)
                .filter(
                    Order.user_id == user.id,
                    Order.idempotency_key == body.idempotency_key,
                )
                .first()
            )
            if keyed:
                return _order_response(keyed, reused=True)
        raise HTTPException(status_code=409, detail="Checkout qayta yuborildi")
    db.refresh(order)
    return _order_response(order, reused=False)


@router.post("/orders/{order_id}/retry")
def retry(
    order_id: int, email: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    user = _user(db, email)
    order = (
        db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    if order.status == "paid":
        raise HTTPException(status_code=409, detail="Buyurtma allaqachon to'langan")
    order.status = "pending"
    order.failure_reason = None
    order.provider_transaction_id = None
    order.provider_state = 0
    db.commit()
    return {
        "order_id": order.id,
        "status": order.status,
        "pay_url": _build_pay_url(order.provider, order),
    }


@router.get("/orders/{order_id}/receipt")
def receipt(
    order_id: int, email: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    user = _user(db, email)
    order = (
        db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    )
    if not order or order.status != "paid":
        raise HTTPException(status_code=404, detail="Chek topilmadi")
    if not order.receipt_number:
        order.receipt_number = f"DSN-{order.id:08d}"
        db.commit()
    return {
        "receipt_number": order.receipt_number,
        "order_id": order.id,
        "course_id": order.course_id,
        "original_amount": order.original_amount
        or order.amount + (order.discount_amount or 0),
        "discount": order.discount_amount or 0,
        "paid_amount": order.amount,
        "currency": order.currency,
        "provider": order.provider,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "refund_status": order.refund_status or "none",
    }
