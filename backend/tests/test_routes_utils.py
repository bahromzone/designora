"""Rol asosidagi marshrut (routing) yordamchilari testlari."""

from pathlib import Path

import pytest

from app.utils.routes import (
    dashboard_path_for_role,
    is_admin_role,
    normalize_role,
    profile_path_for_role,
)

APP_JSX = Path(__file__).resolve().parents[2] / "frontend" / "src" / "App.jsx"


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
    assert dashboard_path_for_role("admin") == "/admin"


def test_dashboard_path_for_superadmin():
    assert dashboard_path_for_role("superadmin") == "/superadmin"


def test_dashboard_path_for_instructor():
    assert dashboard_path_for_role("instructor") == "/instruktor-panel"


def test_dashboard_path_for_user():
    assert dashboard_path_for_role("user") == "/kurslarim"
    assert dashboard_path_for_role(None) == "/kurslarim"


def test_profile_path_for_role():
    assert profile_path_for_role("admin") == "/profil"
    assert profile_path_for_role("superadmin") == "/profil"
    assert profile_path_for_role("user") == "/profil"


@pytest.mark.parametrize(
    "role",
    [None, "user", "instructor", "admin", "superadmin"],
)
def test_dashboard_path_exists_in_frontend_router(role):
    """Redirect qilinadigan yo'l React Router'da haqiqatan mavjud bo'lsin.

    Bu test regressiyani ushlaydi: ilgari student uchun `/dashboard`
    qaytarilardi, App.jsx'da esa bunday route yo'q edi va login'dan keyin
    foydalanuvchi 404 sahifasiga tushardi.
    """
    if not APP_JSX.exists():
        pytest.skip("frontend/src/App.jsx topilmadi (backend-only muhit)")
    source = APP_JSX.read_text(encoding="utf-8")
    path = dashboard_path_for_role(role)
    assert f'path="{path}"' in source, f"{path} App.jsx'da mavjud emas"


def test_profile_path_exists_in_frontend_router():
    if not APP_JSX.exists():
        pytest.skip("frontend/src/App.jsx topilmadi (backend-only muhit)")
    source = APP_JSX.read_text(encoding="utf-8")
    path = profile_path_for_role("user")
    assert f'path="{path}"' in source, f"{path} App.jsx'da mavjud emas"
