# Barcha modellar shu yerda import qilinishi shart.
# SQLAlchemy relationship larni to'g'ri resolve qilishi uchun.

from .assignment import Assignment
from .assignment_submission import AssignmentSubmission
from .certificate import Certificate
from .Course import Course
from .enrollment import Enrollment
from .lesson import Lesson
from .lesson_progress import LessonProgress
from .module import Module
from .notification import Notification
from .password_reset import PasswordReset
from .payment import Payment
from .portfolio_project import PortfolioProject
from .progress import Progress
from .user import User

__all__ = [
    "Assignment",
    "AssignmentSubmission",
    "Certificate",
    "Course",
    "Enrollment",
    "Lesson",
    "LessonProgress",
    "Module",
    "Notification",
    "PasswordReset",
    "Payment",
    "PortfolioProject",
    "Progress",
    "User",
]
