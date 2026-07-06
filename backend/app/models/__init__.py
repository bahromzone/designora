# Barcha modellar shu yerda import qilinishi shart —
# SQLAlchemy relationship larni to'g'ri resolve qilishi uchun.

from .assignment import Assignment
from .coupon import Coupon
from .certificate import Certificate
from .Course import Course
from .enrollment import Enrollment
from .lesson import Lesson  # Course.lessons uchun shart
from .lesson_progress import LessonProgress
from .module import Module
from .notification import Notification
from .password_reset import PasswordReset
from .payment import Payment
from .progress import Progress
from .user import User
from .order import Order  # noqa: F401  (payments router + admin uchun)