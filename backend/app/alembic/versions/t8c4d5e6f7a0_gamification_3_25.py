"""gamification 3.25
Revision ID: t8c4d5e6f7a0
Revises: s7b3c4d5e6f9
"""
from typing import Sequence,Union
import sqlalchemy as sa
from alembic import op
revision="t8c4d5e6f7a0";down_revision:Union[str,Sequence[str],None]="s7b3c4d5e6f9";branch_labels=None;depends_on=None
def upgrade():
 op.create_table("xp_events",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("action",sa.String(),nullable=False),sa.Column("source_id",sa.String()),sa.Column("points",sa.Integer(),nullable=False),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
 op.create_table("streak_wallets",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),unique=True,nullable=False),sa.Column("freeze_tokens",sa.Integer(),server_default="1"),sa.Column("last_activity_at",sa.DateTime(timezone=True)),sa.Column("recovered_at",sa.DateTime(timezone=True)))
 op.create_table("leaderboard_preferences",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),unique=True,nullable=False),sa.Column("is_public",sa.Boolean(),server_default=sa.false()))
 op.create_table("skill_badges",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("code",sa.String(),unique=True,nullable=False),sa.Column("title",sa.String(),nullable=False),sa.Column("skill",sa.String(),nullable=False),sa.Column("icon",sa.String()),sa.Column("threshold",sa.Integer(),server_default="1"))
 op.create_table("user_skill_badges",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("badge_id",sa.Integer(),sa.ForeignKey("skill_badges.id",ondelete="CASCADE"),nullable=False),sa.Column("is_public",sa.Boolean(),server_default=sa.false()),sa.Column("earned_at",sa.DateTime(timezone=True),server_default=sa.func.now()),sa.UniqueConstraint("user_id","badge_id",name="uq_user_skill_badge"))
 op.create_table("course_milestones",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("course_id",sa.Integer(),sa.ForeignKey("courses.id",ondelete="CASCADE"),nullable=False),sa.Column("code",sa.String(),nullable=False),sa.Column("title",sa.String(),nullable=False),sa.Column("earned_at",sa.DateTime(timezone=True),server_default=sa.func.now()),sa.UniqueConstraint("user_id","course_id","code",name="uq_course_milestone"))
def downgrade():
 for n in ["course_milestones","user_skill_badges","skill_badges","leaderboard_preferences","streak_wallets","xp_events"]:op.drop_table(n)
