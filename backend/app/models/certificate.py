import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


def _gen_code() -> str:
    return uuid.uuid4().hex[:16].upper()


class Certificate(Base):
    """Kurs tugagach beriladigan sertifikat (BOSQICH 3).

    verification_code — ommaviy tekshirish havolasi uchun.
    """

    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    issued_at = Column(DateTime(timezone=True), default=_now)
    title = Column(String, nullable=True)
    grade = Column(Float, nullable=True)  # yakuniy foiz / ball
    verification_code = Column(
        String, unique=True, index=True, default=_gen_code
    )
    pdf_url = Column(String, nullable=True)

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")
