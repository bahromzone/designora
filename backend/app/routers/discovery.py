"""Discovery Router — qidiruv, filtr va tavsiyalar (BOSQICH 4).

Prefix: /api/discovery

Faqat chop etilgan (is_active) kurslar ustida ishlaydi.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.Course import Course
from app.services import recommendation_service

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])

_SORTABLE = {
    "newest": (Course.id, True),
    "rating": (Course.rating_avg, True),
    "popular": (Course.students_count, True),
    "price_asc": (Course.price, False),
    "price_desc": (Course.price, True),
}


def _card(c: Course) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "slug": c.slug,
        "subtitle": c.subtitle,
        "price": c.price,
        "category": c.category,
        "level": c.level,
        "language": c.language,
        "thumbnail_url": c.thumbnail_url,
        "rating_avg": c.rating_avg or 0,
        "rating_count": c.rating_count or 0,
        "students_count": c.students_count or 0,
        "duration_minutes": c.duration_minutes or 0,
    }


def _active_cards(db: Session) -> list[dict]:
    courses = db.query(Course).filter(Course.is_active == True).all()  # noqa: E712
    return [_card(c) for c in courses]


@router.get("/search")
def search(
    q: str | None = None,
    category: str | None = None,
    level: str | None = None,
    language: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    min_rating: float | None = None,
    sort: str = "newest",
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Course).filter(Course.is_active == True)  # noqa: E712

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Course.title.ilike(like),
                Course.subtitle.ilike(like),
                Course.description.ilike(like),
            )
        )
    if category:
        query = query.filter(Course.category == category.lower())
    if level:
        query = query.filter(Course.level == level)
    if language:
        query = query.filter(Course.language == language)
    if min_price is not None:
        query = query.filter(Course.price >= min_price)
    if max_price is not None:
        query = query.filter(Course.price <= max_price)
    if min_rating is not None:
        query = query.filter(Course.rating_avg >= min_rating)

    column, desc = _SORTABLE.get(sort, _SORTABLE["newest"])
    query = query.order_by(column.desc() if desc else column.asc())

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "results": [_card(c) for c in items],
    }


@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    """Kategoriyalar va ularga tegishli kurslar soni."""
    rows = db.query(Course.category).filter(Course.is_active == True).all()  # noqa: E712
    counts: dict[str, int] = {}
    for (cat,) in rows:
        if not cat:
            continue
        counts[cat] = counts.get(cat, 0) + 1
    return [
        {"category": cat, "count": n}
        for cat, n in sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    ]


@router.get("/recommendations/bestselling")
def bestselling(
    limit: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
):
    return recommendation_service.bestselling(_active_cards(db), limit=limit)


@router.get("/recommendations/similar/{course_id}")
def similar(
    course_id: int,
    limit: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    category = course.category if course else None
    return recommendation_service.similar(
        _active_cards(db),
        category=category,
        exclude_ids={course_id},
        limit=limit,
    )
