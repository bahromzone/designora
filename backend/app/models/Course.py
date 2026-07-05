from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    price = Column(Integer, default=0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    category = Column(String)  # fashion, pattern, textile
    thumbnail_url = Column(String, nullable=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # String reference — import tartibidan mustaqil
    lessons = relationship("Lesson", back_populates="course", lazy="dynamic")
    progress_records = relationship("Progress", back_populates="course", lazy="dynamic")
    certificates = relationship("Certificate", back_populates="course", lazy="dynamic")
