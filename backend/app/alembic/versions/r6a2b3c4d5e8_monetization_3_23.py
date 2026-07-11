"""monetization 3.23
Revision ID: r6a2b3c4d5e8
Revises: q5f1a2b3c4d7
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
revision: str = "r6a2b3c4d5e8"
down_revision: Union[str, Sequence[str], None] = "q5f1a2b3c4d7"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("course_bundles",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("title",sa.String(),nullable=False),sa.Column("slug",sa.String(),nullable=False),sa.Column("description",sa.Text()),sa.Column("course_ids",sa.JSON(),nullable=False),sa.Column("price",sa.Integer(),nullable=False),sa.Column("is_active",sa.Boolean(),server_default=sa.false()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()),sa.UniqueConstraint("slug"))
    op.create_table("subscription_plans",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("name",sa.String(),nullable=False),sa.Column("code",sa.String(),nullable=False),sa.Column("monthly_price",sa.Integer(),nullable=False),sa.Column("course_ids",sa.JSON()),sa.Column("is_active",sa.Boolean(),server_default=sa.false()),sa.Column("readiness_note",sa.Text()),sa.UniqueConstraint("code"))
    op.create_table("subscriptions",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("plan_id",sa.Integer(),sa.ForeignKey("subscription_plans.id",ondelete="RESTRICT"),nullable=False),sa.Column("status",sa.String()),sa.Column("current_period_end",sa.DateTime(timezone=True)),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
    op.create_table("team_licenses",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("company_name",sa.String(),nullable=False),sa.Column("owner_user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("course_ids",sa.JSON(),nullable=False),sa.Column("seats",sa.Integer(),nullable=False),sa.Column("used_seats",sa.Integer(),server_default="0"),sa.Column("status",sa.String()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
    op.create_table("team_license_members",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("license_id",sa.Integer(),sa.ForeignKey("team_licenses.id",ondelete="CASCADE"),nullable=False),sa.Column("email",sa.String(),nullable=False),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="SET NULL")),sa.Column("status",sa.String()),sa.UniqueConstraint("license_id","email",name="uq_team_license_member_email"))
    op.create_table("financial_aid_applications",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("course_id",sa.Integer(),sa.ForeignKey("courses.id",ondelete="CASCADE"),nullable=False),sa.Column("aid_type",sa.String(),nullable=False),sa.Column("reason",sa.Text(),nullable=False),sa.Column("requested_installments",sa.Integer()),sa.Column("status",sa.String()),sa.Column("decision_note",sa.Text()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))

def downgrade():
    for name in ["financial_aid_applications","team_license_members","team_licenses","subscriptions","subscription_plans","course_bundles"]:op.drop_table(name)
