# Barcha modellar shu yerda import qilinishi shart —
# SQLAlchemy relationship larni to'g'ri resolve qilishi uchun.

from .assignment import Assignment
from .assignment_submission import AssignmentSubmission
from .badge import Badge, UserBadge
from .certificate import Certificate
from .coupon import Coupon
from .Course import Course
from .enrollment import Enrollment
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
from .user import User
