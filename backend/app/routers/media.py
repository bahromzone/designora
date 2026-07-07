"""Media Router — himoyalangan video uchun signed URL (BOSQICH 5).

Prefix: /api/media

Foydalanuvchi faqat ochiq (bepul preview) yoki o'zi yozilgan kursning
videosiga imzolangan, muddati o'tuvchi havola oladi. Tekshirish endpointi
ommaviy (CDN/edge tomonidan chaqiriladi).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.user import User
from app.services import video_service

router = APIRouter(prefix="/api/media", tags=["Media"])

_STAFF_ROLES = {"admin", "superadmin"}


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


@router.post("/lessons/{lesson_id}/sign")
def sign_lesson_video(
    lesson_id: int,
    ttl: int = Query(3600, ge=60, le=86400),
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    if not lesson.video_url:
        raise HTTPException(status_code=404, detail="Videoning manzili yo'q")

    unlocked = bool(lesson.is_free_preview) or user.role in _STAFF_ROLES
    if not unlocked:
        enrolled = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == user.id,
                Enrollment.course_id == lesson.course_id,
            )
            .first()
        )
        if not enrolled:
            raise HTTPException(
                status_code=403, detail="Avval kursga yozilishingiz kerak"
            )

    signed = video_service.build_signed_url(
        lesson.video_url,
        settings.media_signing_key,
        base_url=settings.MEDIA_CDN_BASE_URL,
        ttl_seconds=ttl,
    )
    return {"lesson_id": lesson.id, **signed}


@router.get("/verify")
def verify_signature(
    path: str,
    expires: int,
    token: str,
):
    """Imzolangan havolani tekshiradi (ommaviy — CDN/edge uchun)."""
    valid = video_service.verify_signed(
        path, expires, token, settings.media_signing_key
    )
    return {"valid": valid}
