"""portfolio: portfolio_projects table

Revision ID: j8e4f5a6b7c0
Revises: i7d3e4f5a6b9
Create Date: 2026-07-10 20:10:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "j8e4f5a6b7c0"
down_revision: Union[str, Sequence[str], None] = "i7d3e4f5a6b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "portfolio_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "submission_id",
            sa.Integer(),
            sa.ForeignKey("assignment_submissions.id", ondelete="SET NULL"),
            nullable=True,
            unique=True,
        ),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("slug", sa.String(length=220), nullable=False, unique=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("story", sa.Text(), nullable=True),
        sa.Column("cover_url", sa.String(length=500), nullable=True),
        sa.Column("project_url", sa.String(length=500), nullable=True),
        sa.Column("skills", sa.Text(), nullable=True, server_default="[]"),
        sa.Column("tools", sa.Text(), nullable=True, server_default="[]"),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_portfolio_projects_user_id", "portfolio_projects", ["user_id"])
    op.create_index("ix_portfolio_projects_slug", "portfolio_projects", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_portfolio_projects_slug", table_name="portfolio_projects")
    op.drop_index("ix_portfolio_projects_user_id", table_name="portfolio_projects")
    op.drop_table("portfolio_projects")
