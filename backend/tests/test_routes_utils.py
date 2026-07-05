"""Rol asosidagi marshrut (routing) yordamchilari testlari."""

import pytest

from app.utils.routes import (
    dashboard_path_for_role,
    is_admin_role,
    normalize_role,
    profile_path_for_role,
)


@pytest.mark.parametrize(
    "raw,expected",
    [
        (None, "user"),
        ("", "user"),
        ("  ", "user"),
        ("ADMIN", "admin"),
        ("  SuperAdmin ", "superadmin"),
        ("User", "user"),
    ],
)
def test_normalize_role(raw, expected):
    assert normalize_role(raw) == expected


@pytest.mark.parametrize(
    "role,expected",
    [
        ("admin", True),
        ("superadmin", True),
        ("ADMIN", True),
        ("user", False),
        (None, False),
        ("teacher", False),
    ],
)
def test_is_admin_role(role, expected):
    assert is_admin_role(role) is expected


def test_dashboard_path_for_admin():
    assert dashboard_path_for_role("admin") == "/manage/courses"
    assert dashboard_path_for_role("superadmin") == "/manage/courses"


def test_dashboard_path_for_user():
    assert dashboard_path_for_role("user") == "/dashboard"
    assert dashboard_path_for_role(None) == "/dashboard"


def test_profile_path_for_role():
    assert profile_path_for_role("admin") == "/admin/profile"
    assert profile_path_for_role("user") == "/user/profile"
