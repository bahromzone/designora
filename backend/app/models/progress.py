from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc)


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    percent = Column(Integer, default=0)

    # ✅ BUG #12 FIX: "hours_spent" → "minutes_spent" — ustun MINUTLARDA saqlaydi,
    # nomi endi to'g'ri. Avvalgi "hours_spent" nomi chalkashlik yaratardi:
    # boshqa developer /60 qilmasdan soat deb ishlatishi mumkin edi.
    # ⚠️  DB migratsiyasi talab qilinadi: ALTER TABLE progress RENAME COLUMN hours_spent TO minutes_spent
    minutes_spent = Column(Integer, default=0)

    last_activity = Column(DateTime(timezone=True), default=_now, onupdate=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    # Relationships
    course = relationship("Course", back_populates="progress_records")
    user = relationship("User", back_populates="progress_records")