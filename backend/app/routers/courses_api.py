# Public kurslar JSON API — React frontend uchun
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.Course import Course

router = APIRouter(prefix="/api/courses", tags=["Courses"])


def _course_to_dict(c: Course) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "price": c.price,
        "description": c.description,
        "category": c.category,
        "thumbnail_url": c.thumbnail_url,
    }


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
    from fastapi import HTTPException

    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    return _course_to_dict(course)
