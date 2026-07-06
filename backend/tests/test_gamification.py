"""Gamifikatsiya daraja mantig'i birlik testlari (BOSQICH 3)."""

from types import SimpleNamespace

from app.services.gamification_service import POINTS_PER_LEVEL, recalc_level


def test_level_starts_at_one():
    u = SimpleNamespace(points=0, level=1)
    assert recalc_level(u) == 1


def test_level_progression():
    u = SimpleNamespace(points=250, level=1)
    # 250 // 100 + 1 = 3
    assert recalc_level(u) == 3
    assert u.level == 3


def test_level_boundary():
    u = SimpleNamespace(points=POINTS_PER_LEVEL, level=1)
    # 100 // 100 + 1 = 2
    assert recalc_level(u) == 2


def test_level_handles_none_points():
    u = SimpleNamespace(points=None, level=1)
    assert recalc_level(u) == 1
