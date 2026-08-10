"""Add saved courses table."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "v2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "u9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_courses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id", name="uq_saved_courses_user_course"),
    )
    op.create_index("ix_saved_courses_id", "saved_courses", ["id"])
    op.create_index("ix_saved_courses_user_id", "saved_courses", ["user_id"])
    op.create_index("ix_saved_courses_course_id", "saved_courses", ["course_id"])


def downgrade() -> None:
    op.drop_index("ix_saved_courses_course_id", table_name="saved_courses")
    op.drop_index("ix_saved_courses_user_id", table_name="saved_courses")
    op.drop_index("ix_saved_courses_id", table_name="saved_courses")
    op.drop_table("saved_courses")
