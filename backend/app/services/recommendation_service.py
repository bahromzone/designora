"""Deterministic recommendation ranking helpers."""

from __future__ import annotations


def bestselling(courses: list[dict], *, limit: int = 6) -> list[dict]:
    return sorted(courses, key=lambda c: (c.get("students_count") or 0, c.get("rating_avg") or 0), reverse=True)[:limit]


def similar(courses: list[dict], *, category: str | None, exclude_ids: set[int], limit: int = 6) -> list[dict]:
    pool = [c for c in courses if c["id"] not in exclude_ids and (category is None or c.get("category") == category)]
    return sorted(pool, key=lambda c: (c.get("rating_avg") or 0, c.get("students_count") or 0), reverse=True)[:limit]


def personalized(courses: list[dict], *, interests: list[str], level: str | None, language: str | None, limit: int = 6) -> list[dict]:
    normalized = [item.casefold() for item in interests]

    def score(course):
        category = str(course.get("category") or "").casefold()
        title = str(course.get("title") or "").casefold()
        interest_score = sum(5 for item in normalized if item in category or item in title or category in item)
        level_score = 3 if level and course.get("level") == level else 0
        language_score = 2 if language and course.get("language") == language else 0
        return (interest_score + level_score + language_score, course.get("rating_avg") or 0, course.get("students_count") or 0)

    return sorted(courses, key=score, reverse=True)[:limit]
