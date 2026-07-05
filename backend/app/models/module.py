from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Module(Base):
    """Kurs bo'limi (section) — darslarni mantiqiy guruhlaydi.

    Ierarxiya: Course → Module → Lesson
    """

    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String, nullable=False)
    order = Column(Integer, default=0)  # bo'limlar tartibi
    created_at = Column(DateTime(timezone=True), default=_now)

    # Relationships
    course = relationship("Course", back_populates="modules")
    lessons = relationship(
        "Lesson",
        back_populates="module",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
