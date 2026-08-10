"""Barcha SQLAlchemy modellarini ro'yxatga oladi."""

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
    saved_course,
)

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
