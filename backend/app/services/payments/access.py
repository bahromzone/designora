"""Kursga kirishni berish va qaytarib olish.

Bu to'lov yon effektlarining YAGONA manzili. Payme ham, Click ham to'lovni
tasdiqlaganda `grant_access()`, bekor qilganda `revoke_access()` chaqiradi.
Mantiq bitta joyda turishi shart: ilgari u `routers/payments.py` va
`services/payment_service.py` ichida ikki xil, bir-biridan farq qiladigan
nusxada yashagan.
"""

import logging

from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.payment import Payment
from app.models.progress import Progress
from app.services.payments.primitives import now, to_millis

logger = logging.getLogger(__name__)


def grant_access(db: Session, order: Order) -> None:
    """Order to'landi: Enrollment, Progress, legacy Payment va kupon hisobi.

    Idempotent: allaqachon `paid` bo'lgan order qayta ishlanmaydi. Payme
    PerformTransaction'ni bir necha marta yuborishi normal holat.
    """
    if order.status == "paid":
        return

    order.status = "paid"
    order.paid_at = now()

    if order.course_id:
        _enroll(db, order)

    # Legacy Payment yozuvi — admin panel shundan o'qiydi.
    db.add(
        Payment(
            user_id=order.user_id,
            course_id=order.course_id,
            amount=order.amount,
            status="paid",
            provider=order.provider,
        )
    )

    if order.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == order.coupon_code).first()
        if coupon:
            coupon.used_count = (coupon.used_count or 0) + 1


def _enroll(db: Session, order: Order) -> None:
    """Enrollment va Progress yaratadi, kurs studentlar sonini oshiradi."""
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == order.user_id,
            Enrollment.course_id == order.course_id,
        )
        .first()
    )
    if existing:
        return

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

    tracked = (
        db.query(Progress)
        .filter(
            Progress.user_id == order.user_id,
            Progress.course_id == order.course_id,
        )
        .first()
    )
    if not tracked:
        db.add(
            Progress(
                user_id=order.user_id,
                course_id=order.course_id,
                percent=0,
                minutes_spent=0,
            )
        )


def revoke_access(db: Session, order: Order, *, reason=None) -> None:
    """`grant_access()` ning to'liq teskarisi.

    Faqat `order.status`ni "cancelled" qilish YETARLI EMAS: Enrollment joyida
    qolsa "to'la, o'qi, keyin pulni qaytar" sxemasi bilan pullik kurs bepul
    qo'lga kiritiladi. Shuning uchun Enrollment, Progress, legacy Payment va
    kupon hisoblagichi ham qaytariladi.
    """
    was_paid = order.status == "paid"

    order.status = "cancelled"
    if reason is not None:
        order.cancel_reason = reason
    order.cancel_time_ms = to_millis()
    if was_paid:
        order.refund_status = "refunded"

    if not order.course_id:
        return

    removed = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == order.user_id,
            Enrollment.course_id == order.course_id,
        )
        .delete(synchronize_session=False)
    )

    if removed:
        db.query(Progress).filter(
            Progress.user_id == order.user_id,
            Progress.course_id == order.course_id,
        ).delete(synchronize_session=False)

        course = db.query(Course).filter(Course.id == order.course_id).first()
        if course:
            course.students_count = max(0, (course.students_count or 0) - 1)

    # Legacy Payment yozuvini ham yopamiz — admin panel shundan o'qiydi.
    db.query(Payment).filter(
        Payment.user_id == order.user_id,
        Payment.course_id == order.course_id,
        Payment.status == "paid",
    ).update({Payment.status: "refunded"}, synchronize_session=False)

    if was_paid and order.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == order.coupon_code).first()
        if coupon and (coupon.used_count or 0) > 0:
            coupon.used_count = coupon.used_count - 1

    if was_paid:
        logger.warning(
            "To'lov bekor qilindi — kirish yopildi: order=%s user=%s course=%s",
            order.id,
            order.user_id,
            order.course_id,
        )
