"""To'lov holatiga qarab kursga kirishni beruvchi va yopuvchi yagona xizmat.

Payme ham, Click ham to'lovni tasdiqlaganda `grant_access()`, bekor
qilganda `revoke_access()` chaqiradi. Shunda "kirish berish" va "kirishni
yopish" mantiqi bitta joyda turadi va ikkita provider o'rtasida farq
qilib ketmaydi.

Ilgari bu fayl ishlatilmaydigan dublikat `grant_access()` saqlardi: u
kupon hisoblagichini oshirmasdi va `revoke_access()` juftini bilmasdi.
Haqiqiy mantiq `routers/payments.py` ichida edi. Endi manba bitta.
"""

import logging
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.payment import Payment
from app.models.progress import Progress

logger = logging.getLogger(__name__)


def _now():
    return datetime.now(UTC)


def grant_access(db: Session, order: Order) -> None:
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


def revoke_access(db: Session, order: Order, *, reason=None) -> None:
    """KRITIK: bekor qilingan to'lovda kursga kirishni yopadi.

    Avval CancelTransaction faqat `order.status = "cancelled"` qilardi —
    Enrollment esa joyida qolardi. Natijada "to'la -> o'qi -> pulni qaytar"
    sxemasi bilan kursni bepul qo'lga kiritish mumkin edi.

    grant_access() ning to'liq teskarisi: Enrollment, Progress, legacy
    Payment va kupon hisoblagichi tozalanadi.
    """
    was_paid = order.status == "paid"

    order.status = "cancelled"
    if reason is not None:
        order.cancel_reason = reason
    order.cancel_time_ms = int(_now().timestamp() * 1000)
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

    # Legacy Payment yozuvini ham yopamiz (admin panel shundan o'qiydi)
    db.query(Payment).filter(
        Payment.user_id == order.user_id,
        Payment.course_id == order.course_id,
        Payment.status == "paid",
    ).update({Payment.status: "refunded"}, synchronize_session=False)

    # Kupon hisoblagichini qaytaramiz
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
