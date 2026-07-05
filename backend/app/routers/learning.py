"""
Learning Router — o'quv tajribasi yadrosi (BOSQICH 1).

Prefix: /api/learning

Vazifalar:
- Kursga yozilish / chiqish (Enrollment)
- "Mening kurslarim" ro'yxati
- O'quv (player) sahifasi uchun to'liq syllabus + progress
- Darsni tugatgan/tugatmagan deb belgilash + kurs foizini qayta hisoblash
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.module import Module
from app.models.progress import Progress
from app.models.user import User

router = APIRouter(prefix="/api/learning", tags=["Learning"])


def _now():
    return datetime.now(UTC)


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _get_active_course(db: Session, course_id: int) -> Course:
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    return course


def _recompute_course_progress(db: Session, user: User, course: Course) -> int:
    """Kursning tugallanish foizini qayta hisoblab, Enrollment + Progress'ni yangilaydi.

    Foiz = tugatilgan darslar / jami darslar * 100.
    """
    total = db.query(Lesson).filter(Lesson.course_id == course.id).count()
    if total == 0:
        percent = 0
    else:
        completed = (
            db.query(LessonProgress)
            .filter(
                LessonProgress.user_id == user.id,
                LessonProgress.course_id == course.id,
                LessonProgress.is_completed == True,  # noqa: E712
            )
            .count()
        )
        percent = int(round(completed / total * 100))

    # Enrollment yangilash
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
        .first()
    )
    if enrollment:
        enrollment.progress_percent = percent
        if percent >= 100 and enrollment.completed_at is None:
            enrollment.completed_at = _now()
        elif percent < 100:
            enrollment.completed_at = None

    # Legacy Progress jadvalini ham sinxronlaymiz (profil statistikasi shundan o'qiydi)
    progress = (
        db.query(Progress)
        .filter(Progress.user_id == user.id, Progress.course_id == course.id)
        .first()
    )
    if not progress:
        progress = Progress(
            user_id=user.id, course_id=course.id, percent=0, minutes_spent=0
        )
        db.add(progress)
    progress.percent = percent
    progress.last_activity = _now()

    return percent


# ==================================================================
# POST /api/learning/enroll/{course_id}
# ==================================================================
@router.post("/enroll/{course_id}", status_code=201)
def enroll(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    course = _get_active_course(db, course_id)

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
        .first()
    )
    if existing:
        return JSONResponse(
            status_code=200,
            content={
                "message": "Siz allaqachon ushbu kursga yozilgansiz",
                "enrolled": True,
                "progress_percent": existing.progress_percent,
            },
        )

    enrollment = Enrollment(user_id=user.id, course_id=course.id, progress_percent=0)
    db.add(enrollment)

    # students_count ni oshiramiz
    course.students_count = (course.students_count or 0) + 1

    # Legacy Progress yozuvi (dashboard uchun)
    if (
        not db.query(Progress)
        .filter(Progress.user_id == user.id, Progress.course_id == course.id)
        .first()
    ):
        db.add(
            Progress(user_id=user.id, course_id=course.id, percent=0, minutes_spent=0)
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Yozilishda xatolik")

    return JSONResponse(
        status_code=201,
        content={
            "message": "Kursga muvaffaqiyatli yozildingiz",
            "enrolled": True,
            "progress_percent": 0,
        },
    )


# ==================================================================
# DELETE /api/learning/enroll/{course_id}
# ==================================================================
@router.delete("/enroll/{course_id}")
def unenroll(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Siz bu kursga yozilmagansiz")

    db.delete(enrollment)
    course = db.query(Course).filter(Course.id == course_id).first()
    if course and (course.students_count or 0) > 0:
        course.students_count -= 1

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Chiqishda xatolik")

    return {"message": "Kursdan chiqdingiz", "enrolled": False}


# ==================================================================
# GET /api/learning/my-courses
# ==================================================================
@router.get("/my-courses")
def my_courses(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    rows = (
        db.query(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(Enrollment.user_id == user.id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
    result = []
    for enrollment, course in rows:
        result.append(
            {
                "course_id": course.id,
                "title": course.title,
                "subtitle": course.subtitle,
                "category": course.category,
                "thumbnail_url": course.thumbnail_url,
                "level": course.level,
                "progress_percent": enrollment.progress_percent or 0,
                "is_completed": (enrollment.progress_percent or 0) >= 100,
                "enrolled_at": (
                    enrollment.enrolled_at.isoformat()
                    if enrollment.enrolled_at
                    else None
                ),
                "completed_at": (
                    enrollment.completed_at.isoformat()
                    if enrollment.completed_at
                    else None
                ),
                "lessons_count": course.lessons.count(),
            }
        )
    return result


# ==================================================================
# GET /api/learning/courses/{course_id}
#   O'quv (player) sahifasi — to'liq syllabus + video URL'lar + progress.
#   Faqat yozilgan foydalanuvchilar uchun (bepul preview darslar istisno).
# ==================================================================
@router.get("/courses/{course_id}")
def learn_view(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    course = _get_active_course(db, course_id)

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
        .first()
    )
    is_enrolled = enrollment is not None

    # Tugatilgan dars ID'lari to'plami
    completed_ids = {
        lp.lesson_id
        for lp in db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == user.id,
            LessonProgress.course_id == course.id,
            LessonProgress.is_completed == True,  # noqa: E712
        )
        .all()
    }

    def _lesson_dict(lesson: Lesson) -> dict:
        # Yozilgan bo'lsa yoki bepul preview bo'lsa — to'liq kontent ochiladi
        unlocked = is_enrolled or bool(lesson.is_free_preview)
        return {
            "id": lesson.id,
            "title": lesson.title,
            "order": lesson.order or 0,
            "type": lesson.type or "video",
            "duration_seconds": lesson.duration_seconds or 0,
            "is_free_preview": bool(lesson.is_free_preview),
            "is_locked": not unlocked,
            "is_completed": lesson.id in completed_ids,
            "video_url": lesson.video_url if unlocked else None,
            "content": lesson.content if unlocked else None,
            "description": lesson.description,
            "resources": (lesson.resources or []) if unlocked else [],
        }

    modules = (
        db.query(Module)
        .filter(Module.course_id == course.id)
        .order_by(Module.order.asc(), Module.id.asc())
        .all()
    )
    syllabus = []
    for m in modules:
        lessons = (
            db.query(Lesson)
            .filter(Lesson.module_id == m.id)
            .order_by(Lesson.order.asc(), Lesson.id.asc())
            .all()
        )
        syllabus.append(
            {
                "id": m.id,
                "title": m.title,
                "order": m.order or 0,
                "lessons": [_lesson_dict(x) for x in lessons],
            }
        )
    orphan = (
        db.query(Lesson)
        .filter(Lesson.course_id == course.id, Lesson.module_id.is_(None))
        .order_by(Lesson.order.asc(), Lesson.id.asc())
        .all()
    )
    if orphan:
        syllabus.append(
            {
                "id": None,
                "title": "Umumiy",
                "order": 9999,
                "lessons": [_lesson_dict(x) for x in orphan],
            }
        )

    total_lessons = db.query(Lesson).filter(Lesson.course_id == course.id).count()

    return {
        "course_id": course.id,
        "title": course.title,
        "subtitle": course.subtitle,
        "is_enrolled": is_enrolled,
        "progress_percent": enrollment.progress_percent if enrollment else 0,
        "total_lessons": total_lessons,
        "completed_lessons": len(completed_ids),
        "modules": syllabus,
    }


# ==================================================================
# POST /api/learning/lessons/{lesson_id}/complete
# POST /api/learning/lessons/{lesson_id}/uncomplete
# ==================================================================
def _set_lesson_completion(
    lesson_id: int, completed: bool, email: str, db: Session
) -> dict:
    user = _get_user(db, email)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")

    course = _get_active_course(db, lesson.course_id)

    # Faqat yozilgan foydalanuvchi progressni belgilay oladi
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Avval kursga yozilishingiz kerak")

    lp = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == user.id,
            LessonProgress.lesson_id == lesson.id,
        )
        .first()
    )
    if not lp:
        lp = LessonProgress(
            user_id=user.id,
            lesson_id=lesson.id,
            course_id=course.id,
            is_completed=False,
        )
        db.add(lp)

    lp.is_completed = completed
    lp.completed_at = _now() if completed else None
    lp.updated_at = _now()

    # autoflush o'chirilgan sessiyalarda ham qayta hisoblash to'g'ri ishlashi uchun
    # yangi/o'zgargan yozuvlarni bazaga yozib qo'yamiz.
    db.flush()

    percent = _recompute_course_progress(db, user, course)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Saqlashda xatolik")

    return {
        "lesson_id": lesson.id,
        "is_completed": completed,
        "progress_percent": percent,
    }


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _set_lesson_completion(lesson_id, True, email, db)


@router.post("/lessons/{lesson_id}/uncomplete")
def uncomplete_lesson(
    lesson_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _set_lesson_completion(lesson_id, False, email, db)
