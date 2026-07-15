from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class ContentReport(Base):
    __tablename__ = "content_reports"

    id = Column(Integer, primary_key=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String(40), nullable=False, index=True)
    content_id = Column(Integer, nullable=False, index=True)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reason = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(20), default="open", nullable=False, index=True)
    priority = Column(String(20), default="normal", nullable=False)
    moderator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class ModerationAction(Base):
    __tablename__ = "moderation_actions"

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey("content_reports.id", ondelete="SET NULL"), nullable=True, index=True)
    moderator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(30), nullable=False, index=True)
    reason = Column(String(200), nullable=False)
    internal_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False, index=True)


class ModerationAppeal(Base):
    __tablename__ = "moderation_appeals"

    id = Column(Integer, primary_key=True)
    action_id = Column(Integer, ForeignKey("moderation_actions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    statement = Column(Text, nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
