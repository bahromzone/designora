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
        # A baseline owns the whole canonical schema. Recreate public cleanly,
        # then recreate Alembic's bookkeeping table so the command can remove
        # the current revision row after downgrade() returns.
        bind.execute(text("DROP SCHEMA public CASCADE"))
        bind.execute(text("CREATE SCHEMA public AUTHORIZATION CURRENT_USER"))
        bind.execute(text("GRANT ALL ON SCHEMA public TO public"))
        bind.execute(
            text(
                "CREATE TABLE alembic_version ("
                "version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
            )
        )
        bind.execute(
            text(
                "INSERT INTO alembic_version (version_num) "
                "VALUES ('20260712_01')"
            )
        )
        return
    Base.metadata.drop_all(bind=bind, checkfirst=True)
