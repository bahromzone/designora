from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False, index=True)
    target_id = Column(Integer, nullable=False, index=True)
    target_type = Column(String, nullable=False, default="user")
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False, index=True)
