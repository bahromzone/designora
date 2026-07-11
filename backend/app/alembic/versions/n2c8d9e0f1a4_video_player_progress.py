"""video player sources, subtitles and resume progress

Revision ID: n2c8d9e0f1a4
Revises: m1b7c8d9e0f3
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "n2c8d9e0f1a4"
down_revision: Union[str, Sequence[str], None] = "m1b7c8d9e0f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("lessons", sa.Column("video_sources", sa.JSON(), nullable=True))
    op.add_column("lessons", sa.Column("subtitles", sa.JSON(), nullable=True))
    op.add_column(
        "lesson_progress",
        sa.Column("video_position_seconds", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "lesson_progress",
        sa.Column("video_duration_seconds", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "lesson_progress",
        sa.Column("last_watched_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("lesson_progress", "last_watched_at")
    op.drop_column("lesson_progress", "video_duration_seconds")
    op.drop_column("lesson_progress", "video_position_seconds")
    op.drop_column("lessons", "subtitles")
    op.drop_column("lessons", "video_sources")
