"""Protected video manifests, signed sources and resumable progress."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
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


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _lesson_for_user(db: Session, lesson_id: int, user: User) -> Lesson:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    unlocked = bool(lesson.is_free_preview) or user.role in _STAFF_ROLES
    if not unlocked:
        unlocked = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == user.id,
                Enrollment.course_id == lesson.course_id,
            )
            .first()
            is not None
        )
    if not unlocked:
        raise HTTPException(status_code=403, detail="Avval kursga yozilishingiz kerak")
    return lesson


def _signed(path: str, ttl: int) -> dict:
    return video_service.build_signed_url(
        path,
        settings.media_signing_key,
        base_url=settings.MEDIA_CDN_BASE_URL,
        ttl_seconds=ttl,
    )


class ProgressIn(BaseModel):
    position_seconds: int = Field(ge=0, le=86400)
    duration_seconds: int = Field(default=0, ge=0, le=86400)


@router.post("/lessons/{lesson_id}/sign")
def sign_lesson_video(
    lesson_id: int,
    ttl: int = Query(3600, ge=60, le=86400),
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    lesson = _lesson_for_user(db, lesson_id, user)
    raw_sources = lesson.video_sources or []
    if not raw_sources and lesson.video_url:
        raw_sources = [{"label": "Auto", "url": lesson.video_url, "type": "auto"}]
    if not raw_sources:
        raise HTTPException(status_code=404, detail="Videoning manzili yo'q")

    sources = []
    for source in raw_sources:
        if not source.get("url"):
            continue
        sources.append(
            {
                "label": source.get("label") or "Auto",
                "type": source.get("type") or "video/mp4",
                **_signed(source["url"], ttl),
            }
        )
    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.lesson_id == lesson.id,
            LessonProgress.user_id == user.id,
        )
        .first()
    )
    return {
        "lesson_id": lesson.id,
        "sources": sources,
        "subtitles": lesson.subtitles or [],
        "resume_seconds": progress.video_position_seconds if progress else 0,
        **sources[0],
    }


@router.get("/lessons/{lesson_id}/progress")
def get_video_progress(
    lesson_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    _lesson_for_user(db, lesson_id, user)
    row = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.lesson_id == lesson_id,
            LessonProgress.user_id == user.id,
        )
        .first()
    )
    return {
        "position_seconds": row.video_position_seconds if row else 0,
        "duration_seconds": row.video_duration_seconds if row else 0,
    }


@router.put("/lessons/{lesson_id}/progress")
def save_video_progress(
    lesson_id: int,
    data: ProgressIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    lesson = _lesson_for_user(db, lesson_id, user)
    row = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.lesson_id == lesson.id,
            LessonProgress.user_id == user.id,
        )
        .first()
    )
    if not row:
        row = LessonProgress(
            user_id=user.id,
            lesson_id=lesson.id,
            course_id=lesson.course_id,
        )
        db.add(row)
    row.video_position_seconds = data.position_seconds
    row.video_duration_seconds = data.duration_seconds
    row.last_watched_at = datetime.now(UTC)
    db.commit()
    return {"saved": True, "position_seconds": row.video_position_seconds}


@router.get("/verify")
def verify_signature(path: str, expires: int, token: str):
    return {
        "valid": video_service.verify_signed(
            path, expires, token, settings.media_signing_key
        )
    }
