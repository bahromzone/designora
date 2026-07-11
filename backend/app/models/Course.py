from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    price = Column(Integer, default=0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    category = Column(String)
    thumbnail_url = Column(String, nullable=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    subtitle = Column(String, nullable=True)
    level = Column(String, default="boshlang'ich")
    language = Column(String, default="uz")
    duration_minutes = Column(Integer, default=0)
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    students_count = Column(Integer, default=0)
    status = Column(String, default="draft")
    learning_outcomes = Column(JSON, nullable=True)
    requirements = Column(JSON, nullable=True)
    prerequisite_course_ids = Column(JSON, nullable=True)
    preview_video_url = Column(String, nullable=True)
    builder_updated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    lessons = relationship("Lesson", back_populates="course", lazy="dynamic")
    modules = relationship("Module", back_populates="course", lazy="dynamic", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", lazy="dynamic", cascade="all, delete-orphan")
    progress_records = relationship("Progress", back_populates="course", lazy="dynamic")
    certificates = relationship("Certificate", back_populates="course", lazy="dynamic")
