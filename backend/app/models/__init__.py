# Barcha modellar shu yerda import qilinishi shart —
# SQLAlchemy relationship larni to'g'ri resolve qilishi uchun.

from .assignment import Assignment
from .badge import Badge, UserBadge
from .certificate import Certificate
from .Course import Course
from .enrollment import Enrollment
from .lesson import Lesson  # Course.lessons uchun shart
from .lesson_progress import LessonProgress
from .module import Module
from .note import LessonNote
from .notification import Notification
from .password_reset import PasswordReset
from .payment import Payment
from .progress import Progress
from .qa import LessonAnswer, LessonQuestion
from .quiz import Question, QuestionOption, Quiz
from .quiz_attempt import QuizAnswer, QuizAttempt
from .user import User

__all__ = [
    "Assignment",
    "Badge",
    "UserBadge",
    "Certificate",
    "Course",
    "Enrollment",
    "Lesson",
    "LessonProgress",
    "Module",
    "LessonNote",
    "Notification",
    "PasswordReset",
    "Payment",
    "Progress",
    "LessonAnswer",
    "LessonQuestion",
    "Question",
    "QuestionOption",
    "Quiz",
    "QuizAnswer",
    "QuizAttempt",
    "User",
]
