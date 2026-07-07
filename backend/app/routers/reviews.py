"""Reviews Router — kurs sharhlari va reytinglari (BOSQICH 4).

Prefix: /api/reviews

Sharh qoldirish uchun kursga yozilgan bo'lish shart. Har bir foydalanuvchi
bitta kursga bitta sharh qoldiradi (qayta yuborilsa yangilanadi). Sharh
o'zgargach kursning rating_avg / rating_count qayta hisoblanadi.
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enrollment import Enrollment
from app.models.review import Review
from app.models.user import User
from app.services import review_service

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


def _now():
    return datetime.now(UTC)


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


class ReviewIn(BaseModel):
    rating: Annotated[int, Field(ge=1, le=5)]
    comment: str | None = None


def _review_dict(r: Review, author: str | None = None) -> dict:
    return {
        "id": r.id,
        "user_id": r.user_id,
        "author": author,
        "course_id": r.course_id,
        "rating": r.rating,
        "comment": r.comment,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


@router.get("/courses/{course_id}")
def list_reviews(course_id: int, db: Session = Depends(get_db)):
    """Kursning barcha sharhlari (ommaviy)."""
    rows = (
        db.query(Review)
        .filter(Review.course_id == course_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    out = []
    for r in rows:
        author = db.query(User).filter(User.id == r.user_id).first()
        out.append(_review_dict(r, author.name if author else None))
    return out


@router.get("/courses/{course_id}/summary")
def review_summary(course_id: int, db: Session = Depends(get_db)):
    """Reyting o'rtachasi, soni va yulduzlar taqsimoti (ommaviy)."""
    ratings = [
        r
        for (r,) in db.query(Review.rating).filter(Review.course_id == course_id).all()
    ]
    avg, count = review_service.compute_rating_aggregate(ratings)
    return {
        "course_id": course_id,
        "rating_avg": avg,
        "rating_count": count,
        "distribution": review_service.rating_distribution(ratings),
    }


@router.get("/courses/{course_id}/my")
def my_review(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    r = (
        db.query(Review)
        .filter(Review.user_id == user.id, Review.course_id == course_id)
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Sharh topilmadi")
    return _review_dict(r, user.name)


@router.post("/courses/{course_id}", status_code=201)
def upsert_review(
    course_id: int,
    data: ReviewIn,
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
        raise HTTPException(
            status_code=403, detail="Sharh qoldirish uchun kursga yozilishingiz kerak"
        )

    review = (
        db.query(Review)
        .filter(Review.user_id == user.id, Review.course_id == course_id)
        .first()
    )
    created = review is None
    if review is None:
        review = Review(user_id=user.id, course_id=course_id)
        db.add(review)

    review.rating = data.rating
    review.comment = data.comment
    review.updated_at = _now()
    db.flush()

    review_service.recompute_course_rating(db, course_id)
    db.commit()
    db.refresh(review)
    return _review_dict(review, user.name) | {"created": created}


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Sharh topilmadi")
    is_staff = user.role in {"admin", "superadmin"}
    if review.user_id != user.id and not is_staff:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    course_id = review.course_id
    db.delete(review)
    db.flush()
    review_service.recompute_course_rating(db, course_id)
    db.commit()
    return {"message": "Sharh o'chirildi", "id": review_id}
