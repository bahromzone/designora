"""Tavsiya (recommendation) mantiqi — sof funksiyalar, DB'siz (BOSQICH 4).

Har bir funksiya kurs 'dict'lari ro'yxatini oladi va tartiblangan qism ro'yxat
qaytaradi. Shu sabab DB'siz mustaqil unit-test qilinadi.
"""

from __future__ import annotations


def bestselling(courses: list[dict], *, limit: int = 6) -> list[dict]:
    """Eng ko'p talabaga (keyin reytingga) ega kurslar."""
    return sorted(
        courses,
        key=lambda c: (c.get("students_count") or 0, c.get("rating_avg") or 0),
        reverse=True,
    )[:limit]


def similar(
    courses: list[dict],
    *,
    category: str | None,
    exclude_ids: set[int],
    limit: int = 6,
) -> list[dict]:
    """Bir xil kategoriyadagi, reyting bo'yicha tartiblangan kurslar.

    category None bo'lsa — kategoriya bo'yicha filt르lanmaydi.
    """
    pool = [
        c
        for c in courses
        if c["id"] not in exclude_ids
        and (category is None or c.get("category") == category)
    ]
    return sorted(
        pool,
        key=lambda c: (c.get("rating_avg") or 0, c.get("students_count") or 0),
        reverse=True,
    )[:limit]
