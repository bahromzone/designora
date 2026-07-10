"""Secure assignment file uploads.

Kept separate from the assignment CRUD router so upload policy stays small,
auditable and easy to replace with object storage later.
"""
from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.security import get_current_user

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

BASE_DIR = Path(__file__).resolve().parent.parent
SUBMISSION_DIR = BASE_DIR / "static" / "submissions"
MAX_BYTES = 20 * 1024 * 1024
ALLOWED = {
    "pdf": {b"%PDF"},
    "png": {b"\x89PNG"},
    "jpg": {b"\xff\xd8\xff"},
    "jpeg": {b"\xff\xd8\xff"},
    "webp": {b"RIFF"},
    "zip": {b"PK\x03\x04", b"PK\x05\x06"},
}


def _validate(filename: str, content: bytes) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="PDF, PNG, JPG, WEBP yoki ZIP yuklang")
    if not content:
        raise HTTPException(status_code=400, detail="Bo'sh fayl yuklab bo'lmaydi")
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Fayl hajmi 20 MB dan oshmasligi kerak")
    if not any(content.startswith(signature) for signature in ALLOWED[ext]):
        raise HTTPException(status_code=400, detail="Fayl turi kengaytmasiga mos emas")
    if ext == "webp" and content[8:12] != b"WEBP":
        raise HTTPException(status_code=400, detail="WEBP fayli buzilgan")
    return "jpg" if ext == "jpeg" else ext


@router.post("/upload")
async def upload_assignment_file(
    file: UploadFile = File(...),
    _email: str = Depends(get_current_user),
):
    content = await file.read(MAX_BYTES + 1)
    ext = _validate(file.filename or "", content)
    SUBMISSION_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    (SUBMISSION_DIR / safe_name).write_bytes(content)
    return {
        "file_url": f"/static/submissions/{safe_name}",
        "original_name": Path(file.filename or safe_name).name,
        "size": len(content),
    }
