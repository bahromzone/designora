ADMIN_ROLES = {"admin", "superadmin"}


def normalize_role(role: str | None) -> str:
    return (role or "user").strip().lower() or "user"


def is_admin_role(role: str | None) -> bool:
    return normalize_role(role) in ADMIN_ROLES


def dashboard_path_for_role(role: str | None) -> str:
    normalized = normalize_role(role)
    if normalized == "superadmin":
        return "/superadmin"
    if normalized == "admin":
        return "/admin"
    return "/dashboard"


def profile_path_for_role(role: str | None) -> str:
    return "/admin/profile" if is_admin_role(role) else "/user/profile"
