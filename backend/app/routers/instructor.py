"""
Instructor Router — o'qituvchi (yoki admin) kurs mundarijasini boshqaradi.

Prefix: /api/instructor

Ruxsat: role ∈ {"instructor", "admin", "superadmin"}.
Kurs egasi (instructor_id) yoki admin tahrir qila oladi.
"""

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User

router = APIRouter(prefix="/api/instructor", tags=["Instructor"])

_INSTRUCTOR_ROLES = {"instructor", "admin", "superadmin"}
# Ariza berib, admin tasdig'ini kutayotgan foydalanuvchi roli.
_PENDING_ROLE = "instructor_pending"


# ── YORDAMCHILAR ────────────────────────────────────────────
def require_instructor(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if user.role not in _INSTRUCTOR_ROLES:
        raise HTTPException(status_code=403, detail="Faqat instruktor yoki admin uchun")
    return user


def _is_admin(user: User) -> bool:
    return user.role in {"admin", "superadmin"}


def _owned_course(db: Session, course_id: int, user: User) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    if not _is_admin(user) and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Bu kurs sizga tegishli emas")
    return course


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-") or "kurs"


def _unique_slug(db: Session, base: str, exclude_id: int | None = None) -> str:
    slug = base
    n = 1
    while True:
        q = db.query(Course).filter(Course.slug == slug)
        if exclude_id is not None:
            q = q.filter(Course.id != exclude_id)
        if not q.first():
            return slug
        n += 1
        slug = f"{base}-{n}"


# ── SCHEMAS ────────────────────────────────────────────────
class InstructorApplyIn(BaseModel):
    name: Annotated[str, StringConstraints(min_length=2, max_length=100)]
    bio: Annotated[str, StringConstraints(min_length=10, max_length=500)]
    portfolio_url: str | None = None


class CourseIn(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)]
    subtitle: str | None = None
    description: str | None = None
    category: str | None = None
    price: int | None = 0
    level: str | None = None
    language: str | None = None
    thumbnail_url: str | None = None
    preview_video_url: str | None = None
    learning_outcomes: list[str] | None = None
    requirements: list[str] | None = None


class CoursePatch(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)] | None = None
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
    is_active: bool | None = None


class ModuleIn(BaseModel):
    title: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    order: int | None = 0


class ModulePatch(BaseModel):
    title: Annotated[str, StringConstraints(min_length=1, max_length=200)] | None = None
    order: int | None = None


class LessonIn(BaseModel):
    title: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    module_id: int | None = None
    video_url: str | None = None
    order: int | None = 0
    duration_seconds: int | None = 0
    description: str | None = None
    content: str | None = None
    is_free_preview: bool | None = False
    type: str | None = "video"
    resources: list[dict] | None = None


class LessonPatch(BaseModel):
    title: Annotated[str, StringConstraints(min_length=1, max_length=200)] | None = None
    module_id: int | None = None
    video_url: str | None = None
    order: int | None = None
    duration_seconds: int | None = None
    description: str | None = None
    content: str | None = None
    is_free_preview: bool | None = None
    type: str | None = None
    resources: list[dict] | None = None


def _course_admin_dict(c: Course, db: Session) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "slug": c.slug,
        "subtitle": c.subtitle,
        "description": c.description,
        "category": c.category,
        "price": c.price,
        "level": c.level,
        "language": c.language,
        "status": c.status,
        "is_active": c.is_active,
        "thumbnail_url": c.thumbnail_url,
        "preview_video_url": c.preview_video_url,
        "learning_outcomes": c.learning_outcomes or [],
        "requirements": c.requirements or [],
        "students_count": c.students_count or 0,
        "modules_count": c.modules.count(),
        "lessons_count": c.lessons.count(),
    }


# ── INSTRUKTOR BO'LISH (apply) ────────────────────────────────
# Oddiy foydalanuvchi ariza beradi — rol "instructor_pending" bo'ladi va admin
# tasdig'ini kutadi. require_instructor bu yerda ISHLAMAYDI (u faqat mavjud
# instruktorlarni o'tkazadi), shuning uchun to'g'ridan-to'g'ri get_current_user.
# Yangi ustun qo'shmaymiz — bio/website mavjud ustunlarga yoziladi, holat esa
# role qiymatida saqlanadi (eski baza buzilmaydi).
@router.post("/apply")
def apply_instructor(
    data: InstructorApplyIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")

    if user.role in _INSTRUCTOR_ROLES:
        return {"message": "Siz allaqachon instruktorsiz", "role": user.role}

    if user.role == _PENDING_ROLE:
        return {
            "message": "Arizangiz allaqachon ko'rib chiqilmoqda",
            "role": user.role,
        }

    user.name = data.name or user.name
    user.bio = data.bio
    if data.portfolio_url:
        user.website = data.portfolio_url
    user.role = _PENDING_ROLE

    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Saqlashda xatolik: {e}")

    return {
        "message": "Arizangiz qabul qilindi. Admin ko'rib chiqqach xabar beramiz.",
        "role": user.role,
    }


# ── COURSES ────────────────────────────────────────────────
@router.get("/courses")
def list_my_courses(
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    q = db.query(Course)
    if not _is_admin(user):
        q = q.filter(Course.instructor_id == user.id)
    courses = q.order_by(Course.id.desc()).all()
    return [_course_admin_dict(c, db) for c in courses]


@router.post("/courses", status_code=201)
def create_course(
    data: CourseIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    slug = _unique_slug(db, _slugify(data.title))
    course = Course(
        title=data.title,
        subtitle=data.subtitle,
        description=data.description,
        category=data.category.lower() if data.category else None,
        price=data.price or 0,
        level=data.level or "boshlang'ich",
        language=data.language or "uz",
        thumbnail_url=data.thumbnail_url,
        preview_video_url=data.preview_video_url,
        learning_outcomes=data.learning_outcomes or [],
        requirements=data.requirements or [],
        slug=slug,
        status="draft",
        is_active=False,  # draft — chop etilmaguncha ko'rinmaydi
        instructor_id=user.id,
    )
    db.add(course)
    try:
        db.commit()
        db.refresh(course)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Saqlashda xatolik: {e}")

    return JSONResponse(
        status_code=201,
        content={"message": "Kurs yaratildi (qoralama)", "id": course.id, "slug": slug},
    )


@router.patch("/courses/{course_id}")
def update_course(
    course_id: int,
    data: CoursePatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    course = _owned_course(db, course_id, user)
    fields = data.model_dump(exclude_unset=True)
    if fields.get("category"):
        fields["category"] = fields["category"].lower()
    for field, value in fields.items():
        setattr(course, field, value)

    try:
        db.commit()
        db.refresh(course)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Yangilashda xatolik: {e}")

    return {"message": "Kurs yangilandi", "id": course.id}


@router.post("/courses/{course_id}/publish")
def publish_course(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    course = _owned_course(db, course_id, user)
    if course.lessons.count() == 0:
        raise HTTPException(status_code=400, detail="Kamida bitta dars bo'lishi kerak")
    course.status = "published"
    course.is_active = True
    db.commit()
    return {"message": "Kurs chop etildi", "status": course.status}


@router.post("/courses/{course_id}/unpublish")
def unpublish_course(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    course = _owned_course(db, course_id, user)
    course.status = "draft"
    course.is_active = False
    db.commit()
    return {"message": "Kurs qoralamaga o'tkazildi", "status": course.status}


@router.get("/courses/{course_id}")
def get_course_admin(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    course = _owned_course(db, course_id, user)
    return _course_admin_dict(course, db)


# ── MODULES ────────────────────────────────────────────────
@router.post("/courses/{course_id}/modules", status_code=201)
def create_module(
    course_id: int,
    data: ModuleIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    course = _owned_course(db, course_id, user)
    module = Module(course_id=course.id, title=data.title, order=data.order or 0)
    db.add(module)
    try:
        db.commit()
        db.refresh(module)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Saqlashda xatolik: {e}")
    return JSONResponse(
        status_code=201, content={"message": "Modul qo'shildi", "id": module.id}
    )


@router.patch("/modules/{module_id}")
def update_module(
    module_id: int,
    data: ModulePatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Modul topilmadi")
    _owned_course(db, module.course_id, user)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(module, field, value)
    db.commit()
    return {"message": "Modul yangilandi", "id": module.id}


@router.delete("/modules/{module_id}")
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Modul topilmadi")
    _owned_course(db, module.course_id, user)
    db.delete(module)
    db.commit()
    return {"message": "Modul o'chirildi", "id": module_id}


# ── LESSONS ───────────────────────────────────────────────
@router.post("/courses/{course_id}/lessons", status_code=201)
def create_lesson(
    course_id: int,
    data: LessonIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    course = _owned_course(db, course_id, user)

    # module_id berilgan bo'lsa — u shu kursga tegishli ekanini tekshiramiz
    if data.module_id is not None:
        module = (
            db.query(Module)
            .filter(Module.id == data.module_id, Module.course_id == course.id)
            .first()
        )
        if not module:
            raise HTTPException(status_code=400, detail="Modul bu kursga tegishli emas")

    lesson = Lesson(
        course_id=course.id,
        module_id=data.module_id,
        title=data.title,
        video_url=data.video_url,
        order=data.order or 0,
        duration_seconds=data.duration_seconds or 0,
        description=data.description,
        content=data.content,
        is_free_preview=bool(data.is_free_preview),
        type=data.type or "video",
        resources=data.resources or [],
    )
    db.add(lesson)
    try:
        db.commit()
        db.refresh(lesson)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Saqlashda xatolik: {e}")
    return JSONResponse(
        status_code=201, content={"message": "Dars qo'shildi", "id": lesson.id}
    )


@router.patch("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: int,
    data: LessonPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    course = _owned_course(db, lesson.course_id, user)

    fields = data.model_dump(exclude_unset=True)
    if "module_id" in fields and fields["module_id"] is not None:
        module = (
            db.query(Module)
            .filter(Module.id == fields["module_id"], Module.course_id == course.id)
            .first()
        )
        if not module:
            raise HTTPException(status_code=400, detail="Modul bu kursga tegishli emas")
    for field, value in fields.items():
        setattr(lesson, field, value)
    db.commit()
    return {"message": "Dars yangilandi", "id": lesson.id}


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    _owned_course(db, lesson.course_id, user)
    db.delete(lesson)
    db.commit()
    return {"message": "Dars o'chirildi", "id": lesson_id}
