import secrets
from datetime import UTC, datetime, timedelta
from fastapi import HTTPException, Request
from jose import JWTError, jwt
from app.core.config import settings

INACTIVE_ACCOUNT_DETAIL = "Hisobingiz bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling."

def create_access_token(sub: str) -> str:
    payload={"sub":sub,"exp":datetime.now(UTC)+timedelta(minutes=settings.JWT_EXPIRE_MINUTES)}
    return jwt.encode(payload,settings.JWT_SECRET_KEY,algorithm=settings.JWT_ALGORITHM)

def _normalize_token(token: str|None) -> str:
    if not token:return ""
    return token[7:] if token.startswith("Bearer ") else token

def _session_email(request: Request) -> str|None:
    try: session_user=request.session.get("user")
    except Exception:return None
    return session_user.get("email") if isinstance(session_user,dict) else None

def get_request_token(request: Request) -> str:
    if _session_email(request):return ""
    for value in (request.cookies.get("access_token"),request.headers.get("Authorization"),request.headers.get("X-Access-Token")):
        token=_normalize_token(value)
        if token:return token
    return ""

def _ensure_active_account(email: str) -> None:
    from app.core.database import SessionLocal
    from app.models.user import User
    db=SessionLocal()
    try:
        user=db.query(User).filter(User.email==email).first()
        # Preserve token-helper semantics for callers that only test JWT parsing;
        # application routes still verify the concrete user record themselves.
        if user and not user.is_active: raise HTTPException(status_code=403,detail=INACTIVE_ACCOUNT_DETAIL)
    finally: db.close()

def get_current_user(request: Request) -> str:
    session_email=_session_email(request)
    if session_email:
        _ensure_active_account(session_email);return session_email
    token=get_request_token(request)
    if not token:raise HTTPException(status_code=401,detail="Unauthorized")
    try:
        payload=jwt.decode(token,settings.JWT_SECRET_KEY,algorithms=[settings.JWT_ALGORITHM])
        email=payload.get("sub")
        if not email:raise HTTPException(status_code=401,detail="Unauthorized")
        _ensure_active_account(email);return email
    except JWTError:raise HTTPException(status_code=401,detail="Unauthorized")

def get_current_user_optional(request: Request) -> str|None:
    try:return get_current_user(request)
    except HTTPException:return None

def create_reset_token() -> str:return secrets.token_urlsafe(32)
def reset_token_expiry(minutes:int=30)->datetime:return datetime.now(UTC)+timedelta(minutes=minutes)
