"""Rol asosidagi frontend yo'llari.

DIQQAT: bu fayldagi har bir yo'l `frontend/src/App.jsx` ichidagi haqiqiy
<Route path="..."> bilan mos bo'lishi shart. Mos bo'lmasa login/register
javobidagi `redirect` foydalanuvchini mavjud bo'lmagan yo'lga yuboradi va u
NotFoundPage'ga tushib qoladi. `tests/test_routes_utils.py` shuni tekshiradi.
"""

ADMIN_ROLES = {"admin", "superadmin"}
INSTRUCTOR_ROLES = {"instructor"}

STUDENT_DASHBOARD_PATH = "/kurslarim"
INSTRUCTOR_DASHBOARD_PATH = "/instruktor-panel"
ADMIN_DASHBOARD_PATH = "/admin"
SUPERADMIN_DASHBOARD_PATH = "/superadmin"
PROFILE_PATH = "/profil"


def normalize_role(role: str | None) -> str:
    return (role or "user").strip().lower() or "user"


def is_admin_role(role: str | None) -> bool:
    return normalize_role(role) in ADMIN_ROLES


def dashboard_path_for_role(role: str | None) -> str:
    normalized = normalize_role(role)
    if normalized == "superadmin":
        return SUPERADMIN_DASHBOARD_PATH
    if normalized == "admin":
        return ADMIN_DASHBOARD_PATH
    if normalized in INSTRUCTOR_ROLES:
        return INSTRUCTOR_DASHBOARD_PATH
    return STUDENT_DASHBOARD_PATH


def profile_path_for_role(role: str | None) -> str:
    """Frontend'da yagona profil sahifasi bor, shu sabab rol farq qilmaydi."""
    return PROFILE_PATH
