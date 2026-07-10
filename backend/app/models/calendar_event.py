# fmt: off
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base


def _now():
 return datetime.now(UTC)


class CalendarEvent(Base):
 __tablename__ = "calendar_events"

 id = Column(Integer, primary_key=True)
 user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
 title = Column(String(180), nullable=False)
 event_type = Column(String(40), nullable=False, index=True)
 starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
 ends_at = Column(DateTime(timezone=True), nullable=True)
 course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
 link = Column(String(500), nullable=True)
 description = Column(Text, nullable=True)
 created_at = Column(DateTime(timezone=True), default=_now)
# fmt: on
