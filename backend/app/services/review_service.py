"""Sharh / reyting agregatsiyasi (BOSQICH 4).

`compute_rating_aggregate` — sof funksiya (DB'siz, unit-test qilinadi).
`recompute_course_rating` — DB'dan o'qib Course.rating_avg/count'ni yangilaydi.
"""

from __future__ import annotations

from sqlalchemy.orm import Session


def compute_rating_aggregate(ratings: list[int]) -> tuple[float, int]:
    """Reytinglar ro'yxatidan (avg, count) qaytaradi.

    avg bitta kasrgacha yaxlitlanadi; ro'yxat bo'sh bo'lsa (0.0, 0).
    """
    clean = [r for r in ratings if r is not None]
    count = len(clean)
    if count == 0:
        return 0.0, 0
    avg = round(sum(clean) / count, 1)
    return avg, count


def rating_distribution(ratings: list[int]) -> dict[int, int]:
    """1..5 yulduzlar bo'yicha nechtadan berilganini qaytaradi."""
    dist = {star: 0 for star in range(1, 6)}
    for r in ratings:
        if r in dist:
            dist[r] += 1
    return dist


def recompute_course_rating(db: Session, course_id: int) -> tuple[float, int]:
    """Kursning barcha sharhlaridan reytingni qayta hisoblab yozadi.

    Commit chaqiruvchi zimmasida.
    """
    from app.models.Course import Course
    from app.models.review import Review

    ratings = [
        r
        for (r,) in db.query(Review.rating)
        .filter(Review.course_id == course_id)
        .all()
    ]
    avg, count = compute_rating_aggregate(ratings)
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        course.rating_avg = avg
        course.rating_count = count
        db.add(course)
        db.flush()
    return avg, count
