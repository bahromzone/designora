from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc)


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    title = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User", back_populates="assignments")