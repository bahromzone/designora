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
        bind.execute(text("DROP SCHEMA public CASCADE"))
        bind.execute(text("CREATE SCHEMA public"))
        bind.execute(text("GRANT ALL ON SCHEMA public TO public"))
    else:
        Base.metadata.drop_all(bind=bind, checkfirst=True)
