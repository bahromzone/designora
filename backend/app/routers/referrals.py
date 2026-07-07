"""Referrals Router — referral / affiliate dasturi (BOSQICH 4).

Prefix: /api/referrals

Har bir foydalanuvchi noyob referral kodiga ega. Yangi foydalanuvchi kodni
qo'llaganda Referral yozuvi yaratiladi va taklif qilgan foydalanuvchiga ball
beriladi.
"""

import secrets
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.referral import Referral
from app.models.user import User
from app.services import notification_service
from app.services.gamification_service import award_points

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])

# Taklif qilgan foydalanuvchiga beriladigan ball
REFERRER_REWARD_POINTS = 50


def _now():
    return datetime.now(UTC)


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _unique_code(db: Session) -> str:
    while True:
        code = secrets.token_urlsafe(6).replace("_", "").replace("-", "")[:8].upper()
        if not db.query(User).filter(User.referral_code == code).first():
            return code


def _ensure_code(db: Session, user: User) -> str:
    if not user.referral_code:
        user.referral_code = _unique_code(db)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.referral_code


class ApplyIn(BaseModel):
    code: Annotated[str, StringConstraints(min_length=4, max_length=32)]


@router.get("/my-code")
def my_code(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    code = _ensure_code(db, user)
    referred = (
        db.query(Referral).filter(Referral.referrer_id == user.id).all()
    )
    converted = sum(1 for r in referred if r.status == "converted")
    return {
        "code": code,
        "total_referred": len(referred),
        "converted": converted,
        "points_earned": sum(r.reward_points or 0 for r in referred),
    }


@router.post("/apply")
def apply_code(
    data: ApplyIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)

    if user.referred_by_id:
        raise HTTPException(status_code=409, detail="Siz allaqachon kod qo'llagansiz")

    code = data.code.strip().upper()
    referrer = db.query(User).filter(User.referral_code == code).first()
    if not referrer:
        raise HTTPException(status_code=404, detail="Kod topilmadi")
    if referrer.id == user.id:
        raise HTTPException(status_code=400, detail="O'z kodingizni qo'llab bo'lmaydi")

    existing = (
        db.query(Referral).filter(Referral.referred_user_id == user.id).first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Siz allaqachon kod qo'llagansiz")

    referral = Referral(
        referrer_id=referrer.id,
        referred_user_id=user.id,
        code=code,
        status="pending",
        reward_points=REFERRER_REWARD_POINTS,
    )
    db.add(referral)
    user.referred_by_id = referrer.id
    db.flush()

    award_points(db, referrer, REFERRER_REWARD_POINTS)
    notification_service.notify(
        db,
        referrer.id,
        f"Sizning taklifingiz bilan yangi foydalanuvchi qo'shildi (+{REFERRER_REWARD_POINTS} ball)",
        type="success",
    )
    db.commit()
    return {"message": "Kod qo'llandi", "referrer_id": referrer.id}


@router.get("/my-referrals")
def my_referrals(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    rows = (
        db.query(Referral)
        .filter(Referral.referrer_id == user.id)
        .order_by(Referral.created_at.desc())
        .all()
    )
    out = []
    for r in rows:
        referred = db.query(User).filter(User.id == r.referred_user_id).first()
        out.append(
            {
                "id": r.id,
                "referred_name": referred.name if referred else None,
                "status": r.status,
                "reward_points": r.reward_points,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
        )
    return out
