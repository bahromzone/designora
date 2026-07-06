"""Gamification Router — ball, daraja, nishonlar, leaderboard (BOSQICH 3).

Prefix: /api/gamification
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.badge import Badge, UserBadge
from app.models.user import User
from app.services import gamification_service

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


@router.get("/leaderboard")
def leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return gamification_service.leaderboard(db, limit=limit)


@router.get("/me")
def my_gamification(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    rows = (
        db.query(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .filter(UserBadge.user_id == user.id)
        .order_by(UserBadge.earned_at.desc())
        .all()
    )
    badges = [
        {
            "code": b.code,
            "title": b.title,
            "description": b.description,
            "icon": b.icon,
            "earned_at": ub.earned_at.isoformat() if ub.earned_at else None,
        }
        for ub, b in rows
    ]
    # Keyingi darajagacha qolgan ball
    ppl = gamification_service.POINTS_PER_LEVEL
    points = user.points or 0
    to_next = ppl - (points % ppl)
    return {
        "points": points,
        "level": user.level or 1,
        "streak_days": user.streak_days or 0,
        "points_to_next_level": to_next,
        "badges": badges,
    }


@router.get("/badges")
def list_badges(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Barcha nishonlar katalogi + foydalanuvchi qaysilarini olgani."""
    user = _get_user(db, email)
    gamification_service.ensure_default_badges(db)
    earned_ids = {
        ub.badge_id
        for ub in db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
    }
    badges = db.query(Badge).order_by(Badge.id.asc()).all()
    return [
        {
            "code": b.code,
            "title": b.title,
            "description": b.description,
            "icon": b.icon,
            "points": b.points,
            "earned": b.id in earned_ids,
        }
        for b in badges
    ]
