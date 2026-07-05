"""Autentifikatsiya API (/api/auth) va streak mantiqi testlari."""

from datetime import UTC, datetime, timedelta, timezone

from app.models.user import User
from app.routers.auth import update_streak

VALID_PASSWORD = "Password123"


def _register_payload(**over):
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": VALID_PASSWORD,
        "recaptcha_token": "dummy",  # development'da tekshirilmaydi
    }
    data.update(over)
    return data


def test_register_success(client):
    resp = client.post("/api/auth/register", json=_register_payload())
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == "test@example.com"
    assert body["redirect"] == "/dashboard"


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json=_register_payload())
    resp = client.post("/api/auth/register", json=_register_payload())
    assert resp.status_code == 400


def test_register_weak_password_no_uppercase(client):
    resp = client.post(
        "/api/auth/register", json=_register_payload(password="password123")
    )
    assert resp.status_code == 422


def test_register_weak_password_no_digit(client):
    resp = client.post(
        "/api/auth/register", json=_register_payload(password="Passwordxx")
    )
    assert resp.status_code == 422


def test_register_short_username(client):
    resp = client.post("/api/auth/register", json=_register_payload(username="ab"))
    assert resp.status_code == 422


def test_login_success(client):
    client.post("/api/auth/register", json=_register_payload())
    resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": VALID_PASSWORD},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_login_wrong_password(client):
    client.post("/api/auth/register", json=_register_payload())
    resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "WrongPass123"},
    )
    assert resp.status_code == 401


def test_login_unknown_user(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": VALID_PASSWORD},
    )
    assert resp.status_code == 401


# ── Streak mantiqi (birlik testlari) ─────────────────────────────────────────
def test_streak_first_login(db_session):
    user = User(email="s1@example.com", name="S1", streak_days=0)
    db_session.add(user)
    db_session.commit()
    update_streak(user, db_session)
    assert user.streak_days == 1


def test_streak_consecutive_day(db_session):
    yesterday = datetime.now(UTC) - timedelta(days=1)
    user = User(
        email="s2@example.com", name="S2", streak_days=3, last_login_date=yesterday
    )
    db_session.add(user)
    db_session.commit()
    update_streak(user, db_session)
    assert user.streak_days == 4


def test_streak_same_day_no_change(db_session):
    today = datetime.now(UTC)
    user = User(email="s3@example.com", name="S3", streak_days=5, last_login_date=today)
    db_session.add(user)
    db_session.commit()
    update_streak(user, db_session)
    assert user.streak_days == 5


def test_streak_gap_resets(db_session):
    old = datetime.now(UTC) - timedelta(days=10)
    user = User(email="s4@example.com", name="S4", streak_days=9, last_login_date=old)
    db_session.add(user)
    db_session.commit()
    update_streak(user, db_session)
    assert user.streak_days == 1
