"""admin audit log for roadmap 3.31

Revision ID: v0f6a7b8c9d2
Revises: u9d5e6f7a8b1
"""

from alembic import op
import sqlalchemy as sa

revision = "v0f6a7b8c9d2"
down_revision = "u9d5e6f7a8b1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_type", sa.String(length=50), nullable=True),
        sa.Column("target_id", sa.String(length=100), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admin_audit_logs_actor_id", "admin_audit_logs", ["actor_id"])
    op.create_index("ix_admin_audit_logs_action", "admin_audit_logs", ["action"])
    op.create_index("ix_admin_audit_logs_created_at", "admin_audit_logs", ["created_at"])


def downgrade():
    op.drop_table("admin_audit_logs")
