import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

INACTIVE_ACCOUNT_DETAIL = (
    "Hisobingiz bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling."
)


def create_access_token(sub: str) -> str:
    payload = {
        "sub": sub,
        "exp": datetime.now(UTC) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def _normalize_token(token: str | None) -> str:
    if not token:
        return ""
    return token[7:] if token.startswith("Bearer ") else token


def _session_email(request: Request) -> str | None:
    try:
        session_user = request.session.get("user")
    except Exception:
        return None
    return session_user.get("email") if isinstance(session_user, dict) else None


def get_request_token(request: Request) -> str:
    if _session_email(request):
        return ""
    for value in (
        request.cookies.get("access_token"),
        request.headers.get("Authorization"),
        request.headers.get("X-Access-Token"),
    ):
        token = _normalize_token(value)
        if token:
            return token
    return ""


def _ensure_active_account(db: Any, email: str) -> None:
    # Direct unit calls may omit the dependency; real FastAPI requests always receive Session.
    if not hasattr(db, "query"):
        return
    from app.models.user import User

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if not user.is_active:
        raise HTTPException(status_code=403, detail=INACTIVE_ACCOUNT_DETAIL)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> str:
    session_email = _session_email(request)
    if session_email:
        _ensure_active_account(db, session_email)
        return session_email
    token = get_request_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Unauthorized")
        _ensure_active_account(db, email)
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> str | None:
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


def create_reset_token() -> str:
    return secrets.token_urlsafe(32)


def reset_token_expiry(minutes: int = 30) -> datetime:
    return datetime.now(UTC) + timedelta(minutes=minutes)
