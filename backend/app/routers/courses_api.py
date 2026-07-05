# Public kurslar JSON API — React frontend uchun
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.module import Module

router = APIRouter(prefix="/api/courses", tags=["Courses"])


def _course_to_dict(c: Course) -> dict:
    """Kurs kartasi uchun ixcham ko'rinish (katalog sahifasi)."""
    return {
        "id": c.id,
        "title": c.title,
        "price": c.price,
        "description": c.description,
        "category": c.category,
        "thumbnail_url": c.thumbnail_url,
        # ── BOSQICH 1: katalog kartasini boyitadigan maydonlar ───────────────
        "slug": c.slug,
        "subtitle": c.subtitle,
        "level": c.level,
        "language": c.language,
        "duration_minutes": c.duration_minutes or 0,
        "rating_avg": c.rating_avg or 0,
        "rating_count": c.rating_count or 0,
        "students_count": c.students_count or 0,
        "status": c.status,
        "lessons_count": c.lessons.count(),
    }


def _lesson_public_dict(lesson: Lesson) -> dict:
    """Ommaviy syllabus uchun dars — himoyalangan kontent yashiriladi.

    Faqat bepul preview darslarida video_url/content ko'rsatiladi.
    """
    is_free = bool(lesson.is_free_preview)
    return {
        "id": lesson.id,
        "title": lesson.title,
        "order": lesson.order or 0,
        "type": lesson.type or "video",
        "duration_seconds": lesson.duration_seconds or 0,
        "is_free_preview": is_free,
        # Himoyalangan: bepul bo'lmasa None
        "video_url": lesson.video_url if is_free else None,
        "description": lesson.description,
    }


def _syllabus(db: Session, course: Course) -> list[dict]:
    """Kursning modul → dars ierarxiyasini tartiblangan holda qaytaradi."""
    modules = (
        db.query(Module)
        .filter(Module.course_id == course.id)
        .order_by(Module.order.asc(), Module.id.asc())
        .all()
    )
    result = []
    for m in modules:
        lessons = (
            db.query(Lesson)
            .filter(Lesson.module_id == m.id)
            .order_by(Lesson.order.asc(), Lesson.id.asc())
            .all()
        )
        result.append(
            {
                "id": m.id,
                "title": m.title,
                "order": m.order or 0,
                "lessons": [_lesson_public_dict(x) for x in lessons],
            }
        )

    # Modulga tegishli bo'lmagan (yakka) darslar — "Umumiy" bo'limi
    orphan_lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == course.id, Lesson.module_id.is_(None))
        .order_by(Lesson.order.asc(), Lesson.id.asc())
        .all()
    )
    if orphan_lessons:
        result.append(
            {
                "id": None,
                "title": "Umumiy",
                "order": 9999,
                "lessons": [_lesson_public_dict(x) for x in orphan_lessons],
            }
        )
    return result


@router.get("")
def list_courses(db: Session = Depends(get_db)):
    courses = (
        db.query(Course)
        .filter(Course.is_active == True)  # noqa: E712
        .order_by(Course.id.desc())
        .all()
    )
    return [_course_to_dict(c) for c in courses]


@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    return _course_to_dict(course)


@router.get("/{course_id}/detail")
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    """To'liq kurs detali — syllabus (modullar + darslar) bilan.

    Ommaviy sahifa uchun: himoyalangan video URL'lar yashiriladi.
    """
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    data = _course_to_dict(course)
    data.update(
        {
            "learning_outcomes": course.learning_outcomes or [],
            "requirements": course.requirements or [],
            "preview_video_url": course.preview_video_url,
            "instructor_id": course.instructor_id,
            "modules": _syllabus(db, course),
        }
    )
    # Instruktor nomi (ixtiyoriy)
    if course.instructor_id:
        from app.models.user import User

        instructor = db.query(User).filter(User.id == course.instructor_id).first()
        data["instructor_name"] = instructor.name if instructor else None
    else:
        data["instructor_name"] = None

    return data
