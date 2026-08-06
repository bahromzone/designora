"""Xavfsiz avatar, assignment va instructor video upload endpointlari."""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from tempfile import NamedTemporaryFile

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


async def _stream_upload(
    file: UploadFile,
    directory: Path,
    validator,
    max_bytes: int,
) -> tuple[str, int, str]:
    """Stream to a temporary file, validate a bounded prefix, then publish atomically."""
    directory.mkdir(parents=True, exist_ok=True)
    sample = bytearray()
    size = 0
    temporary = NamedTemporaryFile(dir=directory, prefix=".upload-", delete=False)
    try:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                raise upload_service.UploadValidationError(
                    f"Fayl hajmi {max_bytes / (1024 * 1024):.0f} MB dan oshmasligi kerak"
                )
            if len(sample) < 64:
                sample.extend(chunk[: 64 - len(sample)])
            temporary.write(chunk)
        temporary.flush()
        temporary.close()
        ext = validator(file.filename or "", bytes(sample), size)
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        target = directory / safe_name
        os.replace(temporary.name, target)
        return ext, size, safe_name
    except Exception:
        temporary.close()
        try:
            os.unlink(temporary.name)
        except FileNotFoundError:
            pass
        raise


def _avatar_validator(filename: str, sample: bytes, size: int) -> str:
    return upload_service.validate_upload_metadata(
        filename,
        sample,
        size,
        allowed_extensions=upload_service.IMAGE_EXTENSIONS,
        max_bytes=upload_service.MAX_AVATAR_BYTES,
    )


def _video_validator(filename: str, sample: bytes, size: int) -> str:
    return upload_service.validate_upload_metadata(
        filename,
        sample,
        size,
        allowed_extensions=upload_service.VIDEO_EXTENSIONS,
        max_bytes=upload_service.MAX_VIDEO_BYTES,
    )


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
    try:
        ext, _, safe_name = await _stream_upload(
            file, AVATAR_DIR, _avatar_validator, upload_service.MAX_AVATAR_BYTES
        )
    except upload_service.UploadValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    url = f"/static/avatars/{safe_name}"
    user.avatar_url = url
    db.commit()
    return {"message": "Avatar yuklandi", "avatar_url": url, "extension": ext}


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
    try:
        ext, size, safe_name = await _stream_upload(
            file, VIDEO_DIR, _video_validator, upload_service.MAX_VIDEO_BYTES
        )
    except upload_service.UploadValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

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
        "size": size,
    }
