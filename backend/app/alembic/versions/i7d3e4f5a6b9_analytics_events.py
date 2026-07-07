"""analytics: analytics_events jadvali

Revision ID: i7d3e4f5a6b9
Revises: h6c2d3e4f5a8
Create Date: 2026-07-07 12:05:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "i7d3e4f5a6b9"
down_revision: Union[str, Sequence[str], None] = "h6c2d3e4f5a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """analytics_events jadvalini yaratadi."""
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("props", sa.JSON, nullable=True),
        sa.Column("session_id", sa.String, nullable=True),
        sa.Column("path", sa.String, nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_index("ix_analytics_events_name", "analytics_events", ["name"])
    op.create_index(
        "ix_analytics_events_created_at", "analytics_events", ["created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_analytics_events_created_at", table_name="analytics_events")
    op.drop_index("ix_analytics_events_name", table_name="analytics_events")
    op.drop_table("analytics_events")
