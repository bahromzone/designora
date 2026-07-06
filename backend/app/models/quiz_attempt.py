from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class QuizAttempt(Base):
    """Foydalanuvchining quizni yechish urinishi + avtomatik baholash natijasi."""

    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True)
    quiz_id = Column(
        Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True
    )

    score = Column(Integer, default=0)  # to'plangan ball
    max_score = Column(Integer, default=0)  # maksimal ball
    percent = Column(Float, default=0.0)  # foiz
    passed = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), default=_now)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship(
        "QuizAnswer",
        back_populates="attempt",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )


class QuizAnswer(Base):
    """Urinish ichidagi bitta savolga berilgan javob."""

    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True)
    attempt_id = Column(
        Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False
    )
    question_id = Column(
        Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False
    )
    # Tanlangan variant ID'lari: [1, 4]
    selected_option_ids = Column(JSON, nullable=True)
    is_correct = Column(Boolean, default=False)
    points_awarded = Column(Integer, default=0)

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")
