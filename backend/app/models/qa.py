from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
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


class LessonQuestion(Base):
    """Dars ostidagi talaba savoli (Q&A) — BOSQICH 3."""

    __tablename__ = "lesson_questions"

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
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    user = relationship("User")
    answers = relationship(
        "LessonAnswer",
        back_populates="question",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="LessonAnswer.created_at",
    )


class LessonAnswer(Base):
    """Savolga javob — instruktor yoki boshqa talaba."""

    __tablename__ = "lesson_answers"

    id = Column(Integer, primary_key=True)
    question_id = Column(
        Integer,
        ForeignKey("lesson_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body = Column(Text, nullable=False)
    is_instructor = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)

    question = relationship("LessonQuestion", back_populates="answers")
    user = relationship("User")
