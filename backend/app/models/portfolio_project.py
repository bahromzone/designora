from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id = Column(Integer, ForeignKey("assignment_submissions.id", ondelete="SET NULL"), nullable=True, unique=True)
    title = Column(String(180), nullable=False)
    slug = Column(String(220), nullable=False, unique=True, index=True)
    summary = Column(Text, nullable=True)
    story = Column(Text, nullable=True)
    cover_url = Column(String(500), nullable=True)
    project_url = Column(String(500), nullable=True)
    skills = Column(Text, nullable=True, default="[]")
    tools = Column(Text, nullable=True, default="[]")
    is_public = Column(Boolean, nullable=False, default=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    user = relationship("User")
    submission = relationship("AssignmentSubmission")
