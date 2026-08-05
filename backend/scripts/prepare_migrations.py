"""Prepare the one-time Alembic cutover for Designora's legacy schema.

A brand-new database must go through the real Alembic history. Only a
pre-Alembic database that already contains application tables is baselined.
"""

# fmt: off
# This deploy bootstrap intentionally imports application models after the
# migration libraries so it can inspect the live metadata before stamping.
# ruff: noqa: I001
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text

import app.models  # noqa: F401
from app.core.database import Base, engine


_CORE_LEGACY_TABLES = {"users", "courses"}


def _migration_heads() -> list[str]:
    config = Config("alembic.ini")
    return ScriptDirectory.from_config(config).get_heads()


def main() -> None:
    inspector = inspect(engine)
    if inspector.has_table("alembic_version"):
        print("Alembic version table exists; normal migration path applies.")
        return

    existing_tables = set(inspector.get_table_names())
    if not existing_tables:
        print("Empty database detected; normal Alembic migration path applies.")
        return

    if not _CORE_LEGACY_TABLES.issubset(existing_tables):
        missing = ", ".join(sorted(_CORE_LEGACY_TABLES - existing_tables))
        raise RuntimeError(
            "Refusing to baseline a partial database. "
            f"Missing legacy core tables: {missing}"
        )

    print("Legacy application schema detected; creating a one-time baseline.")
    with engine.begin() as connection:
        Base.metadata.create_all(bind=connection)
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS alembic_version "
                "(version_num VARCHAR(32) NOT NULL)"
            )
        )
        for head in _migration_heads():
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:head)"),
                {"head": head},
            )
    print("Legacy schema baselined at Alembic head.")


if __name__ == "__main__":
    main()
# fmt: on
