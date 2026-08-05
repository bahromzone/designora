"""To'lov qatlamidagi kritik zaifliklar uchun regressiya testlari."""

import base64
import hashlib

import pytest
from pydantic import ValidationError

from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.progress import Progress
from app.models.user import User

PAYME_KEY = "test-payme-key"
SERVICE_ID = "svc-1"
SIGN_TIME = "2026-07-28 10:00:00"


def _set(monkeypatch, name, value):
    from app.core import config

    monkeypatch.setattr(config.settings, name, value, raising=False)


def _rpc(method, params, req_id=1):
    return {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params}


def _payme_headers(key=PAYME_KEY):
    token = base64.b64encode(f"Paycom:{key}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def _user(db, email="buyer@example.com"):
    user = User(email=email, name="buyer", role="user", is_active=True)
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


def _reload(db, order_id):
    db.expire_all()
    return db.query(Order).filter(Order.id == order_id).first()


def _prod_kwargs(**overrides):
    base = {
        "ENVIRONMENT": "production",
        "DATABASE_URL": "sqlite+pysqlite:///:memory:",
        "SECRET_KEY": "x" * 32,
        "SESSION_SECRET_KEY": "y" * 32,
        "JWT_SECRET_KEY": "z" * 32,
        "MAIL_USERNAME": "ci@example.com",
        "MAIL_PASSWORD": "ci-pass",
        "MAIL_FROM": "ci@example.com",
        "MAIL_PORT": 587,
        "MAIL_SERVER": "smtp.example.com",
        "RECAPTCHA_SECRET_KEY": "ci-recaptcha",
        "VIDEO_STORAGE_ACCESS_KEY": "ci-storage-access",
        "VIDEO_STORAGE_SECRET_KEY": "ci-storage-secret",
        "VIDEO_STORAGE_PUBLIC_BASE_URL": "https://cdn.example.com",
        # Production'da rate limit umumiy saqlagichda bo'lishi shart —
        # aks holda har worker o'z limitini sanaydi.
        "REDIS_URL": "redis://localhost:6379/0",
    }
    base.update(overrides)
    return base


def test_production_requires_payment_secrets():
    from app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(**_prod_kwargs(PAYME_KEY="", CLICK_SECRET_KEY=""))


def test_production_settings_ok_when_secrets_present():
    from app.core.config import Settings

    cfg = Settings(
        **_prod_kwargs(
            PAYME_KEY="real-payme-key",
            CLICK_SECRET_KEY="real-click-secret",
            media_signing_key="real-media-key",
        )
    )
    assert cfg.ENVIRONMENT == "production"


def test_development_does_not_require_payment_secrets():
    from app.core.config import Settings

    cfg = Settings(**_prod_kwargs(ENVIRONMENT="development"))
    assert cfg.PAYME_KEY == ""


def test_payme_webhook_rejected_when_key_not_configured(
    client, db_session, monkeypatch
):
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
    _set(monkeypatch, "CLICK_SECRET_KEY", "")
    user = _user(db_session)
    course = _course(db_session)
    order = _order(db_session, user.id, course.id, provider="click")
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


def test_payme_webhook_ignores_malformed_order_id(client, monkeypatch):
    _set(monkeypatch, "PAYME_KEY", PAYME_KEY)
    resp = client.post(
        "/api/payments/payme",
        json=_rpc(
            "CheckPerformTransaction",
            {"amount": 100, "account": {"order_id": "; DROP TABLE orders"}},
        ),
        headers=_payme_headers(),
    )
    assert resp.status_code == 200
    assert resp.json()["error"]["code"] == -31050


def test_click_prepare_survives_garbage_order_id(client, monkeypatch):
    _set(monkeypatch, "CLICK_SECRET_KEY", "some-secret")
    resp = client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1",
            "service_id": SERVICE_ID,
            "merchant_trans_id": "not-a-number",
            "amount": "100000",
            "action": "0",
            "sign_time": SIGN_TIME,
            "sign_string": "deadbeef",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["error"] == -5


def test_payme_cancel_after_perform_revokes_access(client, db_session, monkeypatch):
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
