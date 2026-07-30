from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, nullable=False, index=True)
    actor_email = Column(String, nullable=False)
    action = Column(String, nullable=False, index=True)
    target_type = Column(String, nullable=False)
    target_id = Column(Integer, nullable=True, index=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )
