from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Referral(Base):
    """Referral / affiliate yozuvi — kim kimni taklif qilgani (BOSQICH 4).

    status: pending (ro'yxatdan o'tdi) / converted (birinchi to'lovni amalga oshirdi)
    Har bir taklif qilingan foydalanuvchi faqat bir marta hisoblanadi.
    """

    __tablename__ = "referrals"
    __table_args__ = (
        UniqueConstraint("referred_user_id", name="uq_referral_referred_user"),
    )

    id = Column(Integer, primary_key=True)
    referrer_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    referred_user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    code = Column(String, index=True, nullable=False)
    status = Column(String, default="pending")  # pending | converted
    reward_points = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)
    converted_at = Column(DateTime(timezone=True), nullable=True)

    referrer = relationship("User", foreign_keys=[referrer_id])
    referred_user = relationship("User", foreign_keys=[referred_user_id])
