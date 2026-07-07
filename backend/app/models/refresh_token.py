from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class RefreshToken(Base):
    """Refresh-token (rotatsiya bilan) — XAVFSIZLIK bloki.

    Token qiymati bazada faqat SHA-256 hash sifatida saqlanadi (ochiq matn emas).
    Har bir yangilashda eski token bekor qilinadi (`revoked_at`) va yangisi
    beriladi — rotatsiya. `replaced_by` orqali zanjir kuzatiladi (reuse-detection).
    """

    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by = Column(String, nullable=True)  # yangi token hash'i
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User")

    @property
    def is_active(self) -> bool:
        now = datetime.now(UTC)
        exp = self.expires_at
        if exp is not None and exp.tzinfo is None:
            exp = exp.replace(tzinfo=UTC)
        return self.revoked_at is None and (exp is None or exp > now)
