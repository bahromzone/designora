from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class ReminderPreference(Base):
    __tablename__ = "reminder_preferences"
    __table_args__ = (UniqueConstraint("user_id", name="uq_reminder_preferences_user"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email_enabled = Column(Boolean, default=True, nullable=False)
    in_app_enabled = Column(Boolean, default=True, nullable=False)
    push_enabled = Column(Boolean, default=False, nullable=False)
    lesson_reminders = Column(Boolean, default=True, nullable=False)
    deadline_reminders = Column(Boolean, default=True, nullable=False)
    review_reminders = Column(Boolean, default=True, nullable=False)
    marketing_enabled = Column(Boolean, default=False, nullable=False)
    frequency = Column(String(20), default="instant", nullable=False)
    quiet_start = Column(String(5), default="22:00", nullable=False)
    quiet_end = Column(String(5), default="08:00", nullable=False)
    timezone = Column(String(80), default="Asia/Tashkent", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    __table_args__ = (UniqueConstraint("endpoint", name="uq_push_subscription_endpoint"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(String(1000), nullable=False)
    p256dh = Column(String(300), nullable=True)
    auth = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
