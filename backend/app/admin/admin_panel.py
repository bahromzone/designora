from sqladmin import Admin

from app.admin.authentication import AdminAuth
from app.admin.views import AdminUserAdmin, CourseAdmin, StudentAdmin, UserAdmin
from app.core.config import settings
from app.core.database import engine


def setup_admin(app) -> Admin:
    """
    SQLAdmin panelini sozlaydi va app ga biriktiradi.
    main.py da faqat setup_admin(app) chaqirilsin.
    """
    # ✅ BUG FIX: SessionMiddleware bilan bir xil secret key ishlatish kerak
    authentication_backend = AdminAuth(secret_key=settings.SESSION_SECRET_KEY)
    admin = Admin(
        app,
        engine,
        authentication_backend=authentication_backend,
        base_url="/admin",
    )

    admin.add_view(UserAdmin)
    admin.add_view(StudentAdmin)
    admin.add_view(AdminUserAdmin)
    admin.add_view(CourseAdmin)

    return admin
