import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request
from jose import JWTError, jwt

from app.core.config import settings

INACTIVE_ACCOUNT_DETAIL = "Hisobingiz bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling."


def create_access_token(sub: str) -> str:
    payload = {
        "sub": sub,
        "exp": datetime.now(UTC) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
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


def _ensure_active_account(email: str) -> None:
    """Re-check account status on every authenticated request.

    JWTs are intentionally stateless, so revoking a user in the database cannot
    invalidate an already-issued token by itself. This small DB lookup closes
    that gap for every router that depends on get_current_user.
    """
    from app.core.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
        if not user.is_active:
            raise HTTPException(status_code=403, detail=INACTIVE_ACCOUNT_DETAIL)
    finally:
        db.close()


def get_current_user(request: Request) -> str:
    session_email = _session_email(request)
    if session_email:
        _ensure_active_account(session_email)
        return session_email

    token = get_request_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Unauthorized")
        _ensure_active_account(email)
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_current_user_optional(request: Request) -> str | None:
    try:
        return get_current_user(request)
    except HTTPException:
        return None


def create_reset_token() -> str:
    return secrets.token_urlsafe(32)


def reset_token_expiry(minutes: int = 30) -> datetime:
    return datetime.now(UTC) + timedelta(minutes=minutes)
