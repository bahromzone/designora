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
    """Gamifikatsiya nishoni (badge).

    criteria_type: points | streak | course_complete | quiz_ace | first_enroll
    threshold: shartni bajarish uchun kerakli qiymat.
    """

    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # emoji yoki ikonka nomi
    criteria_type = Column(String, default="points")
    threshold = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)

    # Relationships
    user_badges = relationship(
        "UserBadge",
        back_populates="badge",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )


class UserBadge(Base):
    """Foydalanuvchi qo'lga kiritgan nishon."""

    __tablename__ = "user_badges"
    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    badge_id = Column(
        Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False
    )
    awarded_at = Column(DateTime(timezone=True), default=_now)

    # Relationships
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")
