from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.saved_course import SavedCourse
from app.models.user import User

router = APIRouter(prefix="/api/saved-courses", tags=["Saved courses"])


def _user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _item(row: SavedCourse) -> dict:
    course = row.course
    return {
        "id": row.id,
        "course_id": course.id,
        "title": course.title,
        "price": course.price,
        "description": course.description,
        "category": course.category,
        "thumbnail_url": course.thumbnail_url,
        "slug": course.slug,
        "level": course.level,
        "language": course.language,
        "rating_avg": course.rating_avg or 0,
        "students_count": course.students_count or 0,
        "saved_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.get("")
def list_saved_courses(
    email: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    user = _user(db, email)
    rows = (
        db.query(SavedCourse)
        .join(Course, SavedCourse.course_id == Course.id)
        .filter(SavedCourse.user_id == user.id, Course.is_active == True)  # noqa: E712
        .order_by(SavedCourse.created_at.desc(), SavedCourse.id.desc())
        .all()
    )
    return [_item(row) for row in rows]


@router.post("/{course_id}", status_code=status.HTTP_201_CREATED)
def save_course(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    row = (
        db.query(SavedCourse)
        .filter(
            SavedCourse.user_id == user.id, SavedCourse.course_id == course_id
        )
        .first()
    )
    if not row:
        row = SavedCourse(user_id=user.id, course_id=course_id)
        db.add(row)
        try:
            db.commit()
        except Exception:
            db.rollback()
            row = (
                db.query(SavedCourse)
                .filter(
                    SavedCourse.user_id == user.id,
                    SavedCourse.course_id == course_id,
                )
                .first()
            )
            if not row:
                raise
        if row:
            db.refresh(row)
    return _item(row)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_course(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    row = (
        db.query(SavedCourse)
        .filter(
            SavedCourse.user_id == user.id,
            SavedCourse.course_id == course_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Saqlangan kurs topilmadi")
    db.delete(row)
    db.commit()
