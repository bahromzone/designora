"""Umumiy FastAPI bog'liqliklari (dependencies).

`get_current_active_user` — tokendan foydalanuvchini topadi VA uning
bloklanmaganini (`is_active`) tekshiradi.

Nega kerak: `get_current_user` faqat tokenni ochadi, bazaga qaramaydi.
Shu sabab admin tomonidan bloklangan foydalanuvchi eski tokeni bilan
ishlashda davom etardi. Yangi routerlarda `get_current_user` o'rniga
shu bog'liqlikdan foydalaning.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

INACTIVE_DETAIL = (
    "Hisobingiz bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling."
)


def ensure_active(user: User | None) -> User:
    """Foydalanuvchi mavjud va bloklanmaganini tekshiradi."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Avtorizatsiya talab etiladi",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=INACTIVE_DETAIL
        )
    return user


def get_current_active_user(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.email == email).first()
    return ensure_active(user)
