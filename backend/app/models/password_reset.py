from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timedelta, timezone
from app.core.database import Base


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True))

    @staticmethod
    def expiry() -> datetime:
        return datetime.now(timezone.utc) + timedelta(minutes=15)