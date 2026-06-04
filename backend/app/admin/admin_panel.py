from sqladmin import Admin
from app.core.database import engine
from app.admin.authentication import AdminAuth
from app.admin.views import UserAdmin, StudentAdmin, AdminUserAdmin, CourseAdmin
from app.core.config import settings


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