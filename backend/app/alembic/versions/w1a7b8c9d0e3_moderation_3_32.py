"""moderation workflow for roadmap 3.32

Revision ID: w1a7b8c9d0e3
Revises: v0f6a7b8c9d2
"""

from alembic import op
import sqlalchemy as sa

revision = "w1a7b8c9d0e3"
down_revision = "v0f6a7b8c9d2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("content_reports", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("reporter_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("content_type", sa.String(40), nullable=False), sa.Column("content_id", sa.Integer(), nullable=False), sa.Column("reported_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("reason", sa.String(100), nullable=False), sa.Column("details", sa.Text()), sa.Column("status", sa.String(20), nullable=False, server_default="open"), sa.Column("priority", sa.String(20), nullable=False, server_default="normal"), sa.Column("moderator_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("resolution", sa.Text()), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("resolved_at", sa.DateTime(timezone=True)))
    op.create_table("moderation_actions", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("report_id", sa.Integer(), sa.ForeignKey("content_reports.id", ondelete="SET NULL")), sa.Column("moderator_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("target_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("action", sa.String(30), nullable=False), sa.Column("reason", sa.String(200), nullable=False), sa.Column("internal_note", sa.Text()), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("moderation_appeals", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("action_id", sa.Integer(), sa.ForeignKey("moderation_actions.id", ondelete="CASCADE"), nullable=False), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("statement", sa.Text(), nullable=False), sa.Column("status", sa.String(20), nullable=False, server_default="pending"), sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("decision_note", sa.Text()), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("resolved_at", sa.DateTime(timezone=True)))
    for table, columns in {"content_reports": ["reporter_id", "content_type", "content_id", "reported_user_id", "status", "created_at"], "moderation_actions": ["report_id", "moderator_id", "target_user_id", "action", "created_at"], "moderation_appeals": ["action_id", "user_id", "status"]}.items():
        for column in columns:
            op.create_index(f"ix_{table}_{column}", table, [column])


def downgrade():
    op.drop_table("moderation_appeals")
    op.drop_table("moderation_actions")
    op.drop_table("content_reports")
