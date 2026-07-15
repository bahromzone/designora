"""persistent onboarding profile

Revision ID: x2b8c9d0e1f4
Revises: w1a7b8c9d0e3
"""

from alembic import op
import sqlalchemy as sa

revision = "x2b8c9d0e1f4"
down_revision = "w1a7b8c9d0e3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("learning_goal", sa.String(30)))
    op.add_column("users", sa.Column("experience_level", sa.String(30)))
    op.add_column("users", sa.Column("learning_interests", sa.JSON()))
    op.add_column("users", sa.Column("weekly_learning_hours", sa.Integer()))
    op.add_column("users", sa.Column("preferred_language", sa.String(10), server_default="uz"))
    op.add_column("users", sa.Column("reminder_time", sa.String(5)))


def downgrade():
    for column in ("reminder_time", "preferred_language", "weekly_learning_hours", "learning_interests", "experience_level", "learning_goal", "onboarding_completed"):
        op.drop_column("users", column)
