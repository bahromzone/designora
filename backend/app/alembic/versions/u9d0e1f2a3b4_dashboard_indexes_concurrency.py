"""Add dashboard indexes and concurrent-write uniqueness guards.

Revision ID: u9d0e1f2a3b4
Revises: t8c4d5e6f7a0
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "u9d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = "t8c4d5e6f7a0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_assignments_course_due_date",
        "assignments",
        ["course_id", "due_date"],
    )
    op.create_index(
        "ix_lessons_course_order",
        "lessons",
        ["course_id", "order", "id"],
    )
    op.create_index(
        "ix_lesson_progress_user_course_completed",
        "lesson_progress",
        ["user_id", "course_id", "is_completed"],
    )
    op.create_index(
        "ix_notifications_user_read_created",
        "notifications",
        ["user_id", "is_read", "created_at"],
    )
    op.create_unique_constraint(
        "uq_assignment_submission_assignment_user",
        "assignment_submissions",
        ["assignment_id", "user_id"],
    )
    op.create_index(
        "ix_assignment_submissions_user_assignment",
        "assignment_submissions",
        ["user_id", "assignment_id"],
    )
    op.drop_index("ix_orders_provider_transaction_id", table_name="orders")
    op.create_index(
        "ix_orders_provider_transaction_id",
        "orders",
        ["provider_transaction_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_orders_provider_transaction_id",
        table_name="orders",
    )
    op.create_index(
        "ix_orders_provider_transaction_id",
        "orders",
        ["provider_transaction_id"],
    )
    op.drop_index(
        "ix_assignment_submissions_user_assignment",
        table_name="assignment_submissions",
    )
    op.drop_constraint(
        "uq_assignment_submission_assignment_user",
        "assignment_submissions",
        type_="unique",
    )
    op.drop_index(
        "ix_notifications_user_read_created",
        table_name="notifications",
    )
    op.drop_index(
        "ix_lesson_progress_user_course_completed",
        table_name="lesson_progress",
    )
    op.drop_index("ix_lessons_course_order", table_name="lessons")
    op.drop_index("ix_assignments_course_due_date", table_name="assignments")
