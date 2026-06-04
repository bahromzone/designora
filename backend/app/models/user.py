from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    provider = Column(String, default="local")
    password = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    role = Column(String, default="user")          # user / admin / superadmin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    # Streak
    streak_days = Column(Integer, default=0)
    last_login_date = Column(DateTime(timezone=True), nullable=True)

    # ✅ BUG #3 FIX: profile.py ishlatadigan maydonlar qo'shildi
    bio = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Relationships
    progress_records = relationship("Progress", back_populates="user", lazy="dynamic")
    certificates = relationship("Certificate", back_populates="user", lazy="dynamic")
    assignments = relationship("Assignment", back_populates="user", lazy="dynamic")