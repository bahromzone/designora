# Barcha modellar shu yerda import qilinishi shart —
# SQLAlchemy relationship larni to'g'ri resolve qilishi uchun.

from .user import User
from .Course import Course
from .lesson import Lesson          # Course.lessons uchun shart
from .progress import Progress
from .certificate import Certificate
from .assignment import Assignment
from .notification import Notification
from .password_reset import PasswordReset
from .payment import Payment