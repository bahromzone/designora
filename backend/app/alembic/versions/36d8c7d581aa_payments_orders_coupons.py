"""payments: orders + coupons

Revision ID: 36d8c7d581aa
Revises: 8250541035bb
Create Date: 2026-07-06 15:48:58.954961

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '36d8c7d581aa'
down_revision: Union[str, Sequence[str], None] = '8250541035bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — orders + coupons jadvallarini yaratadi."""
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="SET NULL"), nullable=True),
        sa.Column("amount", sa.Integer, server_default="0"),
        sa.Column("currency", sa.String, server_default="UZS"),
        sa.Column("status", sa.String, server_default="pending"),
        sa.Column("provider", sa.String, nullable=True),
        sa.Column("provider_transaction_id", sa.String, nullable=True),
        sa.Column("provider_state", sa.Integer, nullable=True),
        sa.Column("cancel_reason", sa.Integer, nullable=True),
        sa.Column("coupon_code", sa.String, nullable=True),
        sa.Column("discount_amount", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_orders_provider_transaction_id", "orders", ["provider_transaction_id"]
    )

    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String, nullable=False),
        sa.Column("type", sa.String, server_default="percent"),
        sa.Column("value", sa.Integer, server_default="0"),
        sa.Column("max_uses", sa.Integer, nullable=True),
        sa.Column("used_count", sa.Integer, server_default="0"),
        sa.Column("is_active", sa.Boolean, server_default=sa.true()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_coupons_code", "coupons", ["code"], unique=True)


def downgrade() -> None:
    """Downgrade schema — orders + coupons jadvallarini o'chiradi."""
    op.drop_index("ix_coupons_code", table_name="coupons")
    op.drop_table("coupons")
    op.drop_index("ix_orders_provider_transaction_id", table_name="orders")
    op.drop_table("orders")