"""learning paths: user path subscriptions

Revision ID: k9f5a6b7c8d1
Revises: j8e4f5a6b7c0
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "k9f5a6b7c8d1"
down_revision: Union[str, Sequence[str], None] = "j8e4f5a6b7c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_learning_paths",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("path_slug", sa.String(length=80), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "path_slug", name="uq_user_learning_path"),
    )
    op.create_index(
        "ix_user_learning_paths_path_slug",
        "user_learning_paths",
        ["path_slug"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_learning_paths_path_slug", table_name="user_learning_paths")
    op.drop_table("user_learning_paths")
