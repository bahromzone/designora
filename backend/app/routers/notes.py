"""Searchable timestamped notes, bookmarks and export."""

from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lesson import Lesson
from app.models.note import LessonBookmark, LessonNote
from app.models.user import User

router = APIRouter(prefix="/api/notes", tags=["Notes"])


def _user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


class NoteIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    timestamp_seconds: int = Field(default=0, ge=0, le=86400)


class NotePatch(BaseModel):
    body: str | None = Field(default=None, min_length=1, max_length=4000)
    timestamp_seconds: int | None = Field(default=None, ge=0, le=86400)


def _note(row: LessonNote) -> dict:
    return {
        "id": row.id,
        "lesson_id": row.lesson_id,
        "course_id": row.course_id,
        "lesson_title": row.lesson.title if row.lesson else None,
        "body": row.body,
        "timestamp_seconds": row.timestamp_seconds or 0,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@router.get("/lessons/{lesson_id}")
def lesson_notes(lesson_id: int, q: str | None = None, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    query = db.query(LessonNote).filter(LessonNote.lesson_id == lesson_id, LessonNote.user_id == user.id)
    if q:
        query = query.filter(LessonNote.body.ilike(f"%{q.strip()}%"))
    return [_note(row) for row in query.order_by(LessonNote.timestamp_seconds.asc(), LessonNote.id.asc()).all()]


@router.get("/my")
def my_notes(q: str | None = None, course_id: int | None = None, limit: int = Query(100, ge=1, le=500), email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    query = db.query(LessonNote).filter(LessonNote.user_id == user.id)
    if q:
        query = query.join(Lesson).filter(or_(LessonNote.body.ilike(f"%{q.strip()}%"), Lesson.title.ilike(f"%{q.strip()}%")))
    if course_id:
        query = query.filter(LessonNote.course_id == course_id)
    return [_note(row) for row in query.order_by(LessonNote.updated_at.desc()).limit(limit).all()]


@router.get("/recent")
def recent_note(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    row = db.query(LessonNote).filter(LessonNote.user_id == user.id).order_by(LessonNote.updated_at.desc()).first()
    return _note(row) if row else None


@router.get("/export")
def export_notes(format: str = Query("markdown", pattern="^(markdown|text)$"), email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = my_notes(limit=500, email=email, db=db)
    output = StringIO()
    if format == "markdown":
        output.write("# Designora eslatmalari\n\n")
    for row in rows:
        stamp = f"{row['timestamp_seconds'] // 60}:{row['timestamp_seconds'] % 60:02d}"
        if format == "markdown":
            output.write(f"## {row['lesson_title'] or 'Dars'} ({stamp})\n\n{row['body']}\n\n")
        else:
            output.write(f"{row['lesson_title'] or 'Dars'} [{stamp}]\n{row['body']}\n\n")
    media = "text/markdown" if format == "markdown" else "text/plain"
    return PlainTextResponse(output.getvalue(), media_type=media, headers={"Content-Disposition": f'attachment; filename="designora-notes.{"md" if format == "markdown" else "txt"}"'})


@router.post("/lessons/{lesson_id}", status_code=201)
def create_note(lesson_id: int, data: NoteIn, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    row = LessonNote(lesson_id=lesson.id, course_id=lesson.course_id, user_id=user.id, body=data.body.strip(), timestamp_seconds=data.timestamp_seconds)
    db.add(row); db.commit(); db.refresh(row)
    return _note(row)


@router.patch("/{note_id}")
def update_note(note_id: int, data: NotePatch, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    row = db.query(LessonNote).filter(LessonNote.id == note_id, LessonNote.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Eslatma topilmadi")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(row, key, value.strip() if key == "body" else value)
    db.commit(); db.refresh(row)
    return _note(row)


@router.delete("/{note_id}")
def delete_note(note_id: int, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    row = db.query(LessonNote).filter(LessonNote.id == note_id, LessonNote.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Eslatma topilmadi")
    db.delete(row); db.commit()
    return {"message": "Eslatma o‘chirildi", "id": note_id}


@router.get("/bookmarks")
def bookmarks(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    rows = db.query(LessonBookmark, Lesson).join(Lesson, LessonBookmark.lesson_id == Lesson.id).filter(LessonBookmark.user_id == user.id, LessonBookmark.is_bookmarked == True).order_by(LessonBookmark.updated_at.desc()).all()
    return [{"lesson_id": mark.lesson_id, "course_id": mark.course_id, "lesson_title": lesson.title, "updated_at": mark.updated_at.isoformat() if mark.updated_at else None} for mark, lesson in rows]


@router.put("/bookmarks/{lesson_id}")
def set_bookmark(lesson_id: int, bookmarked: bool = True, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    row = db.query(LessonBookmark).filter(LessonBookmark.user_id == user.id, LessonBookmark.lesson_id == lesson.id).first()
    if not row:
        row = LessonBookmark(user_id=user.id, lesson_id=lesson.id, course_id=lesson.course_id)
        db.add(row)
    row.is_bookmarked = bookmarked
    db.commit()
    return {"lesson_id": lesson.id, "bookmarked": bookmarked}
