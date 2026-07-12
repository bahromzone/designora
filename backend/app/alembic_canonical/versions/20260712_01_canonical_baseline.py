"""Canonical Designora schema baseline.

Revision ID: 20260712_01
Revises: None
"""

from alembic import op
from sqlalchemy import text

import app.models  # noqa: F401
from app.core.database import Base

revision = "20260712_01"
down_revision = None
branch_labels = ("canonical",)
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind(), checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # Keep alembic_version alive so Alembic can finish deleting the row.
        for table in reversed(Base.metadata.sorted_tables):
            quoted = bind.dialect.identifier_preparer.quote(table.name)
            bind.execute(text(f"DROP TABLE IF EXISTS {quoted} CASCADE"))
        return
    Base.metadata.drop_all(bind=bind, checkfirst=True)
