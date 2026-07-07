"""Instructors Router — ommaviy instruktor profillari (BOSQICH 4).

Prefix: /api/instructors
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.Course import Course
from app.models.user import User

router = APIRouter(prefix="/api/instructors", tags=["Instructors"])

_INSTRUCTOR_ROLES = {"instructor", "admin", "superadmin"}


def _course_card(c: Course) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "slug": c.slug,
        "thumbnail_url": c.thumbnail_url,
        "price": c.price,
        "level": c.level,
        "rating_avg": c.rating_avg or 0,
        "rating_count": c.rating_count or 0,
        "students_count": c.students_count or 0,
    }


@router.get("/{instructor_id}")
def get_instructor(instructor_id: int, db: Session = Depends(get_db)):
    """Instruktorning ommaviy profili + statistikasi + chop etilgan kurslari."""
    user = db.query(User).filter(User.id == instructor_id).first()
    if not user or user.role not in _INSTRUCTOR_ROLES:
        raise HTTPException(status_code=404, detail="Instruktor topilmadi")

    courses = (
        db.query(Course)
        .filter(
            Course.instructor_id == user.id,
            Course.is_active == True,  # noqa: E712
        )
        .order_by(Course.students_count.desc())
        .all()
    )
    total_students = sum((c.students_count or 0) for c in courses)
    rated = [c for c in courses if (c.rating_count or 0) > 0]
    avg_rating = (
        round(sum(c.rating_avg or 0 for c in rated) / len(rated), 1) if rated else 0
    )
    return {
        "id": user.id,
        "name": user.name,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "website": user.website,
        "location": user.location,
        "courses_count": len(courses),
        "total_students": total_students,
        "avg_rating": avg_rating,
        "courses": [_course_card(c) for c in courses],
    }


@router.get("/{instructor_id}/courses")
def instructor_courses(instructor_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == instructor_id).first()
    if not user or user.role not in _INSTRUCTOR_ROLES:
        raise HTTPException(status_code=404, detail="Instruktor topilmadi")
    courses = (
        db.query(Course)
        .filter(
            Course.instructor_id == user.id,
            Course.is_active == True,  # noqa: E712
        )
        .order_by(Course.id.desc())
        .all()
    )
    return [_course_card(c) for c in courses]
