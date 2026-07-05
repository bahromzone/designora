from datetime import UTC, datetime, timedelta

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.core.database import Base


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True))

    @staticmethod
    def expiry() -> datetime:
        return datetime.now(UTC) + timedelta(minutes=15)
