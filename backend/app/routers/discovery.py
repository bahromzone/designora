"""Discovery: course catalogue, cross-platform search and recommendations."""

from difflib import SequenceMatcher

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.Course import Course
from app.models.blog import BlogPost
from app.models.forum import ForumThread
from app.models.lesson import Lesson
from app.models.user import User
from app.services import recommendation_service

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])

_SORTABLE = {
    "newest": (Course.id, True),
    "rating": (Course.rating_avg, True),
    "popular": (Course.students_count, True),
    "price_asc": (Course.price, False),
    "price_desc": (Course.price, True),
}
_SEARCH_TYPES = {"course", "lesson", "instructor", "blog", "forum"}


def _card(course: Course) -> dict:
    return {
        "id": course.id,
        "title": course.title,
        "slug": course.slug,
        "subtitle": course.subtitle,
        "price": course.price,
        "category": course.category,
        "level": course.level,
        "language": course.language,
        "thumbnail_url": course.thumbnail_url,
        "rating_avg": course.rating_avg or 0,
        "rating_count": course.rating_count or 0,
        "students_count": course.students_count or 0,
        "duration_minutes": course.duration_minutes or 0,
    }


def _active_cards(db: Session) -> list[dict]:
    courses = db.query(Course).filter(Course.is_active == True).all()
    return [_card(course) for course in courses]


def _score(needle: str, *values: str | None) -> float:
    query = needle.casefold().strip()
    haystack = " ".join(value or "" for value in values).casefold()
    if not query or not haystack:
        return 0
    if query in haystack:
        return 1.0 - min(haystack.find(query), 100) / 1000
    words = haystack.split()
    return max([SequenceMatcher(None, query, word).ratio() for word in words] + [0])


def _rank(needle: str, rows: list[dict], limit: int) -> list[dict]:
    scored = []
    for row in rows:
        relevance = _score(
            needle,
            row.get("title"),
            row.get("subtitle"),
            row.get("description"),
            row.get("meta"),
        )
        if relevance >= 0.56:
            scored.append({**row, "relevance": round(relevance, 3)})
    return sorted(scored, key=lambda row: row["relevance"], reverse=True)[:limit]


def _requested_types(types: str | None) -> set[str]:
    if not types:
        return set(_SEARCH_TYPES)
    return {
        value.strip()
        for value in types.split(",")
        if value.strip() in _SEARCH_TYPES
    }


@router.get("/global-search")
def global_search(
    q: str = Query(min_length=2, max_length=100),
    types: str | None = None,
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Search public courses, lessons, instructors, posts and discussions."""
    requested = _requested_types(types)
    groups: dict[str, list[dict]] = {name: [] for name in requested}

    if "course" in requested:
        rows = db.query(Course).filter(Course.is_active == True).limit(300).all()
        groups["course"] = _rank(
            q,
            [
                {
                    "type": "course",
                    "id": row.id,
                    "title": row.title,
                    "subtitle": row.subtitle,
                    "description": row.description,
                    "meta": " · ".join(
                        filter(None, [row.category, row.level, row.language])
                    ),
                    "image_url": row.thumbnail_url,
                    "url": f"/kurslar/{row.id}",
                }
                for row in rows
            ],
            limit,
        )

    if "lesson" in requested:
        rows = (
            db.query(Lesson, Course)
            .join(Course, Lesson.course_id == Course.id)
            .filter(Course.is_active == True)
            .limit(500)
            .all()
        )
        groups["lesson"] = _rank(
            q,
            [
                {
                    "type": "lesson",
                    "id": lesson.id,
                    "title": lesson.title,
                    "subtitle": course.title,
                    "description": lesson.description,
                    "meta": lesson.type or "Dars",
                    "image_url": course.thumbnail_url,
                    "url": f"/organish/{course.id}?lesson={lesson.id}",
                }
                for lesson, course in rows
            ],
            limit,
        )

    if "instructor" in requested:
        rows = (
            db.query(User)
            .filter(
                User.is_active == True,
                User.role.in_(["instructor", "admin", "superadmin"]),
            )
            .limit(200)
            .all()
        )
        groups["instructor"] = _rank(
            q,
            [
                {
                    "type": "instructor",
                    "id": row.id,
                    "title": row.name or "Designora instruktor",
                    "subtitle": row.bio,
                    "description": row.bio,
                    "meta": row.location or "Instruktor",
                    "image_url": row.avatar_url,
                    "url": f"/instruktor/{row.id}",
                }
                for row in rows
            ],
            limit,
        )

    if "blog" in requested:
        rows = (
            db.query(BlogPost)
            .filter(BlogPost.is_published == True)
            .order_by(BlogPost.published_at.desc())
            .limit(300)
            .all()
        )
        groups["blog"] = _rank(
            q,
            [
                {
                    "type": "blog",
                    "id": row.id,
                    "title": row.title,
                    "subtitle": row.excerpt,
                    "description": row.excerpt or row.meta_description,
                    "meta": row.tags or "Maqola",
                    "image_url": row.cover_image_url,
                    "url": f"/blog/{row.slug}",
                }
                for row in rows
            ],
            limit,
        )

    if "forum" in requested:
        rows = (
            db.query(ForumThread)
            .order_by(ForumThread.updated_at.desc())
            .limit(500)
            .all()
        )
        groups["forum"] = _rank(
            q,
            [
                {
                    "type": "forum",
                    "id": row.id,
                    "title": row.title,
                    "subtitle": (row.body or "")[:180],
                    "description": (row.body or "")[:300],
                    "meta": f"{row.category or 'Forum'} · {row.views or 0} ko‘rish",
                    "image_url": None,
                    "url": f"/forum/{row.id}",
                }
                for row in rows
            ],
            limit,
        )

    total = sum(len(items) for items in groups.values())
    return {
        "query": q,
        "total": total,
        "groups": groups,
        "suggestion": None if total else "Kengroq yoki boshqa kalit so‘z kiriting",
    }


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
    query = db.query(Course).filter(Course.is_active == True)
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

    column, descending = _SORTABLE.get(sort, _SORTABLE["newest"])
    query = query.order_by(column.desc() if descending else column.asc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "results": [_card(course) for course in items],
    }


@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    rows = db.query(Course.category).filter(Course.is_active == True).all()
    counts: dict[str, int] = {}
    for (category,) in rows:
        if category:
            counts[category] = counts.get(category, 0) + 1
    return [
        {"category": category, "count": count}
        for category, count in sorted(
            counts.items(), key=lambda item: item[1], reverse=True
        )
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
    return recommendation_service.similar(
        _active_cards(db),
        category=course.category if course else None,
        exclude_ids={course_id},
        limit=limit,
    )
