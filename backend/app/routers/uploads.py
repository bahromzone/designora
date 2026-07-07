"""Uploads Router — validatsiyalangan fayl yuklash (XAVFSIZLIK bloki).

Prefix: /api/uploads

Avatar yuklashda kengaytma, hajm va magic-bytes tekshiriladi. Fayl nomi
xavfsiz (UUID) nomga almashtiriladi — path-traversal va bosib yozishning oldini
oladi.
"""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services import upload_service

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

BASE_DIR = Path(__file__).resolve().parent.parent
AVATAR_DIR = BASE_DIR / "static" / "avatars"


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
