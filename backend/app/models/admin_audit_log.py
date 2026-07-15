from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, index=True)
