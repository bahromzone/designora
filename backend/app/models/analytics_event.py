from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class AnalyticsEvent(Base):
    """Foydalanuvchi xatti-harakati hodisasi (product analytics) — ANALITIKA.

    PostHog / Mixpanel'ga yuborishdan oldin xom hodisalar shu yerda saqlanadi.
    `name` — hodisa nomi (masalan "course_view", "lesson_complete", "checkout").
    `props` — ixtiyoriy JSON kontekst (course_id, source, ...).
    """

    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name = Column(String, index=True, nullable=False)
    props = Column(JSON, nullable=True)
    session_id = Column(String, nullable=True)
    path = Column(String, nullable=True)  # qaysi sahifada bo'lgani
    created_at = Column(DateTime(timezone=True), default=_now, index=True)

    user = relationship("User")
