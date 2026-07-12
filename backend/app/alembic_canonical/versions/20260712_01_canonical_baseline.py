"""Canonical Designora schema baseline.

Revision ID: 20260712_01
Revises: None
"""

from alembic import op

import app.models  # noqa: F401
from app.core.database import Base

revision = "20260712_01"
down_revision = None
branch_labels = ("canonical",)
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    for table in Base.metadata.sorted_tables:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    for table in reversed(Base.metadata.sorted_tables):
        table.drop(bind=bind, checkfirst=True)
