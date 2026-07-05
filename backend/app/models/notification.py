"""
Notification Model — Bildirishnomalar
Avval faqat id, user_id, is_read edi — hech qanday kontent yo'q edi.
Endi to'liq model: message, type, link, created_at.
⚠️ DB migration kerak:
  ALTER TABLE notifications
    ADD COLUMN message TEXT,
    ADD COLUMN type VARCHAR DEFAULT 'info',
    ADD COLUMN link VARCHAR,
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
"""

from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False, default="")
    type = Column(String(30), default="info")  # info | success | warning | course
    link = Column(String, nullable=True)  # klikganda qayerga o'tish
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)

    # Relationship (User modelga back_populates qo'shish kerak bo'lsa)
    # user = relationship("User", back_populates="notifications")
