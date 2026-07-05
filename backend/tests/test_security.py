"""JWT token va autentifikatsiya yordamchilari testlari."""

from datetime import UTC

import pytest
from fastapi import HTTPException
from jose import jwt

from app.core import security
from app.core.config import settings


class _FakeRequest:
    """get_current_user Request obyektini soxta ko'rinishda ta'minlaydi."""

    def __init__(self, headers=None, cookies=None, session=None):
        self.headers = headers or {}
        self.cookies = cookies or {}
        self.session = session if session is not None else {}


def test_create_access_token_roundtrip():
    token = security.create_access_token("user@example.com")
    decoded = jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    assert decoded["sub"] == "user@example.com"
    assert "exp" in decoded


def test_get_current_user_from_bearer_header():
    token = security.create_access_token("bearer@example.com")
    req = _FakeRequest(headers={"Authorization": f"Bearer {token}"})
    assert security.get_current_user(req) == "bearer@example.com"


def test_get_current_user_from_cookie():
    token = security.create_access_token("cookie@example.com")
    req = _FakeRequest(cookies={"access_token": token})
    assert security.get_current_user(req) == "cookie@example.com"


def test_get_current_user_from_session():
    req = _FakeRequest(session={"user": {"email": "session@example.com"}})
    assert security.get_current_user(req) == "session@example.com"


def test_get_current_user_no_token_raises():
    req = _FakeRequest()
    with pytest.raises(HTTPException) as exc:
        security.get_current_user(req)
    assert exc.value.status_code == 401


def test_get_current_user_invalid_token_raises():
    req = _FakeRequest(headers={"Authorization": "Bearer not-a-real-token"})
    with pytest.raises(HTTPException) as exc:
        security.get_current_user(req)
    assert exc.value.status_code == 401


def test_get_current_user_optional_returns_none():
    assert security.get_current_user_optional(_FakeRequest()) is None


def test_get_current_user_optional_returns_email():
    token = security.create_access_token("opt@example.com")
    req = _FakeRequest(cookies={"access_token": token})
    assert security.get_current_user_optional(req) == "opt@example.com"


def test_normalize_token_strips_bearer():
    assert security._normalize_token("Bearer abc123") == "abc123"
    assert security._normalize_token("abc123") == "abc123"
    assert security._normalize_token(None) == ""


def test_reset_token_is_random_and_long():
    t1 = security.create_reset_token()
    t2 = security.create_reset_token()
    assert t1 != t2
    assert len(t1) >= 32


def test_reset_token_expiry_in_future():
    from datetime import datetime, timezone

    expiry = security.reset_token_expiry(30)
    assert expiry > datetime.now(UTC)
