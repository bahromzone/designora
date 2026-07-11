"""reminder preferences and browser push subscriptions

Revision ID: m1b7c8d9e0f3
Revises: l0a6b7c8d9e2
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m1b7c8d9e0f3"
down_revision: Union[str, Sequence[str], None] = "l0a6b7c8d9e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reminder_preferences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("email_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("in_app_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("push_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("lesson_reminders", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("deadline_reminders", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("review_reminders", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("marketing_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("frequency", sa.String(length=20), nullable=False, server_default="instant"),
        sa.Column("quiet_start", sa.String(length=5), nullable=False, server_default="22:00"),
        sa.Column("quiet_end", sa.String(length=5), nullable=False, server_default="08:00"),
        sa.Column("timezone", sa.String(length=80), nullable=False, server_default="Asia/Tashkent"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("endpoint", sa.String(length=1000), nullable=False, unique=True),
        sa.Column("p256dh", sa.String(length=300), nullable=True),
        sa.Column("auth", sa.String(length=300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("push_subscriptions")
    op.drop_table("reminder_preferences")
