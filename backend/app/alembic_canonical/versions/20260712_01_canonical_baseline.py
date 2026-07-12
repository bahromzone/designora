"""Canonical Designora schema baseline.

Revision ID: 20260712_01
Revises: None
"""

from alembic import op
from sqlalchemy import inspect

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
        preparer = bind.dialect.identifier_preparer
        for table in inspect(bind).get_table_names():
            if table != "alembic_version":
                op.execute(f"DROP TABLE IF EXISTS {preparer.quote(table)} CASCADE")
    else:
        Base.metadata.drop_all(bind=bind, checkfirst=True)
