from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, Request
from app.core.config import settings
import secrets


def create_access_token(sub: str) -> str:
    payload = {
        "sub": sub,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _normalize_token(token: str | None) -> str:
    if not token:
        return ""
    return token[7:] if token.startswith("Bearer ") else token


def _session_email(request: Request) -> str | None:
    try:
        session_user = request.session.get("user")
    except Exception:
        return None

    if isinstance(session_user, dict):
        return session_user.get("email")
    return None


def get_request_token(request: Request) -> str:
    session_email = _session_email(request)
    if session_email:
        return ""

    cookie_token = _normalize_token(request.cookies.get("access_token"))
    if cookie_token:
        return cookie_token

    auth_header = _normalize_token(request.headers.get("Authorization"))
    if auth_header:
        return auth_header

    custom_header = _normalize_token(request.headers.get("X-Access-Token"))
    if custom_header:
        return custom_header

    return ""


def get_current_user(request: Request) -> str:
    session_email = _session_email(request)
    if session_email:
        return session_email

    token = get_request_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_current_user_optional(request: Request) -> str | None:
    try:
        return get_current_user(request)
    except HTTPException:
        return None


# ✅ BUG #14 FIX: user_id parametri olib tashlandi — funksiya ichida ishlatilmasdi
# (dead code). auth.py da bu funksiya chaqirilmaydi, uuid4() ishlatilgan.
def create_reset_token() -> str:
    return secrets.token_urlsafe(32)  # 256-bit token


def reset_token_expiry(minutes: int = 30) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
