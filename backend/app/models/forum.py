from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _now():
    return datetime.now(UTC)


class ForumThread(Base):
    """Community forum mavzusi (BOSQICH 4)."""

    __tablename__ = "forum_threads"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True
    )
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False, default="")
    category = Column(String, default="umumiy")
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    user = relationship("User")
    posts = relationship(
        "ForumPost",
        back_populates="thread",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="ForumPost.created_at",
    )


class ForumPost(Base):
    """Forum mavzusiga javob (BOSQICH 4)."""

    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True)
    thread_id = Column(
        Integer,
        ForeignKey("forum_threads.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)

    thread = relationship("ForumThread", back_populates="posts")
    user = relationship("User")
