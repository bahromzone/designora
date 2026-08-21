"""Add admin-issued one-time course access codes."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "w3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "v2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "course_access_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("code_hint", sa.String(length=4), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
    )
    op.create_index(
        "ix_course_access_codes_code_hash",
        "course_access_codes",
        ["code_hash"],
        unique=True,
    )
    op.create_index(
        "ix_course_access_codes_course_id", "course_access_codes", ["course_id"]
    )
    op.create_index(
        "ix_course_access_codes_user_id", "course_access_codes", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_course_access_codes_user_id", table_name="course_access_codes")
    op.drop_index("ix_course_access_codes_course_id", table_name="course_access_codes")
    op.drop_index("ix_course_access_codes_code_hash", table_name="course_access_codes")
    op.drop_table("course_access_codes")
