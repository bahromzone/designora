from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, StringConstraints, field_validator
from typing import Optional, Annotated
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import httpx
import logging

from app.core.database import get_db
from app.core.password import hash_password, verify_password
from app.core.security import create_access_token, get_current_user_optional
from app.core.config import settings, limiter
from app.core.email import send_email
from app.models.user import User
from app.models.password_reset import PasswordReset
from fastapi_csrf_protect import CsrfProtect
from app.utils.routes import dashboard_path_for_role

logger = logging.getLogger(__name__)

# ==================================================
# Routers
# ==================================================
public_router = APIRouter(tags=["Public"])
router = APIRouter(prefix="/api/auth", tags=["Auth"])
templates = Jinja2Templates(directory="templates")


# ==================================================
# Cookie yordamchi
# ==================================================
def _is_production() -> bool:
    return settings.ENVIRONMENT == "production"


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": getattr(user, "is_active", True),
    }


# ==================================================
# reCAPTCHA
# ==================================================
async def verify_recaptcha(token: str) -> bool:
    if not _is_production():
        return True
    if not token:
        return False
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": settings.RECAPTCHA_SECRET_KEY, "response": token}
        )
        return response.json().get("success", False)


# ==================================================
# Streak yangilash (login paytida chaqiriladi)
# ==================================================
def update_streak(user: User, db: Session) -> None:
    today = datetime.now(timezone.utc).date()
    last = user.last_login_date
    if last and hasattr(last, "date"):
        last_date = last.date()
    else:
        last_date = None

    if last_date is None:
        user.streak_days = 1
    elif last_date == today:
        pass                                                  # bugun allaqachon kirilgan
    elif last_date == today - timedelta(days=1):
        user.streak_days = (user.streak_days or 0) + 1       # ketma-ket kun
    else:
        user.streak_days = 1                                  # uzilish — noldan

    user.last_login_date = datetime.now(timezone.utc)
    db.commit()


# ==================================================
# Schemas
# ==================================================
class RegisterRequest(BaseModel):
    username: Annotated[str, StringConstraints(min_length=3, max_length=50)]
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]
    recaptcha_token: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Kamida 1 ta katta harf kerak")
        if not any(c.isdigit() for c in v):
            raise ValueError("Kamida 1 ta raqam kerak")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]
    recaptcha_token: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Kamida 1 ta katta harf kerak")
        if not any(c.isdigit() for c in v):
            raise ValueError("Kamida 1 ta raqam kerak")
        return v


# ==================================================
# Register
# ==================================================
@router.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA noto'g'ri")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email allaqachon mavjud")

    user = User(
        name=data.username,
        email=data.email,
        password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.email)
    response = JSONResponse({
        "message": "Ro'yxatdan o'tish muvaffaqiyatli",
        "redirect": dashboard_path_for_role(user.role),
        "access_token": token,
        "token_type": "bearer",
        "user": _serialize_user(user),
    })
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=_is_production(),
        max_age=3600,
        samesite="strict"
    )
    return response


# ==================================================
# Login
# ==================================================
@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    csrf_protect: CsrfProtect = Depends()
):
    if _is_production():
        await csrf_protect.validate_csrf(request)

    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")

    user = db.query(User).filter(User.email == data.email).first()
    logger.info(f"Login attempt: {data.email}")

    if not user or not verify_password(data.password, user.password):
        logger.warning(f"Failed login: {data.email}")
        raise HTTPException(status_code=401, detail="Login yoki parol xato")

    logger.info(f"Successful login: {data.email}")
    update_streak(user, db)

    token = create_access_token(user.email)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=_is_production(),
        max_age=3600,
        samesite="strict"
    )

    # ✅ BUG FIX: Admin kirsa /manage/courses ga, oddiy user /dashboard ga
    redirect_url = dashboard_path_for_role(user.role)
    return {
        "success": True,
        "redirect": redirect_url,
        "access_token": token,
        "token_type": "bearer",
        "user": _serialize_user(user),
    }


# ==================================================
# CSRF token endpoint (index.html login modal uchun)
# ==================================================
@router.get("/csrf-token")
def get_csrf_token(
    request: Request,
    csrf_protect: CsrfProtect = Depends()
):
    """
    index.html login modal CSRF token olish uchun shu endpointni chaqiradi.
    Token header yoki cookie sifatida qaytariladi.
    """
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    response = JSONResponse({"csrf_token": csrf_token})
    csrf_protect.set_csrf_cookie(signed_token, response)
    return response


# ==================================================
# Login sahifasi (GET)
# ==================================================
# ✅ FIX: /login route avval login.html (admin panel) render qilardi.
# Oddiy foydalanuvchi /login ga kelganda admin sahifasini korardi.
# Endi: agar login qilingan bolsa → /dashboard
#       login qilinmagan bolsa   → / (index.html dagi modal orqali kirish)
@public_router.get("/login")
def login_page(request: Request, db: Session = Depends(get_db)):
    email = get_current_user_optional(request)
    if email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return RedirectResponse(dashboard_path_for_role(user.role), status_code=302)
    return RedirectResponse("/?modal=login", status_code=302)


# ==================================================
# Logout
# ==================================================
# ✅ BUG #10 FIX: GET → POST ga o'zgartirildi.
# Avvalgi GET /logout CSRF attackga ochiq edi:
# <img src="https://site.com/api/auth/logout"> orqali majburiy logout qilish mumkin edi.
# Endi POST talab qilinadi — brauzer avtomatik POST yubora olmaydi.
@router.post("/logout")
def logout(request: Request):
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("access_token")
    try:
        request.session.clear()
    except Exception:
        pass
    return response


# ==================================================
# Reset password sahifasi (GET)
# ==================================================
@public_router.get("/reset-password")
def reset_password_page(request: Request, token: str):
    return templates.TemplateResponse(
        "reset_password.html",
        {"request": request, "token": token}
    )


# ==================================================
# Forgot password
# ==================================================
@router.post("/forgot-password")
def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    SAME_RESPONSE = {
        "message": "Agar email tizimda mavjud bo'lsa, parolni tiklash havolasi yuborildi"
    }

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return SAME_RESPONSE   # timing attack dan himoya

    token = str(uuid4())

    db.query(PasswordReset).filter(PasswordReset.user_id == user.id).delete()
    reset = PasswordReset(
        user_id=user.id,
        token=token,
        expires_at=PasswordReset.expiry()
    )
    db.add(reset)
    db.commit()

    base_url = str(request.base_url).rstrip("/")
    link = f"{base_url}/reset-password?token={token}"

    send_email(
        to=user.email,
        subject="Parolni tiklash | Designora",
        body=f"""
        <h3>Parolni tiklash</h3>
        <p>Quyidagi havola orqali yangi parol o'rnating:</p>
        <a href="{link}">{link}</a>
        <p>Havola 15 daqiqa amal qiladi.</p>
        """
    )
    return SAME_RESPONSE


# ==================================================
# Reset password (POST)
# ==================================================
@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    reset = db.query(PasswordReset).filter(
        PasswordReset.token == data.token,
        PasswordReset.expires_at > datetime.now(timezone.utc)
    ).first()

    if not reset:
        raise HTTPException(status_code=400, detail="Token yaroqsiz yoki muddati o'tgan")

    user = db.query(User).filter(User.id == reset.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    user.password = hash_password(data.password)
    db.delete(reset)
    db.commit()

    access_token = create_access_token(user.email)
    response = JSONResponse({
        "message": "Parol muvaffaqiyatli o'zgartirildi",
        "redirect": dashboard_path_for_role(user.role),
        "access_token": access_token,
        "token_type": "bearer",
        "user": _serialize_user(user),
    })
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=_is_production(),
        max_age=3600,
        samesite="strict"
    )
    return response
