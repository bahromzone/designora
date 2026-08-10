"""To'lov qatlami xizmatlarga bo'lingandan keyingi regressiya testlari.

Bu testlar refactor natijasini emas, XULQNI qulflaydi: router yupqa
bo'lgandan keyin ham checkout, grant va revoke bir xil ishlashi kerak.
"""

from app.core.security import create_access_token
from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.payment import Payment
from app.models.progress import Progress
from app.models.user import User
from app.services.payment_service import grant_access, revoke_access


def _user(db, email="split@example.com"):
    user = User(email=email, name="buyer", role="user", is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _course(db, price=100000):
    course = Course(
        title="Split kurs",
        price=price,
        is_active=True,
        status="published",
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_invalid_provider_leaves_no_pending_order(client, db_session):
    """Noto'g'ri provider order yaratilishidan OLDIN rad etilishi kerak.

    Ilgari provider faqat pay_url qurilishida, ya'ni commit'dan keyin
    tekshirilardi — 400 qaytsa ham bazada osilgan pending order qolardi.
    """
    _user(db_session)
    course = _course(db_session)
    resp = client.post(
        "/api/payments/checkout",
        json={"course_id": course.id, "provider": "bitcoin"},
        headers=_auth("split@example.com"),
    )
    assert resp.status_code == 400
    assert db_session.query(Order).count() == 0


def test_free_course_still_enrolls_without_provider_check(client, db_session):
    """Bepul kursda provider ishlatilmaydi, shuning uchun tekshirilmaydi."""
    _user(db_session)
    course = _course(db_session, price=0)
    resp = client.post(
        "/api/payments/checkout",
        json={"course_id": course.id, "provider": "payme"},
        headers=_auth("split@example.com"),
    )
    assert resp.status_code == 200
    assert resp.json()["free"] is True
    assert db_session.query(Enrollment).count() == 1


def test_grant_then_revoke_is_a_full_round_trip(db_session):
    """revoke_access() grant_access() ning to'liq teskarisi bo'lishi kerak.

    Ilgari services/payment_service.py ishlatilmaydigan dublikat
    grant_access() saqlardi: u kupon hisoblagichini bilmasdi. Endi manba
    bitta, shuning uchun ikki tomon ham shu testda tekshiriladi.
    """
    user = _user(db_session, email="roundtrip@example.com")
    course = _course(db_session)
    coupon = Coupon(code="ROUND10", type="percent", value=10, is_active=True)
    db_session.add(coupon)
    db_session.commit()

    order = Order(
        user_id=user.id,
        course_id=course.id,
        amount=90000,
        provider="payme",
        status="pending",
        coupon_code="ROUND10",
    )
    db_session.add(order)
    db_session.commit()

    grant_access(db_session, order)
    db_session.commit()
    db_session.expire_all()

    assert order.status == "paid"
    assert order.paid_at is not None
    assert db_session.query(Enrollment).count() == 1
    assert db_session.query(Progress).count() == 1
    assert db_session.query(Payment).filter(Payment.status == "paid").count() == 1

    granted_course = db_session.query(Course).filter(Course.id == course.id).one()
    granted_coupon = db_session.query(Coupon).filter(Coupon.code == "ROUND10").one()
    assert granted_course.students_count == 1
    assert granted_coupon.used_count == 1

    revoke_access(db_session, order, reason=5)
    db_session.commit()
    db_session.expire_all()

    assert order.status == "cancelled"
    assert order.refund_status == "refunded"
    assert db_session.query(Enrollment).count() == 0
    assert db_session.query(Progress).count() == 0
    assert db_session.query(Payment).filter(Payment.status == "paid").count() == 0
    assert db_session.query(Payment).filter(Payment.status == "refunded").count() == 1

    revoked_course = db_session.query(Course).filter(Course.id == course.id).one()
    revoked_coupon = db_session.query(Coupon).filter(Coupon.code == "ROUND10").one()
    assert revoked_course.students_count == 0
    assert revoked_coupon.used_count == 0


def test_grant_access_is_idempotent(db_session):
    user = _user(db_session, email="idem@example.com")
    course = _course(db_session)
    order = Order(
        user_id=user.id,
        course_id=course.id,
        amount=100000,
        provider="click",
        status="pending",
    )
    db_session.add(order)
    db_session.commit()

    grant_access(db_session, order)
    grant_access(db_session, order)
    db_session.commit()
    db_session.expire_all()

    assert db_session.query(Enrollment).count() == 1
    assert db_session.query(Payment).count() == 1
