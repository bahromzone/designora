from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class UserLearningPath(Base):
    __tablename__ = "user_learning_paths"
    __table_args__ = (
        UniqueConstraint("user_id", "path_slug", name="uq_user_learning_path"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    path_slug = Column(String(80), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), default=_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
