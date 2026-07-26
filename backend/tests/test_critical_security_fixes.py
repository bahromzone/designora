"""Audit natijasida topilgan kritik zaifliklar uchun regressiya testlari.

Qamrab olingan:
- #2 To'lov webhooklari kalit sozlanmaganda OCHIQ qolmasligi kerak.
- #3 To'lov bekor qilinganda (refund) kursga kirish yopilishi kerak.
- #4 Bloklangan (is_active=False) foydalanuvchi tizimga kira olmasligi kerak.
"""

import base64
import hashlib

from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.progress import Progress
from app.models.user import User

PAYME_KEY = "test-payme-key"
CLICK_SECRET = "test-click-secret"
SERVICE_ID = "svc-1"
SIGN_TIME = "2026-07-26 10:00:00"
PASSWORD = "Password123"


# ── Yordamchilar ────────────────────────────────────────────────────────────
def _set(monkeypatch, name, value):
    from app.core import config

    monkeypatch.setattr(config.settings, name, value, raising=False)


def _user(db, email="buyer@example.com", *, is_active=True, with_password=False):
    user = User(
        email=email,
        name="buyer",
        role="user",
        is_active=is_active,
        password=hash_password(PASSWORD) if with_password else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _course(db, price=100000):
    course = Course(
        title="Pullik kurs", price=price, is_active=True, status="published"
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _order(db, user_id, course_id, amount=100000, provider="payme"):
    order = Order(
        user_id=user_id,
        course_id=course_id,
        amount=amount,
        status="pending",
        provider=provider,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def _rpc(method, params, req_id=1):
    return {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params}


def _payme_headers(key=PAYME_KEY):
    token = base64.b64encode(f"Paycom:{key}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def _reload(db, order_id):
    db.expire_all()
    return db.query(Order).filter(Order.id == order_id).first()


# ── #2: kalit sozlanmagan bo'lsa webhook rad etilishi kerak ─────────────────
def test_payme_webhook_rejected_when_key_not_configured(
    client, db_session, monkeypatch
):
    """PAYME_KEY bo'sh bo'lsa hech kim to'lovni "tasdiqlay" olmasin."""
    _set(monkeypatch, "PAYME_KEY", "")
    user = _user(db_session)
    course = _course(db_session)
    order = _order(db_session, user.id, course.id)
    order.provider_transaction_id = "tx-forged"
    db_session.commit()

    resp = client.post(
        "/api/payments/payme",
        json=_rpc("PerformTransaction", {"id": "tx-forged"}),
        headers=_payme_headers(""),
    )

    assert resp.json()["error"]["code"] == -32504
    assert _reload(db_session, order.id).status == "pending"
    assert db_session.query(Enrollment).count() == 0


def test_click_prepare_rejected_when_secret_not_configured(
    client, db_session, monkeypatch
):
    """CLICK_SECRET_KEY bo'sh bo'lsa imzoni istalgan odam yasay olardi."""
    _set(monkeypatch, "CLICK_SECRET_KEY", "")
    user = _user(db_session)
    course = _course(db_session)
    order = _order(db_session, user.id, course.id, provider="click")

    # Bo'sh kalit bilan hisoblangan "to'g'ri" imzo — soxta.
    raw = f"c1{SERVICE_ID}{order.id}1000000{SIGN_TIME}"
    forged = hashlib.md5(raw.encode()).hexdigest()

    resp = client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order.id),
            "amount": "100000",
            "action": "0",
            "sign_time": SIGN_TIME,
            "sign_string": forged,
        },
    )

    assert resp.json()["error"] < 0
    assert db_session.query(Enrollment).count() == 0


def test_payme_webhook_ignores_malformed_order_id(client, db_session, monkeypatch):
    """Noto'g'ri order_id 500 emas, tartibli JSON-RPC xato qaytarsin."""
    _set(monkeypatch, "PAYME_KEY", PAYME_KEY)
    resp = client.post(
        "/api/payments/payme",
        json=_rpc(
            "CheckPerformTransaction",
            {"amount": 100, "account": {"order_id": "; DROP TABLE orders"}},
        ),
        headers=_payme_headers(),
    )
    assert resp.json()["error"]["code"] == -31050


# ── #3: refund kursga kirishni yopishi kerak ────────────────────────────────
def test_payme_cancel_after_perform_revokes_access(client, db_session, monkeypatch):
    """To'la → o'qi → pulni qaytar → kurs seniki bo'lib qolmasin."""
    _set(monkeypatch, "PAYME_KEY", PAYME_KEY)
    user = _user(db_session)
    course = _course(db_session)
    order = _order(db_session, user.id, course.id)
    tiyin = 100000 * 100
    headers = _payme_headers()

    client.post(
        "/api/payments/payme",
        json=_rpc(
            "CreateTransaction",
            {"id": "tx-r", "amount": tiyin, "account": {"order_id": order.id}},
        ),
        headers=headers,
    )
    client.post(
        "/api/payments/payme",
        json=_rpc("PerformTransaction", {"id": "tx-r"}),
        headers=headers,
    )

    db_session.expire_all()
    assert db_session.query(Enrollment).count() == 1

    resp = client.post(
        "/api/payments/payme",
        json=_rpc("CancelTransaction", {"id": "tx-r", "reason": 5}),
        headers=headers,
    )
    assert resp.json()["result"]["state"] == -2

    fresh = _reload(db_session, order.id)
    assert fresh.status == "cancelled"
    assert fresh.refund_status == "refunded"
    assert db_session.query(Enrollment).count() == 0
    assert (
        db_session.query(Progress).filter(Progress.course_id == course.id).count() == 0
    )


def test_cancelled_order_cannot_be_performed_again(client, db_session, monkeypatch):
    """Bekor qilingan buyurtma qayta 'to'landi' bo'lib qolmasin."""
    _set(monkeypatch, "PAYME_KEY", PAYME_KEY)
    user = _user(db_session)
    course = _course(db_session)
    order = _order(db_session, user.id, course.id)
    tiyin = 100000 * 100
    headers = _payme_headers()

    client.post(
        "/api/payments/payme",
        json=_rpc(
            "CreateTransaction",
            {"id": "tx-c", "amount": tiyin, "account": {"order_id": order.id}},
        ),
        headers=headers,
    )
    client.post(
        "/api/payments/payme",
        json=_rpc("CancelTransaction", {"id": "tx-c", "reason": 3}),
        headers=headers,
    )
    resp = client.post(
        "/api/payments/payme",
        json=_rpc("PerformTransaction", {"id": "tx-c"}),
        headers=headers,
    )

    assert resp.json()["error"]["code"] == -31008
    assert db_session.query(Enrollment).count() == 0


# ── #4: bloklangan foydalanuvchi ────────────────────────────────────────────
def test_blocked_user_cannot_login(client, db_session):
    _user(db_session, email="blocked@example.com", is_active=False, with_password=True)
    resp = client.post(
        "/api/auth/login",
        json={
            "email": "blocked@example.com",
            "password": PASSWORD,
            "recaptcha_token": "dummy",
        },
    )
    assert resp.status_code == 403


def test_active_user_can_still_login(client, db_session):
    """Tuzatish oddiy foydalanuvchini buzmaganini tekshiramiz."""
    _user(db_session, email="ok@example.com", with_password=True)
    resp = client.post(
        "/api/auth/login",
        json={
            "email": "ok@example.com",
            "password": PASSWORD,
            "recaptcha_token": "dummy",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_blocked_user_cannot_issue_refresh(client, db_session):
    """Eski access-token bilan sessiyani cheksiz uzaytirib bo'lmasin."""
    user = _user(db_session, email="blocked2@example.com", is_active=False)
    resp = client.post(
        "/api/auth/issue-refresh",
        headers={"Authorization": f"Bearer {create_access_token(user.email)}"},
    )
    assert resp.status_code == 403
