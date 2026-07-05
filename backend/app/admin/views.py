"""
SQLAdmin Views
- UserAdmin      : barcha foydalanuvchilar
- StudentAdmin   : faqat role="user" bo'lganlar
- AdminUserAdmin : faqat role="admin" bo'lganlar
- CourseAdmin    : kurslar
"""

import secrets

from sqladmin import ModelView

from app.models.Course import Course
from app.models.user import User


# ===== BASE: parol yaratish yordamchi =====
class _PasswordMixin:
    """
    Yangi foydalanuvchi admin orqali yaratilganda
    tasodifiy xavfsiz parol o'rnatiladi.
    (Foydalanuvchi keyinchalik parolni o'zgartirishi kerak.)
    """

    async def on_model_change(self, data, model, is_created, request):
        if is_created and not data.get("password"):
            from core.password import hash_password

            data["password"] = hash_password(secrets.token_urlsafe(16))


# ===== USER ADMIN (hammasi) =====
class UserAdmin(_PasswordMixin, ModelView, model=User):
    column_list = [
        User.id,
        User.email,
        User.name,
        User.role,
        User.is_active,
        User.created_at,
    ]
    column_searchable_list = [User.email, User.name]
    column_sortable_list = [User.id, User.email, User.created_at]
    column_filters = ["role", "is_active"]
    column_details_list = [
        User.id,
        User.email,
        User.name,
        User.role,
        User.is_admin,
        User.is_active,
        User.created_at,
    ]
    form_excluded_columns = [User.password]  # parol admin formida ko'rsatilmaydi

    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-user"

    page_size = 50
    page_size_options = [25, 50, 100, 200]

    can_create = True
    can_edit = True
    can_delete = False  # soft delete tavsiya etiladi
    can_view_details = True
    can_export = True


# ===== STUDENT ADMIN (faqat role="user") =====
class StudentAdmin(_PasswordMixin, ModelView, model=User):

    # ✅ BUG #4 FIX: SQLAdmin 0.14+ da get_query(self, request) signature talab qilinadi.
    # Avvalgi get_query(self) → TypeError berardi va Students ro'yxati ochilmasdi.
    async def get_query(self, request):
        stmt = await super().get_query(request)
        return stmt.where(User.role == "user")

    async def get_count_query(self, request):
        stmt = await super().get_count_query(request)
        return stmt.where(User.role == "user")

    column_list = [User.id, User.email, User.name, User.is_active, User.created_at]
    column_searchable_list = [User.email, User.name]
    column_sortable_list = [User.id, User.email, User.created_at]
    form_excluded_columns = [User.password]

    name = "Student"
    name_plural = "Students"
    icon = "fa-solid fa-graduation-cap"

    can_create = True
    can_edit = True
    can_delete = False
    can_view_details = True
    can_export = True


# ===== ADMIN USER ADMIN (faqat role="admin") =====
class AdminUserAdmin(_PasswordMixin, ModelView, model=User):

    # ✅ BUG #4 FIX: xuddi StudentAdmin kabi — request parametri qo'shildi
    async def get_query(self, request):
        stmt = await super().get_query(request)
        return stmt.where(User.role == "admin")

    async def get_count_query(self, request):
        stmt = await super().get_count_query(request)
        return stmt.where(User.role == "admin")

    column_list = [User.id, User.email, User.name, User.is_active, User.created_at]
    column_searchable_list = [User.email, User.name]
    column_sortable_list = [User.id, User.email]
    form_excluded_columns = [User.password]

    name = "Admin user"
    name_plural = "Admin users"
    icon = "fa-solid fa-user-shield"

    can_create = True
    can_edit = True
    can_delete = False
    can_view_details = True
    can_export = True


# ===== COURSE ADMIN =====
class CourseAdmin(ModelView, model=Course):
    column_list = [
        Course.id,
        Course.title,
        Course.price,
        Course.category,
        Course.is_active,
    ]
    column_searchable_list = [Course.title, Course.category]
    column_sortable_list = [Course.id, Course.title, Course.price]
    column_filters = ["category", "is_active"]
    column_details_list = [
        Course.id,
        Course.title,
        Course.description,
        Course.price,
        Course.category,
        Course.is_active,
    ]

    name = "Course"
    name_plural = "Courses"
    icon = "fa-solid fa-book"

    page_size = 25
    page_size_options = [25, 50, 100]

    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True
    can_export = True
