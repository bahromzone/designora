"""Discovery API: course filters, recommendations and global search."""

from difflib import SequenceMatcher

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.blog import BlogPost
from app.models.Course import Course
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


def _course_card(course: Course) -> dict:
    return {
        "id": course.id,
        "type": "course",
        "title": course.title,
        "slug": course.slug,
        "subtitle": course.subtitle,
        "description": course.description,
        "price": course.price,
        "category": course.category,
        "level": course.level,
        "language": course.language,
        "thumbnail_url": course.thumbnail_url,
        "rating_avg": course.rating_avg or 0,
        "rating_count": course.rating_count or 0,
        "students_count": course.students_count or 0,
        "duration_minutes": course.duration_minutes or 0,
        "url": f"/kurslar/{course.id}",
    }


def _active_cards(db: Session) -> list[dict]:
    rows = db.query(Course).filter(Course.is_active == True).all()
    return [_course_card(course) for course in rows]


def _score(query: str, *values: str | None) -> float:
    query = query.casefold().strip()
    haystack = " ".join(value or "" for value in values).casefold()
    if not query:
        return 1.0
    if query in haystack:
        position_bonus = 0.2 if haystack.startswith(query) else 0
        return 1.0 + position_bonus
    words = haystack.split()
    return max(
        [SequenceMatcher(None, query, word).ratio() for word in words] + [0.0]
    )


def _excerpt(value: str | None, limit: int = 160) -> str | None:
    if not value:
        return None
    clean = " ".join(value.split())
    return clean if len(clean) <= limit else f"{clean[: limit - 1]}…"


@router.get("/global")
def global_search(
    q: str = Query("", max_length=120),
    types: str | None = None,
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Search all public learning content, with lightweight typo tolerance."""
    query = q.strip()
    requested = {
        value.strip()
        for value in (types or "course,lesson,instructor,blog,forum").split(",")
        if value.strip()
    }
    threshold = 0.58 if len(query) >= 4 else 0.72
    groups: dict[str, list[dict]] = {
        "course": [],
        "lesson": [],
        "instructor": [],
        "blog": [],
        "forum": [],
    }

    if "course" in requested:
        for course in db.query(Course).filter(Course.is_active == True).all():
            score = _score(query, course.title, course.subtitle, course.description, course.category)
            if not query or score >= threshold:
                item = _course_card(course)
                item["score"] = score
                groups["course"].append(item)

    if "lesson" in requested:
        rows = (
            db.query(Lesson, Course)
            .join(Course, Lesson.course_id == Course.id)
            .filter(Course.is_active == True)
            .all()
        )
        for lesson, course in rows:
            score = _score(query, lesson.title, lesson.description, course.title)
            if query and score >= threshold:
                groups["lesson"].append(
                    {
                        "id": lesson.id,
                        "type": "lesson",
                        "title": lesson.title,
                        "subtitle": course.title,
                        "description": _excerpt(lesson.description),
                        "course_id": course.id,
                        "duration_seconds": lesson.duration_seconds or 0,
                        "url": f"/kurslar/{course.id}",
                        "score": score,
                    }
                )

    if "instructor" in requested:
        rows = (
            db.query(User)
            .filter(User.is_active == True, User.role.in_(["instructor", "admin", "superadmin"]))
            .all()
        )
        for user in rows:
            score = _score(query, user.name, user.bio, user.location)
            if query and score >= threshold:
                groups["instructor"].append(
                    {
                        "id": user.id,
                        "type": "instructor",
                        "title": user.name or "Designora instruktor",
                        "subtitle": user.location or "Instruktor",
                        "description": _excerpt(user.bio),
                        "image_url": user.avatar_url,
                        "url": f"/instruktor/{user.id}",
                        "score": score,
                    }
                )

    if "blog" in requested:
        for post in db.query(BlogPost).filter(BlogPost.is_published == True).all():
            score = _score(query, post.title, post.excerpt, post.body, post.tags)
            if query and score >= threshold:
                groups["blog"].append(
                    {
                        "id": post.id,
                        "type": "blog",
                        "title": post.title,
                        "subtitle": "Blog",
                        "description": _excerpt(post.excerpt or post.body),
                        "image_url": post.cover_image_url,
                        "url": f"/blog/{post.slug}",
                        "score": score,
                    }
                )

    if "forum" in requested:
        for thread in db.query(ForumThread).all():
            score = _score(query, thread.title, thread.body, thread.category)
            if query and score >= threshold:
                groups["forum"].append(
                    {
                        "id": thread.id,
                        "type": "forum",
                        "title": thread.title,
                        "subtitle": thread.category or "Forum",
                        "description": _excerpt(thread.body),
                        "views": thread.views or 0,
                        "url": f"/forum/{thread.id}",
                        "score": score,
                    }
                )

    for key in groups:
        groups[key] = sorted(groups[key], key=lambda item: item["score"], reverse=True)[:limit]
        for item in groups[key]:
            item.pop("score", None)

    total = sum(len(items) for items in groups.values())
    suggestions = []
    if query and total == 0:
        candidates = [
            title
            for (title,) in db.query(Course.title).filter(Course.is_active == True).all()
            if SequenceMatcher(None, query.casefold(), title.casefold()).ratio() >= 0.35
        ]
        suggestions = candidates[:3]

    return {
        "query": query,
        "total": total,
        "groups": groups,
        "counts": {key: len(items) for key, items in groups.items()},
        "suggestions": suggestions,
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
        query = query.filter(or_(Course.title.ilike(like), Course.subtitle.ilike(like), Course.description.ilike(like)))
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
    return {"total": total, "page": page, "per_page": per_page, "pages": (total + per_page - 1) // per_page, "results": [_course_card(course) for course in items]}


@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    rows = db.query(Course.category).filter(Course.is_active == True).all()
    counts: dict[str, int] = {}
    for (category,) in rows:
        if category:
            counts[category] = counts.get(category, 0) + 1
    return [{"category": category, "count": count} for category, count in sorted(counts.items(), key=lambda pair: pair[1], reverse=True)]


@router.get("/recommendations/bestselling")
def bestselling(limit: int = Query(6, ge=1, le=24), db: Session = Depends(get_db)):
    return recommendation_service.bestselling(_active_cards(db), limit=limit)


@router.get("/recommendations/similar/{course_id}")
def similar(course_id: int, limit: int = Query(6, ge=1, le=24), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    return recommendation_service.similar(_active_cards(db), category=course.category if course else None, exclude_ids={course_id}, limit=limit)
