"""Barcha SQLAlchemy modellarini ro'yxatga oladi.

MUHIM: bu paket import qilinganda `Base.metadata` TO'LIQ bo'lishi shart.
`scripts/prepare_migrations.py` yangi bazada sxemani shu metadata'dan quradi
va keyin Alembic head'ni stamp qiladi. Biror model moduli import qilinmagan
bo'lsa, uning jadvali yangi bazada UMUMAN yaratilmaydi va migratsiyalar ham
uni qaytarib bermaydi (baza allaqachon "head" deb belgilangan bo'ladi).

Yangi model qo'shsangiz, uni shu yerga ham qo'shing. Unutilsa,
`tests/test_models_registry.py` CI'da yiqiladi.
"""

# ── Faqat metadata to'liq bo'lishi uchun import qilinadigan modullar ────────
from . import (
    analytics_event,
    assignment_submission,
    audit_log,
    badge,
    blog,
    calendar_event,
    coupon,
    forum,
    instructor_application,
    learning_path,
    moderation_report,
    note,
    order,
    portfolio_project,
    qa,
    quiz,
    referral,
    refresh_token,
    reminder_preference,
    review,
)

# ── Nom bo'yicha re-eksportlar (`from app.models import User` uchun) ────────
from .assignment import Assignment
from .certificate import Certificate
from .Course import Course
from .course_version import CourseVersion
from .enrollment import Enrollment
from .lesson import Lesson
from .lesson_progress import LessonProgress
from .module import Module
from .monetization import (
    CourseBundle,
    FinancialAidApplication,
    Subscription,
    SubscriptionPlan,
    TeamLicense,
    TeamLicenseMember,
)
from .notification import Notification
from .password_reset import PasswordReset
from .payment import Payment
from .progress import Progress
from .user import User
