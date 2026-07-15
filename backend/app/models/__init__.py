# Barcha modellar shu yerda import qilinishi shart —
# SQLAlchemy relationship larni to'g'ri resolve qilishi uchun.

from .assignment import Assignment
from .assignment_submission import AssignmentSubmission
from .badge import Badge, UserBadge
from .blog import BlogPost
from .certificate import Certificate
from .coupon import Coupon
from .Course import Course
from .enrollment import Enrollment
from .forum import ForumPost, ForumThread
from .lesson import Lesson
from .lesson_progress import LessonProgress
from .module import Module
from .note import LessonNote
from .notification import Notification
from .order import Order
from .password_reset import PasswordReset
from .payment import Payment
from .progress import Progress
from .qa import LessonAnswer, LessonQuestion
from .quiz import Quiz, QuizAttempt, QuizQuestion
from .referral import Referral
from .refresh_token import RefreshToken
from .review import Review
from .user import User

__all__ = [
    "Assignment",
    "AssignmentSubmission",
    "Badge",
    "UserBadge",
    "BlogPost",
    "Certificate",
    "Coupon",
    "Course",
    "Enrollment",
    "ForumPost",
    "ForumThread",
    "Lesson",
    "LessonProgress",
    "Module",
    "LessonNote",
    "Notification",
    "Order",
    "PasswordReset",
    "Payment",
    "Progress",
    "LessonAnswer",
    "LessonQuestion",
    "Quiz",
    "QuizAttempt",
    "QuizQuestion",
    "Referral",
    "RefreshToken",
    "Review",
    "User",
]

try:
    from .course_version import CourseVersion
except ImportError:
    CourseVersion = None
else:
    __all__.append("CourseVersion")

try:
    from .monetization import (
        CourseBundle,
        FinancialAidApplication,
        Subscription,
        SubscriptionPlan,
        TeamLicense,
        TeamLicenseMember,
    )
except ImportError:
    CourseBundle = None
    FinancialAidApplication = None
    Subscription = None
    SubscriptionPlan = None
    TeamLicense = None
    TeamLicenseMember = None
else:
    __all__.extend(
        [
            "CourseBundle",
            "FinancialAidApplication",
            "Subscription",
            "SubscriptionPlan",
            "TeamLicense",
            "TeamLicenseMember",
        ]
    )

try:
    from .offline_sync import OfflineMutation
except ImportError:
    OfflineMutation = None
else:
    __all__.append("OfflineMutation")
