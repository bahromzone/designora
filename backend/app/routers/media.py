from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.user import User
from app.services import video_service

router = APIRouter(prefix="/api/media", tags=["Media"])
_STAFF_ROLES = {"admin", "superadmin"}
_VIDEO_URL_TTL_SECONDS = 300


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _lesson_access(db: Session, user: User, lesson: Lesson) -> None:
    if lesson.is_free_preview or user.role in _STAFF_ROLES:
        return
    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == lesson.course_id)
        .first()
    )
    if not enrolled:
        raise HTTPException(status_code=403, detail="Avval kursga yozilishingiz kerak")


class ProgressIn(BaseModel):
    position_seconds: int = Field(ge=0)
    duration_seconds: int = Field(ge=0)


@router.put("/lessons/{lesson_id}/progress")
def save_video_progress(
    lesson_id: int,
    data: ProgressIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    _lesson_access(db, user, lesson)
    row = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id
        )
        .first()
    )
    if not row:
        row = LessonProgress(
            user_id=user.id, lesson_id=lesson.id, course_id=lesson.course_id
        )
        db.add(row)
    row.position_seconds = data.position_seconds
    row.duration_seconds = data.duration_seconds
    db.commit()
    return {"message": "Progress saqlandi", "position_seconds": row.position_seconds}


@router.post("/lessons/{lesson_id}/sign")
def sign_lesson_video(
    lesson_id: int,
    response: Response,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store, private, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Referrer-Policy"] = "no-referrer"
    user = _get_user(db, email)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    _lesson_access(db, user, lesson)
    sources = lesson.video_sources or (
        [{"label": "Auto", "url": lesson.video_url, "type": "video/mp4"}]
        if lesson.video_url
        else []
    )
    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id
        )
        .first()
    )
    if not sources:
        # A lesson may be valid before its video is uploaded. Return the same
        # manifest shape with no sources so the player can show its existing
        # "video unavailable" state instead of creating a noisy 404.
        return {
            "lesson_id": lesson.id,
            "sources": [],
            "subtitles": lesson.subtitles or [],
            "resume_seconds": progress.position_seconds if progress else 0,
        }
    signed_sources = []
    primary = None
    for source in sources:
        signed = video_service.build_signed_url(
            source["url"],
            settings.media_signing_key,
            base_url=settings.MEDIA_CDN_BASE_URL,
            ttl_seconds=_VIDEO_URL_TTL_SECONDS,
        )
        if primary is None:
            primary = signed
        signed_sources.append({**source, "url": signed["url"]})
    return {
        "lesson_id": lesson.id,
        **primary,
        "sources": signed_sources,
        "subtitles": lesson.subtitles or [],
        "resume_seconds": progress.position_seconds if progress else 0,
    }


@router.get("/verify")
def verify_signature(path: str, expires: int, token: str):
    return {
        "valid": video_service.verify_signed(
            path, expires, token, settings.media_signing_key
        )
    }
