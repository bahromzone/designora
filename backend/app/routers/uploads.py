"""Xavfsiz avatar, assignment va instructor video upload endpointlari."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lesson import Lesson
from app.models.user import User
from app.routers.instructor import _owned_course, require_instructor
from app.services import upload_service

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

BASE_DIR = Path(__file__).resolve().parent.parent
AVATAR_DIR = BASE_DIR / "static" / "avatars"
VIDEO_DIR = BASE_DIR / "static" / "videos"


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    content = await file.read()
    try:
        ext = upload_service.validate_avatar(file.filename or "", content)
    except upload_service.UploadValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    (AVATAR_DIR / safe_name).write_bytes(content)
    url = f"/static/avatars/{safe_name}"
    user.avatar_url = url
    db.commit()
    return {"message": "Avatar yuklandi", "avatar_url": url}


@router.post("/video/{course_id}/{lesson_id}")
async def upload_lesson_video(
    course_id: int,
    lesson_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    course = _owned_course(db, course_id, user)
    lesson = (
        db.query(Lesson)
        .filter(Lesson.id == lesson_id, Lesson.course_id == course.id)
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    content = await file.read()
    try:
        ext = upload_service.validate_video(file.filename or "", content)
    except upload_service.UploadValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    target = VIDEO_DIR / safe_name
    target.write_bytes(content)
    url = f"/static/videos/{safe_name}"
    lesson.video_url = url
    lesson.video_sources = [
        {
            "label": "Original",
            "url": url,
            "type": f"video/{'webm' if ext == 'webm' else 'mp4'}",
        }
    ]
    lesson.processing_status = "ready"
    db.commit()
    return {
        "message": "Video yuklandi",
        "video_url": url,
        "processing_status": "ready",
        "size": len(content),
    }
