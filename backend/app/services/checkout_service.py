"""Checkout: buyurtma yaratish, kupon qo'llash va to'lov URL'ini qurish.

`build_pay_url()` provider'ga qarab redirect havolasini qaytaradi va
checkout_experience.py (quote / checkout-safe / retry) ham shundan
foydalanadi — shuning uchun u router'da emas, xizmat qatlamida turadi.
"""

import base64

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User
from app.services.payment_service import grant_access

PROVIDERS = ("payme", "click")


def build_pay_url(provider: str, order: Order) -> str:
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


def create_checkout(
    db: Session, email: str, *, course_id: int, provider: str, coupon_code: str | None
) -> dict:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")

    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active == True)  # noqa: E712
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
        order = Order(user_id=user.id, course_id=course.id, amount=0, provider="free")
        db.add(order)
        db.flush()
        grant_access(db, order)
        db.commit()
        return {"free": True, "order_id": order.id, "status": "paid"}

    # Provider ATAYLAB order yaratilishidan OLDIN tekshiriladi. Ilgari u
    # faqat build_pay_url() ichida, ya'ni commit'dan KEYIN tekshirilardi —
    # natijada noto'g'ri provider 400 qaytarsa ham bazada osilgan pending
    # order qolib ketardi.
    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail="Noma'lum to'lov provayderi")

    # Kupon
    discount = 0
    normalized_coupon = None
    if coupon_code:
        coupon = (
            db.query(Coupon).filter(Coupon.code == coupon_code.strip().upper()).first()
        )
        if not coupon or not coupon.is_valid():
            raise HTTPException(
                status_code=400, detail="Kupon yaroqsiz yoki muddati o'tgan"
            )
        discount = coupon.apply(base_amount)
        normalized_coupon = coupon.code

    amount = max(0, base_amount - discount)

    order = Order(
        user_id=user.id,
        course_id=course.id,
        amount=amount,
        provider=provider,
        coupon_code=normalized_coupon,
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
        "provider": provider,
        "pay_url": build_pay_url(provider, order),
    }


def order_status(db: Session, email: str, order_id: int) -> dict:
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
