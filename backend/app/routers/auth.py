import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel, EmailStr, StringConstraints, field_validator
from sqlalchemy.orm import Session

from app.core.config import limiter, settings
from app.core.database import get_db
from app.core.email import send_email
from app.core.password import hash_password, verify_password
from app.core.security import (
    INACTIVE_ACCOUNT_DETAIL,
    create_access_token,
    get_current_user_optional,
)
from app.models.password_reset import PasswordReset
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import token_service
from app.utils.routes import dashboard_path_for_role

logger = logging.getLogger(__name__)
public_router = APIRouter(tags=["Public"])
router = APIRouter(prefix="/api/auth", tags=["Auth"])
_REFRESH_COOKIE = "refresh_token"


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


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=_is_production(),
        max_age=token_service.REFRESH_TOKEN_TTL_DAYS * 24 * 3600,
        samesite="strict",
        path="/api/auth",
    )


def _issue_refresh_token(
    db: Session, user: User, request: Request | None = None
) -> str:
    raw = token_service.generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_service.hash_token(raw),
            expires_at=token_service.refresh_expiry(),
            user_agent=(request.headers.get("user-agent") if request else "")[:255]
            or None,
        )
    )
    return raw


async def verify_recaptcha(token: str) -> bool:
    if not _is_production():
        return True
    if not token:
        return False
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": settings.RECAPTCHA_SECRET_KEY, "response": token},
        )
        return response.json().get("success", False)


def update_streak(user: User, db: Session) -> None:
    today = datetime.now(UTC).date()
    last = user.last_login_date
    last_date = last.date() if last and hasattr(last, "date") else None
    if last_date is None:
        user.streak_days = 1
    elif last_date == today:
        pass
    elif last_date == today - timedelta(days=1):
        user.streak_days = (user.streak_days or 0) + 1
    else:
        user.streak_days = 1
    user.last_login_date = datetime.now(UTC)
    db.commit()


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
    recaptcha_token: str | None = None


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


@router.post("/register")
@limiter.limit("5/minute")
async def register(
    request: Request, data: RegisterRequest, db: Session = Depends(get_db)
):
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA noto'g'ri")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Bu email allaqachon mavjud")
    user = User(
        name=data.username, email=data.email, password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.email)
    refresh_token = _issue_refresh_token(db, user, request)
    db.commit()
    payload = {
        "message": "Ro'yxatdan o'tish muvaffaqiyatli",
        "redirect": dashboard_path_for_role(user.role),
        "user": _serialize_user(user),
    }
    response = JSONResponse(payload)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=_is_production(),
        max_age=3600,
        samesite="strict",
    )
    _set_refresh_cookie(response, refresh_token)
    return response


@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    csrf_protect: CsrfProtect = Depends(),
):
    if _is_production():
        await csrf_protect.validate_csrf(request)
    if not await verify_recaptcha(data.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
    user = db.query(User).filter(User.email == data.email).first()
    logger.info("Login attempt: %s", data.email)
    if (
        not user
        or not user.password
        or not verify_password(data.password, user.password)
    ):
        raise HTTPException(status_code=401, detail="Login yoki parol xato")
    if not user.is_active:
        raise HTTPException(status_code=403, detail=INACTIVE_ACCOUNT_DETAIL)
    update_streak(user, db)
    token = create_access_token(user.email)
    refresh_token = _issue_refresh_token(db, user, request)
    db.commit()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=_is_production(),
        max_age=3600,
        samesite="strict",
    )
    _set_refresh_cookie(response, refresh_token)
    return {
        "success": True,
        "redirect": dashboard_path_for_role(user.role),
        "user": _serialize_user(user),
    }


@router.get("/csrf-token")
def get_csrf_token(request: Request, csrf_protect: CsrfProtect = Depends()):
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    response = JSONResponse({"csrf_token": csrf_token})
    csrf_protect.set_csrf_cookie(signed_token, response)
    return response


@public_router.get("/login")
def login_page(request: Request, db: Session = Depends(get_db)):
    email = get_current_user_optional(request, db)
    if email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return RedirectResponse(dashboard_path_for_role(user.role), status_code=302)
    return RedirectResponse("/?modal=login", status_code=302)


@router.post("/logout")
def logout(request: Request):
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("access_token")
    response.delete_cookie(_REFRESH_COOKIE, path="/api/auth")
    try:
        request.session.clear()
    except Exception:
        pass
    return response


@public_router.get("/reset-password")
def reset_password_page(request: Request, token: str):
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/reset-password?token={token}", status_code=302
    )


@router.post("/forgot-password")
def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    same_response = {
        "message": (
            "Agar email tizimda mavjud bo'lsa, parolni tiklash havolasi yuborildi"
        )
    }
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.is_active:
        return same_response
    token = str(uuid4())
    db.query(PasswordReset).filter(PasswordReset.user_id == user.id).delete()
    db.add(
        PasswordReset(user_id=user.id, token=token, expires_at=PasswordReset.expiry())
    )
    db.commit()
    base_url = str(request.base_url).rstrip("/")
    link = f"{base_url}/reset-password?token={token}"
    send_email(
        to=user.email,
        subject="Parolni tiklash | Designora",
        body=(
            "<h3>Parolni tiklash</h3>"
            "<p>Quyidagi havola orqali yangi parol o'rnating:</p>"
            f'<a href="{link}">{link}</a>'
            "<p>Havola 30 daqiqa amal qiladi.</p>"
        ),
    )
    return same_response


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset = (
        db.query(PasswordReset)
        .filter(
            PasswordReset.token == data.token,
            PasswordReset.expires_at > datetime.now(UTC),
        )
        .first()
    )
    if not reset:
        raise HTTPException(
            status_code=400, detail="Token yaroqsiz yoki muddati o'tgan"
        )
    user = db.query(User).filter(User.id == reset.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if not user.is_active:
        raise HTTPException(status_code=403, detail=INACTIVE_ACCOUNT_DETAIL)
    user.password = hash_password(data.password)
    db.delete(reset)
    db.commit()
    access_token = create_access_token(user.email)
    refresh_token = _issue_refresh_token(db, user)
    db.commit()
    payload = {
        "message": "Parol muvaffaqiyatli o'zgartirildi",
        "redirect": dashboard_path_for_role(user.role),
        "user": _serialize_user(user),
    }
    response = JSONResponse(payload)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=_is_production(),
        max_age=3600,
        samesite="strict",
    )
    _set_refresh_cookie(response, refresh_token)
    return response
