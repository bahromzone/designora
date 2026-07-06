"""To'lovlar API testlari — checkout va Payme Merchant API (BOSQICH 2)."""

import base64

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.coupon import Coupon
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User

PAYME_KEY = "test-payme-key"


def _make_user(db, email="buyer@example.com"):
    user = User(email=email, name="buyer", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_course(db, price=100000, active=True):
    course = Course(title="Pullik kurs", price=price, is_active=active, status="published")
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def _payme_auth():
    token = base64.b64encode(f"Paycom:{PAYME_KEY}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def _rpc(method, params, req_id=1):
    return {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params}


# ── Checkout ────────────────────────────────────────────────────────────────
def test_checkout_requires_auth(client, db_session):
    course = _make_course(db_session)
    resp = client.post("/api/payments/checkout", json={"course_id": course.id, "provider": "payme"})
    assert resp.status_code == 401


def test_checkout_free_course_enrolls_immediately(client, db_session):
    _make_user(db_session)
    course = _make_course(db_session, price=0)
    resp = client.post(
        "/api/payments/checkout",
        json={"course_id": course.id, "provider": "payme"},
        headers=_auth("buyer@example.com"),
    )
    assert resp.status_code == 200
    assert resp.json()["free"] is True
    assert db_session.query(Enrollment).count() == 1


def test_checkout_paid_course_creates_pending_order(client, db_session):
    _make_user(db_session)
    course = _make_course(db_session, price=100000)
    resp = client.post(
        "/api/payments/checkout",
        json={"course_id": course.id, "provider": "payme"},
        headers=_auth("buyer@example.com"),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["free"] is False
    assert data["amount"] == 100000
    order = db_session.query(Order).filter(Order.id == data["order_id"]).first()
    assert order.status == "pending"
    # to'lanmaguncha enrollment yo'q
    assert db_session.query(Enrollment).count() == 0


def test_checkout_applies_coupon(client, db_session):
    _make_user(db_session)
    course = _make_course(db_session, price=100000)
    db_session.add(Coupon(code="SALE20", type="percent", value=20, is_active=True))
    db_session.commit()
    resp = client.post(
        "/api/payments/checkout",
        json={"course_id": course.id, "provider": "click", "coupon_code": "SALE20"},
        headers=_auth("buyer@example.com"),
    )
    assert resp.status_code == 200
    assert resp.json()["amount"] == 80000


def test_checkout_rejects_invalid_provider(client, db_session):
    _make_user(db_session)
    course = _make_course(db_session, price=100000)
    resp = client.post(
        "/api/payments/checkout",
        json={"course_id": course.id, "provider": "bitcoin"},
        headers=_auth("buyer@example.com"),
    )
    assert resp.status_code == 400


def test_checkout_blocks_already_enrolled(client, db_session):
    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    db_session.add(Enrollment(user_id=user.id, course_id=course.id))
    db_session.commit()
    resp = client.post(
        "/api/payments/checkout",
        json={"course_id": course.id, "provider": "payme"},
        headers=_auth("buyer@example.com"),
    )
    assert resp.status_code == 400


# ── Payme Merchant API ────────────────────────────────────────────────────────
def _order(db, user_id, course_id, amount=100000):
    order = Order(user_id=user_id, course_id=course_id, amount=amount, status="pending", provider="payme")
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def test_payme_rejects_bad_auth(client, db_session, monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "PAYME_KEY", PAYME_KEY, raising=False)
    resp = client.post(
        "/api/payments/payme",
        json=_rpc("CheckPerformTransaction", {"amount": 100, "account": {"order_id": 1}}),
        headers={"Authorization": "Basic wrong"},
    )
    # JSON-RPC har doim 200, xato "error" ichida
    assert resp.json()["error"]["code"] == -32504


def test_payme_full_flow_grants_access(client, db_session, monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "PAYME_KEY", PAYME_KEY, raising=False)

    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    order = _order(db_session, user.id, course.id, amount=100000)
    amount_tiyin = 100000 * 100

    # 1. CheckPerformTransaction
    resp = client.post(
        "/api/payments/payme",
        json=_rpc("CheckPerformTransaction", {"amount": amount_tiyin, "account": {"order_id": order.id}}),
        headers=_payme_auth(),
    )
    assert resp.json()["result"]["allow"] is True

    # 2. CreateTransaction
    resp = client.post(
        "/api/payments/payme",
        json=_rpc("CreateTransaction", {"id": "tx-1", "amount": amount_tiyin, "account": {"order_id": order.id}}),
        headers=_payme_auth(),
    )
    assert resp.json()["result"]["state"] == 1

    # 3. PerformTransaction → enrollment yaratiladi
    resp = client.post(
        "/api/payments/payme",
        json=_rpc("PerformTransaction", {"id": "tx-1"}),
        headers=_payme_auth(),
    )
    assert resp.json()["result"]["state"] == 2

    db_session.expire_all()
    order = db_session.query(Order).filter(Order.id == order.id).first()
    assert order.status == "paid"
    assert db_session.query(Enrollment).filter_by(course_id=course.id).count() == 1


def test_payme_wrong_amount_rejected(client, db_session, monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "PAYME_KEY", PAYME_KEY, raising=False)
    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    order = _order(db_session, user.id, course.id, amount=100000)
    resp = client.post(
        "/api/payments/payme",
        json=_rpc("CheckPerformTransaction", {"amount": 500, "account": {"order_id": order.id}}),
        headers=_payme_auth(),
    )
    assert resp.json()["error"]["code"] == -31001


def test_payme_perform_is_idempotent(client, db_session, monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "PAYME_KEY", PAYME_KEY, raising=False)
    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    order = _order(db_session, user.id, course.id, amount=100000)
    amount_tiyin = 100000 * 100
    h = _payme_auth()

    client.post("/api/payments/payme",
                json=_rpc("CreateTransaction", {"id": "tx-9", "amount": amount_tiyin, "account": {"order_id": order.id}}),
                headers=h)
    client.post("/api/payments/payme", json=_rpc("PerformTransaction", {"id": "tx-9"}), headers=h)
    # ikkinchi marta — dublikat enrollment bermasligi kerak
    client.post("/api/payments/payme", json=_rpc("PerformTransaction", {"id": "tx-9"}), headers=h)

    assert db_session.query(Enrollment).filter_by(course_id=course.id).count() == 1


def test_payme_cancel_transaction(client, db_session, monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "PAYME_KEY", PAYME_KEY, raising=False)
    user = _make_user(db_session)
    course = _make_course(db_session, price=100000)
    order = _order(db_session, user.id, course.id, amount=100000)
    amount_tiyin = 100000 * 100
    h = _payme_auth()

    client.post("/api/payments/payme",
                json=_rpc("CreateTransaction", {"id": "tx-x", "amount": amount_tiyin, "account": {"order_id": order.id}}),
                headers=h)
    resp = client.post("/api/payments/payme", json=_rpc("CancelTransaction", {"id": "tx-x"}), headers=h)
    assert resp.json()["result"]["state"] == -1

    db_session.expire_all()
    order = db_session.query(Order).filter(Order.id == order.id).first()
    assert order.status == "cancelled"