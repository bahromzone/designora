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


class Quiz(Base):
    """Dars yoki kurs uchun test (quiz).

    BOSQICH 3 — o'rganish sifatini oshirish.
    Ierarxiya: Quiz → Question → QuestionOption.
    """

    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True)
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id = Column(
        Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    pass_score = Column(Integer, default=70)  # o'tish uchun kerakli foiz
    max_attempts = Column(Integer, default=0)  # 0 = cheksiz
    time_limit_seconds = Column(Integer, nullable=True)  # None = vaqt cheklovsiz
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    # Relationships
    questions = relationship(
        "Question",
        back_populates="quiz",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="Question.order",
    )
    attempts = relationship(
        "QuizAttempt",
        back_populates="quiz",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )


class Question(Base):
    """Quiz savoli. type: single | multiple | boolean."""

    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True)
    quiz_id = Column(
        Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    text = Column(Text, nullable=False)
    type = Column(String, default="single")  # single / multiple / boolean
    order = Column(Integer, default=0)
    points = Column(Integer, default=1)
    explanation = Column(Text, nullable=True)  # javobdan keyin ko'rsatiladi

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    options = relationship(
        "QuestionOption",
        back_populates="question",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="QuestionOption.order",
    )


class QuestionOption(Base):
    """Savol javob varianti."""

    __tablename__ = "quiz_question_options"

    id = Column(Integer, primary_key=True)
    question_id = Column(
        Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False
    )
    text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    order = Column(Integer, default=0)

    # Relationships
    question = relationship("Question", back_populates="options")
