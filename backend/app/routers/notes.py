"""Notes Router — talabaning dars/video eslatmalari (BOSQICH 3).

Prefix: /api/notes
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lesson import Lesson
from app.models.note import LessonNote
from app.models.user import User

router = APIRouter(prefix="/api/notes", tags=["Notes"])


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


class NoteIn(BaseModel):
    body: Annotated[str, StringConstraints(min_length=1, max_length=4000)]
    timestamp_seconds: int | None = 0


class NotePatch(BaseModel):
    body: Annotated[str, StringConstraints(min_length=1, max_length=4000)] | None = None
    timestamp_seconds: int | None = None


def _note_dict(n: LessonNote) -> dict:
    return {
        "id": n.id,
        "lesson_id": n.lesson_id,
        "course_id": n.course_id,
        "body": n.body,
        "timestamp_seconds": n.timestamp_seconds or 0,
        "created_at": n.created_at.isoformat() if n.created_at else None,
        "updated_at": n.updated_at.isoformat() if n.updated_at else None,
    }


@router.get("/lessons/{lesson_id}")
def list_lesson_notes(
    lesson_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    notes = (
        db.query(LessonNote)
        .filter(LessonNote.lesson_id == lesson_id, LessonNote.user_id == user.id)
        .order_by(LessonNote.timestamp_seconds.asc(), LessonNote.id.asc())
        .all()
    )
    return [_note_dict(n) for n in notes]


@router.get("/my")
def list_my_notes(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    notes = (
        db.query(LessonNote)
        .filter(LessonNote.user_id == user.id)
        .order_by(LessonNote.updated_at.desc())
        .all()
    )
    return [_note_dict(n) for n in notes]


@router.post("/lessons/{lesson_id}", status_code=201)
def create_note(
    lesson_id: int,
    data: NoteIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    note = LessonNote(
        lesson_id=lesson_id,
        course_id=lesson.course_id,
        user_id=user.id,
        body=data.body,
        timestamp_seconds=data.timestamp_seconds or 0,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return JSONResponse(status_code=201, content=_note_dict(note))


@router.patch("/{note_id}")
def update_note(
    note_id: int,
    data: NotePatch,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    note = (
        db.query(LessonNote)
        .filter(LessonNote.id == note_id, LessonNote.user_id == user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Eslatma topilmadi")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return _note_dict(note)


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    note = (
        db.query(LessonNote)
        .filter(LessonNote.id == note_id, LessonNote.user_id == user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Eslatma topilmadi")
    db.delete(note)
    db.commit()
    return {"message": "Eslatma o'chirildi", "id": note_id}
