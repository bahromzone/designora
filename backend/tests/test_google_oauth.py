"""Google OAuth: cookie-session, refresh token va uzilish holatlari.

Tashqi Google chaqiruvi monkeypatch bilan almashtiriladi — testlar hech
qachon tarmoqqa chiqmaydi.
"""

import httpx
import pytest

from app.core.config import settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.routers import google as google_router

GOOGLE_EMAIL = "google@example.com"


@pytest.fixture
def oauth_configured(monkeypatch):
    """Kalitlar sozlangan holat — aks holda router oqimni erta to'xtatadi."""
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "test-client-secret")


def _userinfo(email=GOOGLE_EMAIL, name="Google User", verified=True):
    return {"userinfo": {"email": email, "name": name, "email_verified": verified}}


def _patch_token_exchange(monkeypatch, result):
    async def _authorize_access_token(request):
        if isinstance(result, Exception):
            raise result
        return result

    monkeypatch.setattr(
        google_router.oauth.google,
        "authorize_access_token",
        _authorize_access_token,
    )


def test_callback_issues_session_cookies(
    client, db_session, monkeypatch, oauth_configured
):
    _patch_token_exchange(monkeypatch, _userinfo())

    resp = client.get("/auth/google/callback", follow_redirects=False)

    location = resp.headers["location"]
    assert "/auth/callback" in location
    # JWT endi URL fragmentida yuborilmaydi: u brauzer tarixida qolardi.
    assert "#token=" not in location
    assert "next=%2Fkurslarim" in location
    assert client.cookies.get("access_token")
    assert client.cookies.get("refresh_token")


def test_callback_persists_refresh_token(
    client, db_session, monkeypatch, oauth_configured
):
    _patch_token_exchange(monkeypatch, _userinfo())

    client.get("/auth/google/callback", follow_redirects=False)

    user = db_session.query(User).filter(User.email == GOOGLE_EMAIL).first()
    assert user is not None
    assert user.provider == "google"
    tokens = db_session.query(RefreshToken).all()
    assert len(tokens) == 1
    assert tokens[0].user_id == user.id


def test_callback_blocks_inactive_account(
    client, db_session, monkeypatch, oauth_configured
):
    blocked = User(email=GOOGLE_EMAIL, name="Blocked", provider="google")
    blocked.is_active = False
    db_session.add(blocked)
    db_session.commit()
    _patch_token_exchange(monkeypatch, _userinfo())

    resp = client.get("/auth/google/callback", follow_redirects=False)

    assert "error=account_blocked" in resp.headers["location"]
    assert not client.cookies.get("access_token")
    assert db_session.query(RefreshToken).count() == 0


def test_callback_rejects_unverified_email(client, monkeypatch, oauth_configured):
    _patch_token_exchange(monkeypatch, _userinfo(verified=False))

    resp = client.get("/auth/google/callback", follow_redirects=False)

    assert "error=email_not_verified" in resp.headers["location"]
    assert not client.cookies.get("access_token")


def test_callback_survives_network_failure(client, monkeypatch, oauth_configured):
    _patch_token_exchange(monkeypatch, httpx.ConnectTimeout("timeout"))

    resp = client.get("/auth/google/callback", follow_redirects=False)

    assert resp.status_code < 500
    assert "error=oauth_unreachable" in resp.headers["location"]


def test_login_survives_network_failure(client, monkeypatch, oauth_configured):
    async def _boom(request, redirect_uri, **kwargs):
        raise httpx.ConnectTimeout("timeout")

    monkeypatch.setattr(google_router.oauth.google, "authorize_redirect", _boom)

    resp = client.get("/auth/google", follow_redirects=False)

    assert resp.status_code < 500
    assert "error=oauth_unreachable" in resp.headers["location"]


def test_login_requires_configured_client(client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", None)
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", None)

    resp = client.get("/auth/google", follow_redirects=False)

    assert "error=oauth_unavailable" in resp.headers["location"]
