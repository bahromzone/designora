from __future__ import annotations

import math
import uuid
from urllib.parse import quote

import boto3
from botocore.config import Config as BotoConfig
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.user import User
from app.routers.instructor import _owned_course, require_instructor

router = APIRouter(prefix="/api/uploads/video", tags=["Video uploads"])


def _client():
    if not all((settings.VIDEO_STORAGE_ACCESS_KEY, settings.VIDEO_STORAGE_SECRET_KEY, settings.VIDEO_STORAGE_PUBLIC_BASE_URL)):
        raise HTTPException(status_code=503, detail="Video storage productionda sozlanmagan")
    return boto3.client(
        "s3",
        endpoint_url=settings.VIDEO_STORAGE_ENDPOINT or None,
        region_name=settings.VIDEO_STORAGE_REGION,
        aws_access_key_id=settings.VIDEO_STORAGE_ACCESS_KEY,
        aws_secret_access_key=settings.VIDEO_STORAGE_SECRET_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


class InitiateIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(pattern=r"^video/(mp4|webm|quicktime)$")
    size: int = Field(gt=0)


class CompletePart(BaseModel):
    part_number: int = Field(ge=1, le=10000)
    etag: str = Field(min_length=1, max_length=200)


class CompleteIn(BaseModel):
    upload_id: str = Field(min_length=1, max_length=300)
    key: str = Field(min_length=1, max_length=500)
    parts: list[CompletePart] = Field(min_length=1, max_length=10000)


def _lesson(course_id: int, lesson_id: int, db: Session, user: User) -> Lesson:
    course = _owned_course(db, course_id, user)
    row = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.course_id == course.id).first()
    if not row: raise HTTPException(status_code=404, detail="Dars topilmadi")
    return row


@router.post("/{course_id}/{lesson_id}/initiate")
def initiate(course_id: int, lesson_id: int, data: InitiateIn, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    _lesson(course_id, lesson_id, db, user)
    max_bytes = settings.VIDEO_UPLOAD_MAX_GB * 1024**3
    if data.size > max_bytes: raise HTTPException(status_code=413, detail=f"Video {settings.VIDEO_UPLOAD_MAX_GB} GB dan katta bo'lmasligi kerak")
    client = _client()
    ext = data.filename.rsplit(".", 1)[-1].lower() if "." in data.filename else "mp4"
    if ext not in {"mp4", "webm", "mov", "m4v"}: raise HTTPException(status_code=400, detail="MP4, WebM, MOV yoki M4V kerak")
    key = f"courses/{course_id}/lessons/{lesson_id}/{uuid.uuid4().hex}.{ext}"
    result = client.create_multipart_upload(Bucket=settings.VIDEO_STORAGE_BUCKET, Key=key, ContentType=data.content_type, Metadata={"course-id": str(course_id), "lesson-id": str(lesson_id)})
    upload_id = result["UploadId"]
    part_size = settings.VIDEO_UPLOAD_PART_SIZE_MB * 1024**2
    count = math.ceil(data.size / part_size)
    urls = [client.generate_presigned_url("upload_part", Params={"Bucket": settings.VIDEO_STORAGE_BUCKET, "Key": key, "UploadId": upload_id, "PartNumber": number}, ExpiresIn=settings.VIDEO_UPLOAD_URL_TTL_SECONDS) for number in range(1, count + 1)]
    return {"upload_id": upload_id, "key": key, "part_size": part_size, "parts": [{"part_number": i + 1, "url": url} for i, url in enumerate(urls)], "expires_in": settings.VIDEO_UPLOAD_URL_TTL_SECONDS}


@router.post("/{course_id}/{lesson_id}/complete")
def complete(course_id: int, lesson_id: int, data: CompleteIn, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    lesson = _lesson(course_id, lesson_id, db, user)
    if not data.key.startswith(f"courses/{course_id}/lessons/{lesson_id}/"): raise HTTPException(status_code=400, detail="Upload key noto'g'ri")
    client = _client()
    client.complete_multipart_upload(Bucket=settings.VIDEO_STORAGE_BUCKET, Key=data.key, UploadId=data.upload_id, MultipartUpload={"Parts": [{"PartNumber": item.part_number, "ETag": item.etag} for item in sorted(data.parts, key=lambda item: item.part_number)]})
    public_url = f"{settings.VIDEO_STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{quote(data.key)}"
    lesson.video_url = public_url
    lesson.video_sources = [{"label": "Original", "url": public_url, "type": "video/mp4"}]
    lesson.processing_status = "ready"
    db.commit()
    return {"video_url": public_url, "processing_status": "ready"}


@router.delete("/{course_id}/{lesson_id}/{upload_id}")
def abort(course_id: int, lesson_id: int, upload_id: str, key: str, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    _lesson(course_id, lesson_id, db, user)
    client = _client()
    client.abort_multipart_upload(Bucket=settings.VIDEO_STORAGE_BUCKET, Key=key, UploadId=upload_id)
    return {"message": "Upload bekor qilindi"}
