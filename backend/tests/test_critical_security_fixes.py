"""Xavfsizlik auditidan keyingi 4 ta KRITIK tuzatish uchun regression testlar.

1. Production konfiguratsiyasi to'lov kalitlarisiz ko'tarilmasligi kerak.
2. Bo'sh PAYME_KEY / CLICK_SECRET_KEY bilan webhook'lar rad etilishi kerak.
3. Bekor qilingan (refund) to'lov Enrollment'ni ham bekor qilishi kerak.
4. is_active=False foydalanuvchi na login qila olishi, na tokeni ishlashi kerak.
"""

import base64

import pytest
from pydantic import ValidationError

from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User

PAYME_KEY = "test-payme-key"


def _rpc(method, params, req_id=1):
    return {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params}


def _payme_headers(key=PAYME_KEY):
    token = base64.b64encode(f"Paycom:{key}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def _set_payme_key(monkeypatch, value=PAYME_KEY):
    from app.core import config

    monkeypatch.setattr(config.settings, "PAYME_KEY", value, raising=False)


# ── 1. Production sozlamalari ────────────────────────────────────────────────
def _prod_settings_kwargs(**overrides):
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
    }
    base.update(overrides)
    return base


def test_production_requires_payment_secrets():
    """Bo'sh PAYME_KEY/CLICK_SECRET_KEY bilan production'ga chiqib bo'lmaydi."""
    from app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(**_prod_settings_kwargs())


def test_production_settings_ok_when_secrets_present():
    from app.core.config import Settings

    settings = Settings(
        **_prod_settings_kwargs(
            PAYME_KEY="real-payme-key",
            CLICK_SECRET_KEY="real-click-secret",
            media_signing_key="real-media-key",
        )
    )
    assert settings.ENVIRONMENT == "production"


def test_development_does_not_require_payment_secrets():
    from app.core.config import Settings

    settings = Settings(**_prod_settings_kwargs(ENVIRONMENT="development"))
    assert settings.PAYME_KEY == ""


# ── 2. Sozlanmagan kalit bilan webhook'lar yopiq ─────────────────────────────
def test_payme_webhook_rejected_when_key_not_configured(client, monkeypatch):
    _set_payme_key(monkeypatch, "")
    resp = client.post(
        "/api/payments/payme",
        json=_rpc(
            "CheckPerformTransaction", {"amount": 100, "account": {"order_id": 1}}
        ),
        headers=_payme_headers(""),
    )
    assert resp.json()["error"]["code"] == -32504


def test_click_prepare_rejected_when_secret_not_configured(client, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "CLICK_SECRET_KEY", "", raising=False)
    resp = client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1",
            "service_id": "svc-1",
            "merchant_trans_id": "1",
            "amount": "100000",
            "action": "0",
            "sign_time": "2026-07-26 10:00:00",
            "sign_string": "d41d8cd98f00b204e9800998ecf8427e",
        },
    )
    assert resp.json()["error"] == -1


def test_click_prepare_survives_garbage_order_id(client, monkeypatch):
    """merchant_trans_id son bo'lmasa 500 emas, tartibli xato qaytishi kerak."""
    from app.core import config

    monkeypatch.setattr(
        config.settings, "CLICK_SECRET_KEY", "some-secret", raising=False
    )
    resp = client.post(
        "/api/payments/click/prepare",
        data={
            "click_trans_id": "c1",
            "service_id": "svc-1",
            "merchant_trans_id": "not-a-number",
            "amount": "100000",
            "action": "0",
            "sign_time": "2026-07-26 10:00:00",
            "sign_string": "deadbeef",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["error"] == -5


# ── 3. Refund kirishni yopadi ────────────────────────────────────────────────
def test_payme_cancel_revokes_enrollment(client, db_session, monkeypatch):
    """To'la → o'qi → refund qil → kurs SENIKI EMAS."""
    _set_payme_key(monkeypatch)

    user = User(email="refund@example.com", name="buyer", role="user")
    db_session.add(user)
    course = Course(title="Pullik", price=100000, is_active=True, status="published")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(course)

    order = Order(
        user_id=user.id,
        course_id=course.id,
        amount=100000,
        status="pending",
        provider="payme",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    headers = _payme_headers()
    amount_tiyin = 100000 * 100

    client.post(
        "/api/payments/payme",
        json=_rpc(
            "CreateTransaction",
            {"id": "tx-r", "amount": amount_tiyin, "account": {"order_id": order.id}},
        ),
        headers=headers,
    )
    client.post(
        "/api/payments/payme",
        json=_rpc("PerformTransaction", {"id": "tx-r"}),
        headers=headers,
    )

    db_session.expire_all()
    assert db_session.query(Enrollment).filter_by(course_id=course.id).count() == 1

    # Refund / bekor qilish
    client.post(
        "/api/payments/payme",
        json=_rpc("CancelTransaction", {"id": "tx-r", "reason": 5}),
        headers=headers,
    )

    db_session.expire_all()
    order = db_session.query(Order).filter(Order.id == order.id).first()
    assert order.status == "cancelled"
    assert order.refund_status == "refunded"
    # ⬇️ Asosiy tekshiruv: kursga kirish yopildi
    assert db_session.query(Enrollment).filter_by(course_id=course.id).count() == 0

    course = db_session.query(Course).filter(Course.id == course.id).first()
    assert (course.students_count or 0) == 0


# ── 4. is_active bayrog'i ────────────────────────────────────────────────────
def test_inactive_user_cannot_login(client, db_session):
    db_session.add(
        User(
            email="blocked@example.com",
            name="blocked",
            password=hash_password("Password1"),
            is_active=False,
        )
    )
    db_session.commit()

    resp = client.post(
        "/api/auth/login",
        json={"email": "blocked@example.com", "password": "Password1"},
    )
    assert resp.status_code == 403


def test_active_user_can_still_login(client, db_session):
    db_session.add(
        User(
            email="ok@example.com",
            name="ok",
            password=hash_password("Password1"),
            is_active=True,
        )
    )
    db_session.commit()

    resp = client.post(
        "/api/auth/login",
        json={"email": "ok@example.com", "password": "Password1"},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_inactive_user_existing_token_is_rejected(client, db_session):
    """Bloklashdan oldin berilgan token ham darhol ishlamay qolishi kerak."""
    db_session.add(
        User(email="blocked2@example.com", name="blocked2", is_active=False)
    )
    db_session.commit()

    token = create_access_token("blocked2@example.com")
    resp = client.get("/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_active_user_token_still_works(client, db_session):
    db_session.add(User(email="active@example.com", name="active", is_active=True))
    db_session.commit()

    token = create_access_token("active@example.com")
    resp = client.get("/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_anonymous_requests_are_unaffected(client):
    assert client.get("/").status_code == 200
