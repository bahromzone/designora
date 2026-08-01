"""Prepare the one-time Alembic cutover for Designora's legacy schema.

Before Alembic was wired into the container, the application created tables
from SQLAlchemy metadata at startup. A database from that era has no
alembic_version table, so replaying the historical delta migrations would be
wrong. This explicit deploy step baselines that schema once; future deploys
run normal Alembic upgrades only.
"""

import subprocess

from sqlalchemy import inspect

import app.models  # noqa: F401
from app.core.database import Base, engine


def main() -> None:
    inspector = inspect(engine)
    if inspector.has_table("alembic_version"):
        print("Alembic version table exists; normal migration path applies.")
        return

    print("No Alembic version table found; creating a one-time schema baseline.")
    Base.metadata.create_all(bind=engine)
    subprocess.run(["alembic", "stamp", "head"], check=True)
    print("Legacy schema baselined at Alembic head.")


if __name__ == "__main__":
    main()
