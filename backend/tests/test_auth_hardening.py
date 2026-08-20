from datetime import UTC, datetime, timedelta

from app.core.password import hash_password
from app.models.password_reset import PasswordReset
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services.token_service import generate_refresh_token, hash_token
from app.routers import auth as auth_router


def test_password_reset_revokes_existing_refresh_sessions(client, db_session):
    user = User(
        email="reset@example.com",
        name="Reset User",
        role="user",
        password=hash_password("OldPassword1"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    old_raw = generate_refresh_token()
    old_session = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(old_raw),
        expires_at=datetime.now(UTC) + timedelta(days=30),
    )
    reset = PasswordReset(
        user_id=user.id,
        token="reset-token",
        expires_at=datetime.now(UTC) + timedelta(minutes=15),
    )
    db_session.add_all([old_session, reset])
    db_session.commit()

    response = client.post(
        "/api/auth/reset-password",
        json={"token": "reset-token", "password": "NewPassword1"},
    )

    assert response.status_code == 200
    db_session.refresh(old_session)
    assert old_session.revoked_at is not None
    active = [token for token in db_session.query(RefreshToken).all() if token.is_active]
    assert len(active) == 1
    assert response.cookies.get("refresh_token")


def test_forgot_password_keeps_neutral_response_when_email_fails(
    client, db_session, monkeypatch
):
    user = User(
        email="mail-failure@example.com",
        name="Mail Failure",
        role="user",
        password=hash_password("Password123"),
    )
    db_session.add(user)
    db_session.commit()

    def fail_delivery(**_kwargs):
        raise RuntimeError("smtp unavailable")

    monkeypatch.setattr(auth_router, "send_email", fail_delivery)
    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "MAIL-FAILURE@EXAMPLE.COM"},
    )

    assert response.status_code == 200
    assert "Agar email" in response.json()["message"]
