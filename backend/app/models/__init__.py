# Barcha modellar shu yerda import qilinishi shart —
# SQLAlchemy relationship larni to'g'ri resolve qilishi uchun.

from .analytics_event import AnalyticsEvent
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
    "AnalyticsEvent",
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
