"""Admin users router — admin va superadmin uchun foydalanuvchilar ro'yxati.

Bu endpoint ilgari `app/main.py` ichida inline `APIRouter` sifatida yozilgan edi.
Ikki muammosi bor edi:

1. `is_active` tekshirilmasdi — superadmin tomonidan bloklangan admin hali ham
   butun foydalanuvchilar bazasini o'qiy olardi.
2. Javobda `created_at` yo'q edi, lekin frontend (`AdminUsersPage`) uni
   render qilardi va ustun doim "-" ko'rsatardi.

Rol va account holatini o'zgartirish bu yerda emas — u superadmin control
plane'da (`app/routers/superadmin.py`).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["Admin - Users"])

_ADMIN_ROLES = {"admin", "superadmin"}


def require_admin(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    if user.role not in _ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user


def _serialize(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.id.desc()).all()
    return [_serialize(user) for user in users]
