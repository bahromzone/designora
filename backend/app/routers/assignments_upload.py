"""Secure assignment file uploads.

Uploads are streamed to disk and validated from a bounded prefix before an
atomic rename, so a large request cannot consume all backend memory.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.security import get_current_user
from app.services import upload_service

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

BASE_DIR = Path(__file__).resolve().parent.parent
SUBMISSION_DIR = BASE_DIR / "static" / "submissions"
MAX_BYTES = upload_service.MAX_ASSIGNMENT_BYTES


def _validate_sample(filename: str, sample: bytes, size: int) -> str:
    try:
        return upload_service.validate_upload_metadata(
            filename,
            sample,
            size,
            allowed_extensions=(
                upload_service.IMAGE_EXTENSIONS | upload_service.DOCUMENT_EXTENSIONS
            ),
            max_bytes=MAX_BYTES,
        )
    except upload_service.UploadValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def _stream_assignment(file: UploadFile) -> tuple[str, int, str]:
    SUBMISSION_DIR.mkdir(parents=True, exist_ok=True)
    sample = bytearray()
    size = 0
    temporary = NamedTemporaryFile(
        dir=SUBMISSION_DIR, prefix=".upload-", delete=False
    )
    try:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail="Fayl hajmi 20 MB dan oshmasligi kerak",
                )
            if len(sample) < 64:
                sample.extend(chunk[: 64 - len(sample)])
            temporary.write(chunk)
        temporary.flush()
        temporary.close()
        ext = _validate_sample(file.filename or "", bytes(sample), size)
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        os.replace(temporary.name, SUBMISSION_DIR / safe_name)
        return ext, size, safe_name
    except Exception:
        temporary.close()
        try:
            os.unlink(temporary.name)
        except FileNotFoundError:
            pass
        raise


@router.post("/upload")
async def upload_assignment_file(
    file: UploadFile = File(...),
    _email: str = Depends(get_current_user),
):
    _, size, safe_name = await _stream_assignment(file)
    return {
        "file_url": f"/static/submissions/{safe_name}",
        "original_name": Path(file.filename or safe_name).name,
        "size": size,
    }
