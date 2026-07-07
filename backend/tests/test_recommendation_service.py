"""Tavsiya (recommendation) mantiqi birlik testlari (BOSQICH 4) — DB'siz."""

from app.services.recommendation_service import bestselling, similar

_COURSES = [
    {"id": 1, "category": "fashion", "students_count": 100, "rating_avg": 4.5},
    {"id": 2, "category": "fashion", "students_count": 300, "rating_avg": 4.0},
    {"id": 3, "category": "textile", "students_count": 50, "rating_avg": 5.0},
    {"id": 4, "category": "fashion", "students_count": 10, "rating_avg": 3.0},
]


def test_bestselling_orders_by_students():
    top = bestselling(_COURSES, limit=2)
    assert [c["id"] for c in top] == [2, 1]


def test_bestselling_respects_limit():
    assert len(bestselling(_COURSES, limit=1)) == 1


def test_similar_filters_category_and_excludes_self():
    rec = similar(_COURSES, category="fashion", exclude_ids={1}, limit=10)
    ids = [c["id"] for c in rec]
    assert 1 not in ids
    assert set(ids) == {2, 4}
    # reyting bo'yicha tartib: 2 (4.0) > 4 (3.0)
    assert ids == [2, 4]


def test_similar_none_category_returns_all_except_excluded():
    rec = similar(_COURSES, category=None, exclude_ids={3}, limit=10)
    assert 3 not in [c["id"] for c in rec]
    assert len(rec) == 3
