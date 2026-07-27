"""add actor email to admin audit logs

Revision ID: t8c4d5e6f7a0
Revises: s7b3c4d5e6f9
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "t8c4d5e6f7a0"
down_revision: Union[str, Sequence[str], None] = "s7b3c4d5e6f9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing databases may already have admin_audit_logs from create_all or
    # an earlier version of the feature, but without the actor_email column.
    # Add it nullable first so existing rows can be backfilled safely.
    op.add_column(
        "admin_audit_logs",
        sa.Column("actor_email", sa.String(), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE admin_audit_logs AS logs
            SET actor_email = users.email
            FROM users
            WHERE logs.actor_id = users.id
              AND logs.actor_email IS NULL
            """
        )
    )
    # Keep legacy rows readable even if their actor account was deleted.
    op.alter_column(
        "admin_audit_logs",
        "actor_email",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    op.drop_column("admin_audit_logs", "actor_email")
