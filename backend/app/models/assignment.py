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
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    # ── BOSQICH 3: dars bilan bog'lash + to'liq topshiriq ta'rifi ──
    lesson_id = Column(
        Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True
    )
    description = Column(Text, nullable=True)
    max_score = Column(Integer, default=100)

    title = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User", back_populates="assignments")
    submissions = relationship(
        "AssignmentSubmission",
        back_populates="assignment",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
