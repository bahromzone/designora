"""Prepare the one-time Alembic cutover for Designora's legacy schema.

Before Alembic was wired into the container, the application created tables
from SQLAlchemy metadata at startup. A database from that era has no
alembic_version table, so replaying the historical delta migrations would be
wrong. This explicit deploy step baselines that schema once; future deploys
run normal Alembic upgrades only.
"""

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text

import app.models  # noqa: F401
from app.core.database import Base, engine


def _migration_heads() -> list[str]:
    config = Config("alembic.ini")
    return ScriptDirectory.from_config(config).get_heads()


def main() -> None:
    inspector = inspect(engine)
    if inspector.has_table("alembic_version"):
        print("Alembic version table exists; normal migration path applies.")
        return

    print("No Alembic version table found; creating a one-time schema baseline.")
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
