from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    issued_at = Column(DateTime(timezone=True), default=_now)
    title = Column(String, nullable=True)

    # ── BOSQICH 3: verifikatsiya + PDF ──
    serial = Column(String, unique=True, index=True, nullable=True)
    verification_code = Column(String, unique=True, index=True, nullable=True)
    pdf_url = Column(String, nullable=True)
    grade = Column(String, nullable=True)  # "A'lo" / "Yaxshi" / ...

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")
