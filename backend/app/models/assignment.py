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


class Assignment(Base):
    """Amaliy topshiriq — talaba yuklaydi, instruktor baholaydi (BOSQICH 3).

    status: pending → submitted → graded
    """

    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    lesson_id = Column(
        Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True
    )

    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    # Talaba topshirig'i
    submission_text = Column(Text, nullable=True)
    submission_url = Column(String, nullable=True)  # yuklangan fayl havolasi

    # Holat va baholash
    status = Column(String, default="pending")  # pending / submitted / graded
    is_completed = Column(Boolean, default=False)
    grade = Column(Integer, nullable=True)  # instruktor qo'ygan ball
    max_score = Column(Integer, default=100)
    feedback = Column(Text, nullable=True)

    due_date = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User", back_populates="assignments")
