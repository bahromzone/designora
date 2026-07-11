from datetime import UTC, datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def _now(): return datetime.now(UTC)

class ForumThread(Base):
 __tablename__="forum_threads"
 id=Column(Integer,primary_key=True);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False);course_id=Column(Integer,ForeignKey("courses.id",ondelete="SET NULL"));lesson_id=Column(Integer,ForeignKey("lessons.id",ondelete="SET NULL"));title=Column(String,nullable=False);body=Column(Text,nullable=False,default="");category=Column(String,default="umumiy");is_pinned=Column(Boolean,default=False);is_locked=Column(Boolean,default=False);accepted_post_id=Column(Integer,nullable=True);views=Column(Integer,default=0);created_at=Column(DateTime(timezone=True),default=_now);updated_at=Column(DateTime(timezone=True),default=_now,onupdate=_now)
 user=relationship("User");posts=relationship("ForumPost",back_populates="thread",lazy="dynamic",cascade="all, delete-orphan",order_by="ForumPost.created_at")

class ForumPost(Base):
 __tablename__="forum_posts"
 id=Column(Integer,primary_key=True);thread_id=Column(Integer,ForeignKey("forum_threads.id",ondelete="CASCADE"),nullable=False);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False);body=Column(Text,nullable=False);is_instructor=Column(Boolean,default=False);mentions=Column(Text,nullable=True);created_at=Column(DateTime(timezone=True),default=_now)
 thread=relationship("ForumThread",back_populates="posts");user=relationship("User")

class ForumReport(Base):
 __tablename__="forum_reports"
 id=Column(Integer,primary_key=True);reporter_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False);thread_id=Column(Integer,ForeignKey("forum_threads.id",ondelete="CASCADE"),nullable=True);post_id=Column(Integer,ForeignKey("forum_posts.id",ondelete="CASCADE"),nullable=True);reason=Column(String,nullable=False);details=Column(Text);status=Column(String,default="open");moderator_id=Column(Integer,ForeignKey("users.id",ondelete="SET NULL"));resolution=Column(Text);created_at=Column(DateTime(timezone=True),default=_now)
