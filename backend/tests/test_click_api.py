"""Click Prepare/Complete webhook testlari (BOSQICH 2)."""

import hashlib

from app.core.security import create_access_token  # noqa: F401 (pattern izchilligi)
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User

SECRET = "test-click-secret"
SERVICE_ID = "svc-1"


def _make_user(db, email="buyer@example.com"):
    user = User(email=email, name="buyer", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_course(db, price=100000):
    course = Course(title="Pullik", price=price, is_active=True, status="published")
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _order(db, user_id, course_id, amount=100000):
    order = Order(user_id=user_id, course_id=course_id, amount=amount, status="pending")
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def _prepare_sign(click_tx, merchant_tx, amount, action, sign_time):
    raw = f"{click_tx}{SERVICE_ID}{SECRET}{merchant_tx}{amount}{action}{sign_time}"
    return hashlib.md5(raw.encode()).hexdigest()


def _complete_sign(click_tx, merchant_tx, prepare_id, amount, action, sign_time):
    raw = f"{click_tx}{SERVICE_ID}{SECRET}{merchant_tx}{prepare_id}{amount}{action}{sign_time}"
    return hashlib.md5(raw.encode()).hexdigest()


def _set_secret(monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "CLICK_SECRET_KEY", SECRET, raising=False)


def test_click_prepare_bad_sign(client, db_session, monkeypatch):
    _set_secret(monkeypatch)
    user = _make_user(db_session)
    course = _make_course(db_session)
    order = _order(db_session, user.id, course.id)
    resp = client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1", "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id), "amount": "100000",
            "action": "0", "sign_time": "2026-07-06 10:00:00",
            "sign_string": "deadbeef",
        },
    )
    assert resp.json()["error"] == -1


def test_click_full_flow_grants_access(client, db_session, monkeypatch):
    _set_secret(monkeypatch)
    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    order = _order(db_session, user.id, course.id, amount=100000)

    st = "2026-07-06 10:00:00"
    # Prepare
    resp = client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1", "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id), "amount": "100000",
            "action": "0", "sign_time": st,
            "sign_string": _prepare_sign("c1", str(order.id), "100000", "0", st),
        },
    )
    assert resp.json()["error"] == 0
    prepare_id = resp.json()["merchant_prepare_id"]

    # Complete
    resp = client.post(
        "/api/payments/click/complete",
        data={
            "click_trans_id": "c1", "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id), "merchant_prepare_id": str(prepare_id),
            "amount": "100000", "action": "1", "sign_time": st,
            "sign_string": _complete_sign("c1", str(order.id), str(prepare_id), "100000", "1", st),
            "error": "0",
        },
    )
    assert resp.json()["error"] == 0

    db_session.expire_all()
    order = db_session.query(Order).filter(Order.id == order.id).first()
    assert order.status == "paid"
    assert db_session.query(Enrollment).filter_by(course_id=course.id).count() == 1


def test_click_complete_wrong_amount(client, db_session, monkeypatch):
    _set_secret(monkeypatch)
    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    order = _order(db_session, user.id, course.id, amount=100000)

    st = "2026-07-06 10:00:00"
    client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1", "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id), "amount": "100000",
            "action": "0", "sign_time": st,
            "sign_string": _prepare_sign("c1", str(order.id), "100000", "0", st),
        },
    )
    resp = client.post(
        "/api/payments/click/complete",
        data={
            "click_trans_id": "c1", "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id), "merchant_prepare_id": str(order.id),
            "amount": "500", "action": "1", "sign_time": st,
            "sign_string": _complete_sign("c1", str(order.id), str(order.id), "500", "1", st),
            "error": "0",
        },
    )
    assert resp.json()["error"] == -2


def test_click_complete_user_cancelled(client, db_session, monkeypatch):
    _set_secret(monkeypatch)
    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    order = _order(db_session, user.id, course.id, amount=100000)

    st = "2026-07-06 10:00:00"
    client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1", "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id), "amount": "100000",
            "action": "0", "sign_time": st,
            "sign_string": _prepare_sign("c1", str(order.id), "100000", "0", st),
        },
    )
    resp = client.post(
        "/api/payments/click/complete",
        data={
            "click_trans_id": "c1", "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id), "merchant_prepare_id": str(order.id),
            "amount": "100000", "action": "1", "sign_time": st,
            "sign_string": _complete_sign("c1", str(order.id), str(order.id), "100000", "1", st),
            "error": "-1",
        },
    )
    assert resp.json()["error"] == -9

    db_session.expire_all()
    order = db_session.query(Order).filter(Order.id == order.id).first()
    assert order.status == "cancelled"
    assert db_session.query(Enrollment).count() == 0