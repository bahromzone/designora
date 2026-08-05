"""Add a unique idempotency key to checkout orders.

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
    op.add_column("orders", sa.Column("idempotency_key", sa.String(length=128)))
    op.create_index(
        "ix_orders_idempotency_key",
        "orders",
        ["idempotency_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_orders_idempotency_key", table_name="orders")
    op.drop_column("orders", "idempotency_key")
