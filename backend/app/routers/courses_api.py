# backend/app/routers/courses_api.py
# YANGI FAYL — public JSON kurslar endpointi.
# React'dagi CoursesPage hozir JSON kutadi, lekin backendda GET /courses
# HTML sahifa qaytaradi. Bu router shu bo'shliqni yopadi.
#
# Ulash uchun app/main.py ga qo'shing:
#   from app.routers import courses_api
#   app.include_router(courses_api.router)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.Course import Course

router = APIRouter(prefix="/api/courses", tags=["Courses"])


@router.get("")
def list_courses(db: Session = Depends(get_db)):
    courses = (
        db.query(Course)
        .filter(Course.is_active == True)  # noqa: E712
        .order_by(Course.id.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title,
            "price": c.price,
            "description": c.description,
            "category": c.category,
            "thumbnail_url": c.thumbnail_url,
        }
        for c in courses
    ]
