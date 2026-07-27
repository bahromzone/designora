"""add actor email to admin audit logs

Revision ID: t8c4d5e6f7a0
Revises: d9ba40825d72
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "t8c4d5e6f7a0"
down_revision: Union[str, Sequence[str], None] = "d9ba40825d72"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "admin_audit_logs" not in tables:
        op.create_table(
            "admin_audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("actor_id", sa.Integer(), nullable=False),
            sa.Column("actor_email", sa.String(), nullable=True),
            sa.Column("action", sa.String(), nullable=False),
            sa.Column("target_type", sa.String(), nullable=False),
            sa.Column("target_id", sa.Integer(), nullable=True),
            sa.Column("old_value", sa.Text(), nullable=True),
            sa.Column("new_value", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        return

    columns = {column["name"] for column in inspector.get_columns("admin_audit_logs")}
    if "actor_email" not in columns:
        op.add_column("admin_audit_logs", sa.Column("actor_email", sa.String(), nullable=True))
        if "users" in tables:
            op.execute(sa.text("""
                UPDATE admin_audit_logs AS logs
                SET actor_email = users.email
                FROM users
                WHERE logs.actor_id = users.id
                  AND logs.actor_email IS NULL
            """))


def downgrade() -> None:
    bind = op.get_bind()
    if "admin_audit_logs" not in sa.inspect(bind).get_table_names():
        return
    columns = {column["name"] for column in sa.inspect(bind).get_columns("admin_audit_logs")}
    if "actor_email" in columns:
        op.drop_column("admin_audit_logs", "actor_email")
