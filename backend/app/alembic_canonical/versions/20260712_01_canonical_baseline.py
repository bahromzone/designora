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
        bind.execute(
            text(
                """
                DO $$
                DECLARE item record;
                BEGIN
                  FOR item IN
                    SELECT tablename FROM pg_tables
                    WHERE schemaname = 'public' AND tablename <> 'alembic_version'
                  LOOP
                    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', item.tablename);
                  END LOOP;
                END $$;
                """
            )
        )
        return
    Base.metadata.drop_all(bind=bind, checkfirst=True)
