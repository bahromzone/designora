from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class LessonQuestion(Base):
    """Dars ostidagi savol (Q&A)."""

    __tablename__ = "lesson_questions"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(
        Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)

    # Relationships
    user = relationship("User")
    answers = relationship(
        "LessonAnswer",
        back_populates="question",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )


class LessonAnswer(Base):
    """Savolga javob."""

    __tablename__ = "lesson_answers"

    id = Column(Integer, primary_key=True)
    question_id = Column(
        Integer, ForeignKey("lesson_questions.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body = Column(Text, nullable=False)
    is_instructor = Column(Boolean, default=False)
    is_accepted = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)

    # Relationships
    question = relationship("LessonQuestion", back_populates="answers")
    user = relationship("User")
