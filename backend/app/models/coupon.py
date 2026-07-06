from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Coupon(Base):
    """Chegirma kuponi. type='percent' → foiz, type='fixed' → so'mda summa."""

    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, default="percent")  # percent / fixed
    value = Column(Integer, default=0)  # foiz (0-100) yoki so'm
    max_uses = Column(Integer, nullable=True)  # None = cheksiz
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    def discount_for(self, amount: int) -> int:
        """Berilgan summaga chegirmani hisoblaydi (yakuniy summani qaytaradi)."""
        if self.type == "percent":
            disc = int(round(amount * min(max(self.value, 0), 100) / 100))
        else:
            disc = min(self.value, amount)
        return max(amount - disc, 0)

    def is_valid(self) -> bool:
        if not self.is_active:
            return False
        if self.expires_at and datetime.now(UTC) > self.expires_at:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        return True

    def apply(self, amount: int) -> int:
        """Chegirma summasini (so'mda) qaytaradi."""
        if self.type == "percent":
            return int(amount * min(self.value, 100) / 100)
        return min(self.value, amount)