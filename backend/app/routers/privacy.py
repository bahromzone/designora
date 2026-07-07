"""Privacy Router — GDPR: ma'lumotni eksport va hisobni o'chirish (XAVFSIZLIK).

Prefix: /api/privacy

- `GET /export` — foydalanuvchining barcha shaxsiy ma'lumotlarini JSON'da beradi.
- `DELETE /account` — hisobni va bog'liq ma'lumotlarni o'chiradi (right to be
  forgotten). Parol tasdig'i talab qilinadi (local hisoblar uchun).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.password import verify_password
from app.core.security import get_current_user
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.review import Review
from app.models.user import User

router = APIRouter(prefix="/api/privacy", tags=["Privacy"])


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


class DeleteAccountIn(BaseModel):
    password: str | None = None
    confirm: bool = False


@router.get("/export")
def export_my_data(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi ma'lumotlarini mashina o'qiy oladigan JSON'da qaytaradi."""
    user = _get_user(db, email)

    enrollments = db.query(Enrollment).filter(Enrollment.user_id == user.id).all()
    certificates = db.query(Certificate).filter(Certificate.user_id == user.id).all()
    reviews = db.query(Review).filter(Review.user_id == user.id).all()

    return {
        "profile": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "bio": user.bio,
            "phone": user.phone,
            "location": user.location,
            "website": user.website,
            "avatar_url": user.avatar_url,
            "points": user.points,
            "level": user.level,
            "streak_days": user.streak_days,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
        "enrollments": [
            {
                "course_id": e.course_id,
                "progress_percent": e.progress_percent,
                "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
            }
            for e in enrollments
        ],
        "certificates": [
            {
                "course_id": c.course_id,
                "serial": c.serial,
                "issued_at": c.issued_at.isoformat() if c.issued_at else None,
            }
            for c in certificates
        ],
        "reviews": [
            {
                "course_id": r.course_id,
                "rating": r.rating,
                "comment": r.comment,
            }
            for r in reviews
        ],
    }


@router.delete("/account")
def delete_my_account(
    data: DeleteAccountIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hisobni butunlay o'chiradi (right to be forgotten).

    Local (parolli) hisoblar uchun parol tasdig'i shart. Bog'liq yozuvlar
    ForeignKey ondelete=CASCADE orqali avtomatik tozalanadi.
    """
    user = _get_user(db, email)

    if not data.confirm:
        raise HTTPException(status_code=400, detail="O'chirishni tasdiqlang (confirm)")

    if user.password:
        if not data.password or not verify_password(data.password, user.password):
            raise HTTPException(status_code=403, detail="Parol noto'g'ri")

    db.delete(user)
    db.commit()
    return {"message": "Hisob va bog'liq ma'lumotlar o'chirildi"}
