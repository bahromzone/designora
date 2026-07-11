"""checkout ux 3.22

Revision ID: q5f1a2b3c4d7
Revises: p4e0f1a2b3c6
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
revision: str = "q5f1a2b3c4d7"
down_revision: Union[str, Sequence[str], None] = "p4e0f1a2b3c6"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("orders", sa.Column("original_amount", sa.Integer(), nullable=True, server_default="0"))
    op.add_column("orders", sa.Column("receipt_number", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("refund_status", sa.String(), nullable=True, server_default="none"))
    op.add_column("orders", sa.Column("failure_reason", sa.String(), nullable=True))
    op.create_unique_constraint("uq_orders_receipt_number", "orders", ["receipt_number"])

def downgrade() -> None:
    op.drop_constraint("uq_orders_receipt_number", "orders", type_="unique")
    op.drop_column("orders", "failure_reason")
    op.drop_column("orders", "refund_status")
    op.drop_column("orders", "receipt_number")
    op.drop_column("orders", "original_amount")
