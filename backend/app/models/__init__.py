# Import every model so SQLAlchemy can resolve relationships.
from .assignment import Assignment
from .certificate import Certificate
from .Course import Course
from .course_version import CourseVersion
from .enrollment import Enrollment
from .lesson import Lesson
from .lesson_progress import LessonProgress
from .module import Module
from .notification import Notification
from .password_reset import PasswordReset
from .payment import Payment
from .progress import Progress
from .user import User
