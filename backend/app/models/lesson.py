from sqlalchemy import JSON, Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    title = Column(String)
    video_url = Column(String)
    order = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    is_free_preview = Column(Boolean, default=False)
    resources = Column(JSON, nullable=True)
    type = Column(String, default="video")
    processing_status = Column(String, default="ready")

    course = relationship("Course", back_populates="lessons")
    module = relationship("Module", back_populates="lessons")
    lesson_progress = relationship("LessonProgress", back_populates="lesson", lazy="dynamic", cascade="all, delete-orphan")
