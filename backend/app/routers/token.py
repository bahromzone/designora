"""Token Router — refresh-token rotatsiyasi (XAVFSIZLIK bloki).

Prefix: /api/auth

Oqim:
- Login/register access-token (httpOnly cookie) beradi — qisqa muddatli.
- `POST /refresh` refresh-token (httpOnly cookie) orqali yangi access-token va
  yangi refresh-token beradi (rotatsiya). Eski refresh bekor qilinadi.
- Bekor qilingan tokendan qayta foydalanilsa (reuse) — foydalanuvchining barcha
  refresh tokenlari bekor qilinadi (o'g'irlik alomati).
- `POST /logout-all` barcha refresh tokenlarni bekor qiladi.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import token_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])

_REFRESH_COOKIE = "refresh_token"


def _is_production() -> bool:
    return settings.ENVIRONMENT == "production"


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


def issue_refresh_token(
    db: Session, user: User, *, user_agent: str | None = None
) -> str:
    """Yangi refresh-token yaratadi, hash'ini saqlaydi, ochiq matnni qaytaradi."""
    raw = token_service.generate_refresh_token()
    rec = RefreshToken(
        user_id=user.id,
        token_hash=token_service.hash_token(raw),
        expires_at=token_service.refresh_expiry(),
        user_agent=(user_agent or "")[:255] or None,
    )
    db.add(rec)
    db.flush()
    return raw


@router.post("/refresh")
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    raw = request.cookies.get(_REFRESH_COOKIE)
    if not raw:
        raise HTTPException(status_code=401, detail="Refresh-token topilmadi")

    token_hash = token_service.hash_token(raw)
    rec = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=401, detail="Refresh-token yaroqsiz")

    # Reuse-detection: bekor qilingan tokendan foydalanildi — hammasi bekor qilinadi
    if not rec.is_active:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == rec.user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({RefreshToken.revoked_at: datetime.now(UTC)})
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Refresh-token qayta ishlatildi — barcha sessiyalar bekor qilindi",
        )

    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi")

    # Rotatsiya: eskisini bekor qilamiz, yangisini beramiz
    new_raw = issue_refresh_token(
        db, user, user_agent=request.headers.get("user-agent")
    )
    rec.revoked_at = datetime.now(UTC)
    rec.replaced_by = token_service.hash_token(new_raw)
    db.commit()

    access = create_access_token(user.email)
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=_is_production(),
        max_age=3600,
        samesite="strict",
    )
    _set_refresh_cookie(response, new_raw)
    return {
        "access_token": access,
        "token_type": "bearer",
    }


@router.post("/logout-all")
def logout_all(
    request: Request,
    response: Response,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchining barcha refresh tokenlarini bekor qiladi."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    revoked = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked_at.is_(None),
        )
        .update({RefreshToken.revoked_at: datetime.now(UTC)})
    )
    db.commit()
    response.delete_cookie("access_token")
    response.delete_cookie(_REFRESH_COOKIE, path="/api/auth")
    return {"message": "Barcha sessiyalar yopildi", "revoked": revoked}


@router.post("/issue-refresh")
def issue_refresh_for_current(
    request: Request,
    response: Response,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Joriy (access bilan kirgan) foydalanuvchiga refresh-token beradi.

    Frontend login'dan keyin bir marta chaqiradi va shundan so'ng jim
    `POST /refresh` orqali sessiyani uzaytirib boradi.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    raw = issue_refresh_token(db, user, user_agent=request.headers.get("user-agent"))
    db.commit()
    _set_refresh_cookie(response, raw)
    return {"message": "Refresh-token berildi"}
