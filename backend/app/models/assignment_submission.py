from datetime import UTC, datetime

from sqlalchemy import (
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


class AssignmentSubmission(Base):
    """Talabaning topshiriq javobi + instruktor bahosi (BOSQICH 3).

    status: submitted / graded / returned
    """

    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True)
    assignment_id = Column(
        Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = Column(Text, nullable=True)  # matn javob
    file_url = Column(String, nullable=True)  # yuklangan fayl havolasi
    status = Column(String, default="submitted")
    grade = Column(Integer, nullable=True)  # 0–100
    feedback = Column(Text, nullable=True)  # instruktor izohi
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=_now)
    graded_at = Column(DateTime(timezone=True), nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    user = relationship("User", foreign_keys=[user_id])
