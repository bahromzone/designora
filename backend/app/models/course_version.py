from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class CourseVersion(Base):
    """Course builder snapshot used for version history and restore."""

    __tablename__ = "course_versions"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    label = Column(String, nullable=False, default="Autosave")
    snapshot = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    course = relationship("Course")
