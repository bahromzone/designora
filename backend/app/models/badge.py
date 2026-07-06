from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Badge(Base):
    """Gamifikatsiya nishoni (BOSQICH 3).

    code — dasturiy kalit (masalan "first_enroll", "quiz_perfect").
    """

    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # emoji yoki ikon nomi
    points = Column(Integer, default=0)  # nishon bergan qo'shimcha ball
    created_at = Column(DateTime(timezone=True), default=_now)

    user_badges = relationship(
        "UserBadge",
        back_populates="badge",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )


class UserBadge(Base):
    """Foydalanuvchiga berilgan nishon (bir marta)."""

    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    badge_id = Column(
        Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False
    )
    earned_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User")
    badge = relationship("Badge", back_populates="user_badges")
