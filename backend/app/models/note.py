from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class LessonNote(Base):
    """Talabaning video vaqtidagi shaxsiy eslatmasi (BOSQICH 3)."""

    __tablename__ = "lesson_notes"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(
        Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body = Column(Text, nullable=False)
    timestamp_seconds = Column(Integer, default=0)  # video pozitsiyasi (sekund)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    user = relationship("User")
    lesson = relationship("Lesson")
