"""Sharh/reyting agregatsiyasi birlik testlari (BOSQICH 4) — DB'siz."""

from app.services.review_service import (
    compute_rating_aggregate,
    rating_distribution,
)


def test_aggregate_empty():
    assert compute_rating_aggregate([]) == (0.0, 0)


def test_aggregate_basic():
    avg, count = compute_rating_aggregate([5, 4, 3])
    assert avg == 4.0
    assert count == 3


def test_aggregate_rounds_to_one_decimal():
    avg, count = compute_rating_aggregate([5, 4])
    assert avg == 4.5
    assert count == 2
    avg2, _ = compute_rating_aggregate([5, 4, 4])
    assert avg2 == 4.3  # 13/3 = 4.333 -> 4.3


def test_aggregate_ignores_none():
    assert compute_rating_aggregate([5, None, 5]) == (5.0, 2)


def test_distribution():
    dist = rating_distribution([5, 5, 3, 1, 1, 1])
    assert dist == {1: 3, 2: 0, 3: 1, 4: 0, 5: 2}
