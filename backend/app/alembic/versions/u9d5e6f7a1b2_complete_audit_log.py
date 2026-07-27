"""complete legacy admin audit log schema

Revision ID: u9d5e6f7a1b2
Revises: t8c4d5e6f7a0
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "u9d5e6f7a1b2"
down_revision: Union[str, Sequence[str], None] = "t8c4d5e6f7a0"
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
    missing = {
        "actor_email": sa.Column("actor_email", sa.String(), nullable=True),
        "action": sa.Column("action", sa.String(), nullable=True),
        "target_type": sa.Column("target_type", sa.String(), nullable=True),
        "target_id": sa.Column("target_id", sa.Integer(), nullable=True),
        "old_value": sa.Column("old_value", sa.Text(), nullable=True),
        "new_value": sa.Column("new_value", sa.Text(), nullable=True),
        "ip_address": sa.Column("ip_address", sa.String(), nullable=True),
        "created_at": sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    }
    for name, column in missing.items():
        if name not in columns:
            op.add_column("admin_audit_logs", column)

    columns = {column["name"] for column in sa.inspect(bind).get_columns("admin_audit_logs")}
    if "users" in tables and "actor_email" in columns:
        op.execute(sa.text("""
            UPDATE admin_audit_logs AS logs
            SET actor_email = users.email
            FROM users
            WHERE logs.actor_id = users.id
              AND logs.actor_email IS NULL
        """))


def downgrade() -> None:
    pass
