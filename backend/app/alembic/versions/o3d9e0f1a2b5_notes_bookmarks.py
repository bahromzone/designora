"""notes bookmarks

Revision ID: o3d9e0f1a2b5
Revises: n2c8d9e0f1a4
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "o3d9e0f1a2b5"
down_revision: Union[str, Sequence[str], None] = "n2c8d9e0f1a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lesson_bookmarks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_bookmarked", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_lesson_bookmark_user_lesson"),
    )


def downgrade() -> None:
    op.drop_table("lesson_bookmarks")
