from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc)


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    issued_at = Column(DateTime(timezone=True), default=_now)
    title = Column(String, nullable=True)

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")