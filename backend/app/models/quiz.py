from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Quiz(Base):
    """Kurs yoki dars uchun test/quiz (BOSQICH 3).

    Har bir quiz bitta kursga (majburiy) va ixtiyoriy ravishda bitta darsga
    bog'lanadi. `passing_score` — o'tish uchun kerakli minimal foiz.
    """

    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True)
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id = Column(
        Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    passing_score = Column(Integer, default=70)  # o'tish uchun min foiz (0–100)
    max_attempts = Column(Integer, nullable=True)  # None = cheksiz
    time_limit_minutes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    course = relationship("Course")
    lesson = relationship("Lesson")
    questions = relationship(
        "QuizQuestion",
        back_populates="quiz",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.order",
    )
    attempts = relationship(
        "QuizAttempt",
        back_populates="quiz",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )


class QuizQuestion(Base):
    """Quiz savoli.

    type:
      - "single"   — bitta to'g'ri javob (radio)
      - "multiple" — bir nechta to'g'ri javob (checkbox)
      - "boolean"  — to'g'ri / noto'g'ri

    options:         [{"id": "a", "text": "..."}, ...]
    correct_answers: ["a", "c"]  — to'g'ri variant id'lari
    """

    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True)
    quiz_id = Column(
        Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    text = Column(Text, nullable=False)
    type = Column(String, default="single")
    options = Column(JSON, nullable=True)
    correct_answers = Column(JSON, nullable=True)
    points = Column(Integer, default=1)
    order = Column(Integer, default=0)
    explanation = Column(Text, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    """Foydalanuvchining bitta quizga urinishi va natijasi."""

    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True)
    quiz_id = Column(
        Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    attempt_number = Column(Integer, default=1)
    score = Column(Float, default=0.0)  # foiz (0–100)
    earned_points = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    passed = Column(Boolean, default=False)
    # Yuborilgan javoblar: {"<question_id>": ["a", "c"], ...}
    answers = Column(JSON, nullable=True)
    started_at = Column(DateTime(timezone=True), default=_now)
    submitted_at = Column(DateTime(timezone=True), default=_now)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User")
