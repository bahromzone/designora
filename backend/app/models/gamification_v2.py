from datetime import UTC, datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from app.core.database import Base

def now(): return datetime.now(UTC)
class XPEvent(Base):
 __tablename__="xp_events";id=Column(Integer,primary_key=True);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False);action=Column(String,nullable=False);source_id=Column(String);points=Column(Integer,nullable=False);created_at=Column(DateTime(timezone=True),default=now)
class StreakWallet(Base):
 __tablename__="streak_wallets";id=Column(Integer,primary_key=True);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),unique=True,nullable=False);freeze_tokens=Column(Integer,default=1);last_activity_at=Column(DateTime(timezone=True));recovered_at=Column(DateTime(timezone=True))
class LeaderboardPreference(Base):
 __tablename__="leaderboard_preferences";id=Column(Integer,primary_key=True);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),unique=True,nullable=False);is_public=Column(Boolean,default=False)
class SkillBadge(Base):
 __tablename__="skill_badges";id=Column(Integer,primary_key=True);code=Column(String,unique=True,nullable=False);title=Column(String,nullable=False);skill=Column(String,nullable=False);icon=Column(String);threshold=Column(Integer,default=1)
class UserSkillBadge(Base):
 __tablename__="user_skill_badges";__table_args__=(UniqueConstraint("user_id","badge_id",name="uq_user_skill_badge"),);id=Column(Integer,primary_key=True);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False);badge_id=Column(Integer,ForeignKey("skill_badges.id",ondelete="CASCADE"),nullable=False);is_public=Column(Boolean,default=False);earned_at=Column(DateTime(timezone=True),default=now)
class CourseMilestone(Base):
 __tablename__="course_milestones";__table_args__=(UniqueConstraint("user_id","course_id","code",name="uq_course_milestone"),);id=Column(Integer,primary_key=True);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False);course_id=Column(Integer,ForeignKey("courses.id",ondelete="CASCADE"),nullable=False);code=Column(String,nullable=False);title=Column(String,nullable=False);earned_at=Column(DateTime(timezone=True),default=now)
