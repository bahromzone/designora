from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    provider = Column(String, default="local")
    password = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    role = Column(String, default="user")  # user / admin / superadmin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    streak_days = Column(Integer, default=0)
    last_login_date = Column(DateTime(timezone=True), nullable=True)

    bio = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    onboarding_completed = Column(Boolean, nullable=False, default=False)
    learning_goal = Column(String(30), nullable=True)
    experience_level = Column(String(30), nullable=True)
    learning_interests = Column(JSON, nullable=True)
    weekly_learning_hours = Column(Integer, nullable=True)
    preferred_language = Column(String(10), default="uz")
    reminder_time = Column(String(5), nullable=True)

    progress_records = relationship("Progress", back_populates="user", lazy="dynamic")
    certificates = relationship("Certificate", back_populates="user", lazy="dynamic")
    assignments = relationship("Assignment", back_populates="user", lazy="dynamic")
    enrollments = relationship("Enrollment", back_populates="user", lazy="dynamic")
    lesson_progress = relationship(
        "LessonProgress", back_populates="user", lazy="dynamic"
    )
