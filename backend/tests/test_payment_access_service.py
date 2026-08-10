"""`services/payments/access.py` uchun bevosita testlar.

Ilgari grant/revoke faqat Payme va Click webhooklari orqali, bilvosita
tekshirilardi. Servis o'zi qoplanmagani uchun undan ikkinchi, farq qiladigan
nusxa paydo bo'lgan va hech kim sezmagan.
"""

from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.payment import Payment
from app.models.progress import Progress
from app.models.user import User
from app.services.payments.access import grant_access, revoke_access


def _order(db, *, price=100000, coupon_code=None):
    user = User(email="access@example.com", name="buyer", role="user", is_active=True)
    course = Course(title="Kurs", price=price, is_active=True, status="published")
    db.add_all([user, course])
    db.commit()
    order = Order(
        user_id=user.id,
        course_id=course.id,
        amount=price,
        status="pending",
        provider="payme",
        coupon_code=coupon_code,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order, course


def test_grant_access_is_idempotent(db_session):
    order, course = _order(db_session)

    grant_access(db_session, order)
    db_session.commit()
    grant_access(db_session, order)
    db_session.commit()

    assert order.status == "paid"
    assert order.paid_at is not None
    assert db_session.query(Enrollment).count() == 1
    assert db_session.query(Progress).count() == 1
    # Ikkinchi chaqiruv qo'shimcha Payment yozmasligi shart, aks holda admin
    # panel bitta to'lovni ikki marta ko'rsatadi.
    assert db_session.query(Payment).count() == 1
    db_session.refresh(course)
    assert course.students_count == 1


def test_revoke_access_reverses_every_side_effect(db_session):
    db_session.add(Coupon(code="SALE20", type="percent", value=20, is_active=True))
    db_session.commit()
    order, course = _order(db_session, coupon_code="SALE20")

    grant_access(db_session, order)
    db_session.commit()
    coupon = db_session.query(Coupon).filter(Coupon.code == "SALE20").first()
    assert coupon.used_count == 1

    revoke_access(db_session, order, reason=5)
    db_session.commit()

    assert order.status == "cancelled"
    assert order.refund_status == "refunded"
    assert order.cancel_reason is not None
    assert order.cancel_time_ms > 0
    assert db_session.query(Enrollment).count() == 0
    assert db_session.query(Progress).count() == 0
    assert db_session.query(Payment).filter(Payment.status == "paid").count() == 0
    db_session.refresh(coupon)
    assert coupon.used_count == 0
    db_session.refresh(course)
    assert course.students_count == 0


def test_revoke_without_paid_order_does_not_mark_refund(db_session):
    """Pending order bekor qilinsa refund emas, oddiy bekor qilish bo'ladi."""
    order, _ = _order(db_session)

    revoke_access(db_session, order)
    db_session.commit()

    assert order.status == "cancelled"
    assert order.refund_status != "refunded"
    assert db_session.query(Enrollment).count() == 0


def test_legacy_payment_service_delegates_to_single_implementation():
    """Dublikat qaytib kelmasin: eski modul aynan shu funksiyalarni eksport qiladi."""
    from app.services import payment_service

    assert payment_service.grant_access is grant_access
    assert payment_service.revoke_access is revoke_access
