from datetime import UTC, datetime

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Integer, default=0)
    original_amount = Column(Integer, default=0)
    currency = Column(String, default="UZS")
    status = Column(String, default="pending", index=True)
    provider = Column(String, nullable=True)
    provider_transaction_id = Column(String, nullable=True, index=True)
    provider_state = Column(Integer, default=0)
    cancel_reason = Column(Integer, nullable=True)
    create_time_ms = Column(BigInteger, default=0)
    perform_time_ms = Column(BigInteger, default=0)
    cancel_time_ms = Column(BigInteger, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
    coupon_code = Column(String, nullable=True)
    discount_amount = Column(Integer, default=0)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    receipt_number = Column(String, nullable=True, unique=True)
    refund_status = Column(String, default="none")
    failure_reason = Column(String, nullable=True)

    user = relationship("User")
    course = relationship("Course")
