"""course builder 3.20

Revision ID: p4e0f1a2b3c6
Revises: o3d9e0f1a2b5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "p4e0f1a2b3c6"
down_revision: Union[str, Sequence[str], None] = "o3d9e0f1a2b5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("prerequisite_course_ids", sa.JSON(), nullable=True))
    op.add_column("courses", sa.Column("builder_updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("lessons", sa.Column("processing_status", sa.String(), nullable=True, server_default="ready"))
    op.create_table(
        "course_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_course_versions_course_id", "course_versions", ["course_id"])


def downgrade() -> None:
    op.drop_index("ix_course_versions_course_id", table_name="course_versions")
    op.drop_table("course_versions")
    op.drop_column("lessons", "processing_status")
    op.drop_column("courses", "builder_updated_at")
    op.drop_column("courses", "prerequisite_course_ids")
