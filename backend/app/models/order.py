from datetime import UTC, datetime

from sqlalchemy import (
    BigInteger,
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


class Order(Base):
    """To'lov buyurtmasi — checkout'dan provayder webhook'igacha kuzatiladi.

    Ierarxiya: user + course → Order → (Payme/Click transaction) → paid → Enrollment
    """

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True
    )

    amount = Column(Integer, default=0)  # so'mda (Course.price bilan bir xil birlik)
    currency = Column(String, default="UZS")
    # pending / paid / cancelled / failed
    status = Column(String, default="pending", index=True)
    provider = Column(String, nullable=True)  # payme / click / uzum

    # ── Provayder transaksiya ma'lumotlari ──────────────────────────────────
    provider_transaction_id = Column(String, nullable=True, index=True)
    # Payme holat kodi: 1=created, 2=performed, -1/-2=cancelled
    provider_state = Column(Integer, default=0)
    cancel_reason = Column(Integer, nullable=True)

    # Payme vaqtlari millisekundda (Merchant API talab qiladi)
    create_time_ms = Column(BigInteger, default=0)
    perform_time_ms = Column(BigInteger, default=0)
    cancel_time_ms = Column(BigInteger, default=0)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
    coupon_code = Column(String, nullable=True)
    discount_amount = Column(Integer, default=0)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
    course = relationship("Course")