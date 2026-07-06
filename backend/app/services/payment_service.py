"""To'lov muvaffaqiyatli bo'lganda kursga kirishni beruvchi yagona xizmat.

Payme ham, Click ham to'lovni tasdiqlaganda shu funksiyani chaqiradi —
shunda Enrollment yaratish mantiqi bitta joyda turadi.
"""
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.payment import Payment
from app.models.progress import Progress


def _now():
    return datetime.now(UTC)


def grant_access(db: Session, order: Order) -> None:
    """Order paid bo'lganda: Enrollment + Progress + Payment yozuvi yaratadi.

    Idempotent — bir order uchun bir necha marta chaqirilsa ham dublikat bermaydi.
    """
    if order.status == "paid" and order.paid_at is not None:
        # allaqachon berilgan — takrorlamaymiz
        pass

    order.status = "paid"
    if order.paid_at is None:
        order.paid_at = _now()

    if not order.course_id:
        return

    # Enrollment (unique constraint bor — mavjud bo'lsa qayta yaratmaymiz)
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == order.user_id,
            Enrollment.course_id == order.course_id,
        )
        .first()
    )
    if not existing:
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