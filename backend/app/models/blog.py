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


class BlogPost(Base):
    """Blog / SEO kontenti (BOSQICH 4)."""

    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    excerpt = Column(String, nullable=True)
    body = Column(Text, nullable=False, default="")
    cover_image_url = Column(String, nullable=True)
    author_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    tags = Column(String, nullable=True)  # vergul bilan ajratilgan

    # ── SEO ──
    meta_title = Column(String, nullable=True)
    meta_description = Column(String, nullable=True)

    is_published = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    author = relationship("User")
