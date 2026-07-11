"""Roadmap 3.20 course builder: autosave, ordering, preview, bulk upload and history."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.Course import Course
from app.models.course_version import CourseVersion
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User
from app.routers.instructor import _owned_course, require_instructor

router = APIRouter(prefix="/api/instructor/builder", tags=["Course Builder"])


def _lesson_dict(row: Lesson) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "module_id": row.module_id,
        "order": row.order or 0,
        "type": row.type or "video",
        "video_url": row.video_url,
        "duration_seconds": row.duration_seconds or 0,
        "description": row.description,
        "content": row.content,
        "is_free_preview": bool(row.is_free_preview),
        "resources": row.resources or [],
        "processing_status": row.processing_status or "ready",
    }


def _snapshot(course: Course) -> dict:
    modules = []
    for module in course.modules.order_by(Module.order.asc(), Module.id.asc()).all():
        modules.append(
            {
                "id": module.id,
                "title": module.title,
                "order": module.order or 0,
                "lessons": [
                    _lesson_dict(row)
                    for row in module.lessons.order_by(Lesson.order.asc(), Lesson.id.asc()).all()
                ],
            }
        )
    loose = [
        _lesson_dict(row)
        for row in course.lessons.filter(Lesson.module_id.is_(None)).order_by(Lesson.order.asc(), Lesson.id.asc()).all()
    ]
    return {
        "course": {
            "id": course.id,
            "title": course.title,
            "subtitle": course.subtitle,
            "description": course.description,
            "category": course.category,
            "price": course.price or 0,
            "level": course.level,
            "language": course.language,
            "thumbnail_url": course.thumbnail_url,
            "preview_video_url": course.preview_video_url,
            "learning_outcomes": course.learning_outcomes or [],
            "requirements": course.requirements or [],
            "prerequisite_course_ids": course.prerequisite_course_ids or [],
            "status": course.status,
            "builder_updated_at": course.builder_updated_at.isoformat() if course.builder_updated_at else None,
        },
        "modules": modules,
        "unassigned_lessons": loose,
    }


def _checklist(course: Course) -> list[dict]:
    lessons = course.lessons.all()
    checks = [
        ("title", "Kurs nomi", bool(course.title and len(course.title.strip()) >= 3)),
        ("description", "Kurs tavsifi", bool(course.description and len(course.description.strip()) >= 20)),
        ("thumbnail", "Muqova rasmi", bool(course.thumbnail_url)),
        ("outcomes", "O'quv natijalari", bool(course.learning_outcomes)),
        ("lesson", "Kamida bitta dars", bool(lessons)),
        ("content", "Barcha darslarda kontent", bool(lessons) and all(row.video_url or row.content for row in lessons)),
        ("processing", "Media processing tugagan", all((row.processing_status or "ready") == "ready" for row in lessons)),
    ]
    return [{"key": key, "label": label, "complete": complete} for key, label, complete in checks]


def _save_version(db: Session, course: Course, user: User, label: str) -> CourseVersion:
    version = CourseVersion(course_id=course.id, created_by=user.id, label=label, snapshot=_snapshot(course))
    db.add(version)
    return version


class AutosaveIn(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    category: str | None = None
    price: int | None = None
    level: str | None = None
    language: str | None = None
    thumbnail_url: str | None = None
    preview_video_url: str | None = None
    learning_outcomes: list[str] | None = None
    requirements: list[str] | None = None
    prerequisite_course_ids: list[int] | None = None


class OrderItem(BaseModel):
    id: int
    order: int = Field(ge=0)
    module_id: int | None = None


class ReorderIn(BaseModel):
    modules: list[OrderItem] = []
    lessons: list[OrderItem] = []


class BulkLessonIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    module_id: int | None = None
    type: str = "video"
    video_url: str | None = None
    content: str | None = None
    duration_seconds: int = 0


class BulkIn(BaseModel):
    lessons: list[BulkLessonIn] = Field(min_length=1, max_length=100)


class ProcessingIn(BaseModel):
    status: str


class VersionIn(BaseModel):
    label: str = Field(default="Manual snapshot", min_length=1, max_length=120)


@router.get("/courses/{course_id}")
def get_builder(course_id: int, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    payload = _snapshot(course)
    payload["checklist"] = _checklist(course)
    payload["can_publish"] = all(item["complete"] for item in payload["checklist"])
    return payload


@router.patch("/courses/{course_id}/autosave")
def autosave(course_id: int, data: AutosaveIn, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    fields = data.model_dump(exclude_unset=True)
    if "prerequisite_course_ids" in fields and course.id in fields["prerequisite_course_ids"]:
        raise HTTPException(status_code=400, detail="Kurs o'ziga prerequisite bo'la olmaydi")
    for key, value in fields.items():
        setattr(course, key, value)
    course.builder_updated_at = datetime.now(UTC)
    _save_version(db, course, user, "Autosave")
    db.commit()
    return {"message": "Avtomatik saqlandi", "saved_at": course.builder_updated_at.isoformat()}


@router.post("/courses/{course_id}/reorder")
def reorder(course_id: int, data: ReorderIn, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    module_ids = {row.id for row in course.modules.all()}
    lesson_ids = {row.id for row in course.lessons.all()}
    if any(item.id not in module_ids for item in data.modules) or any(item.id not in lesson_ids for item in data.lessons):
        raise HTTPException(status_code=400, detail="Boshqa kurs elementi yuborildi")
    for item in data.modules:
        db.query(Module).filter(Module.id == item.id).update({"order": item.order})
    for item in data.lessons:
        if item.module_id is not None and item.module_id not in module_ids:
            raise HTTPException(status_code=400, detail="Modul bu kursga tegishli emas")
        db.query(Lesson).filter(Lesson.id == item.id).update({"order": item.order, "module_id": item.module_id})
    course.builder_updated_at = datetime.now(UTC)
    db.commit()
    return {"message": "Tartib saqlandi"}


@router.post("/courses/{course_id}/bulk-lessons", status_code=201)
def bulk_lessons(course_id: int, data: BulkIn, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    module_ids = {row.id for row in course.modules.all()}
    created = []
    for index, item in enumerate(data.lessons):
        if item.module_id is not None and item.module_id not in module_ids:
            raise HTTPException(status_code=400, detail="Modul bu kursga tegishli emas")
        row = Lesson(
            course_id=course.id,
            module_id=item.module_id,
            title=item.title.strip(),
            type=item.type,
            video_url=item.video_url,
            content=item.content,
            duration_seconds=max(0, item.duration_seconds),
            order=index,
            processing_status="processing" if item.video_url else "ready",
        )
        db.add(row)
        db.flush()
        created.append(row.id)
    course.builder_updated_at = datetime.now(UTC)
    db.commit()
    return {"message": f"{len(created)} ta dars qo'shildi", "ids": created}


@router.patch("/lessons/{lesson_id}/processing")
def processing(lesson_id: int, data: ProcessingIn, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    if data.status not in {"queued", "processing", "ready", "failed"}:
        raise HTTPException(status_code=400, detail="Noto'g'ri processing holati")
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    _owned_course(db, lesson.course_id, user)
    lesson.processing_status = data.status
    db.commit()
    return {"message": "Processing holati yangilandi", "status": lesson.processing_status}


@router.get("/courses/{course_id}/preview")
def preview(course_id: int, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    payload = _snapshot(course)
    payload["preview_mode"] = True
    return payload


@router.get("/courses/{course_id}/checklist")
def checklist(course_id: int, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    items = _checklist(course)
    return {"items": items, "can_publish": all(item["complete"] for item in items)}


@router.get("/courses/{course_id}/versions")
def versions(course_id: int, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    rows = db.query(CourseVersion).filter(CourseVersion.course_id == course.id).order_by(CourseVersion.id.desc()).limit(30).all()
    return [{"id": row.id, "label": row.label, "created_at": row.created_at.isoformat()} for row in rows]


@router.post("/courses/{course_id}/versions", status_code=201)
def create_version(course_id: int, data: VersionIn, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    row = _save_version(db, course, user, data.label)
    db.commit()
    db.refresh(row)
    return {"message": "Versiya saqlandi", "id": row.id}


@router.post("/courses/{course_id}/versions/{version_id}/restore")
def restore(course_id: int, version_id: int, db: Session = Depends(get_db), user: User = Depends(require_instructor)):
    course = _owned_course(db, course_id, user)
    row = db.query(CourseVersion).filter(CourseVersion.id == version_id, CourseVersion.course_id == course.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Versiya topilmadi")
    _save_version(db, course, user, "Restore oldidan")
    values = row.snapshot.get("course", {})
    for key in ("title", "subtitle", "description", "category", "price", "level", "language", "thumbnail_url", "preview_video_url", "learning_outcomes", "requirements", "prerequisite_course_ids"):
        if key in values:
            setattr(course, key, values[key])
    course.builder_updated_at = datetime.now(UTC)
    db.commit()
    return {"message": "Versiya tiklandi"}
