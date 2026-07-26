import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

# Bloklangan hisob uchun yagona javob matni (auth.py / token.py ham ishlatadi).
ACCOUNT_DISABLED_DETAIL = "Hisobingiz bloklangan. Administrator bilan bog'laning."


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
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
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


# ✅ KRITIK FIX: `is_active` bayrog'i hech qayerda tekshirilmasdi.
#
# `get_current_user` faqat JWT'ni ochadi va bazaga qaramaydi, shu sabab
# bloklangan (is_active=False) foydalanuvchi tokeni amal qilgunicha —
# hatto undan keyin ham, refresh orqali — bemalol ishlashda davom etardi.
#
# Quyidagi qo'riqchi main.py da global dependency sifatida ulanadi, shuning
# uchun har bir routerni alohida o'zgartirish shart emas. Token bo'lmasa
# (ommaviy endpointlar) hech narsa qilmaydi.
def is_user_active(db: Session, email: str) -> bool:
    from app.models.user import User

    user = db.query(User).filter(User.email == email).first()
    # Foydalanuvchi topilmasa qaror qabul qilmaymiz — endpointning o'zi 401 beradi.
    return user is None or bool(user.is_active)


def enforce_active_user(request: Request, db: Session = Depends(get_db)) -> None:
    email = get_current_user_optional(request)
    if not email:
        return
    if not is_user_active(db, email):
        raise HTTPException(status_code=403, detail=ACCOUNT_DISABLED_DETAIL)


# ✅ BUG #14 FIX: user_id parametri olib tashlandi — funksiya ichida ishlatilmasdi
# (dead code). auth.py da bu funksiya chaqirilmaydi, uuid4() ishlatilgan.
def create_reset_token() -> str:
    return secrets.token_urlsafe(32)  # 256-bit token


def reset_token_expiry(minutes: int = 30) -> datetime:
    return datetime.now(UTC) + timedelta(minutes=minutes)
