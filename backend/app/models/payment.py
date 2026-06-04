from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc)


# ✅ BUG #5 FIX: models/payment.py fayli yaratildi
# admin/payments.py bu faylni import qiladi — avval mavjud emas edi,
# natijada ilovani ishga tushirishda ModuleNotFoundError berardi.
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    amount = Column(Integer, default=0)           # so'mda
    status = Column(String, default="pending")    # pending / paid / failed / refunded
    provider = Column(String, nullable=True)      # click / payme / stripe

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    user = relationship("User")