import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine

BACKEND_DIR = Path(__file__).resolve().parents[1]
HEAD = "20260712_01"


def config() -> Config:
    cfg = Config(str(BACKEND_DIR / "alembic-canonical.ini"))
    cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"].replace("%", "%%"))
    return cfg


def revision(database_url: str) -> str | None:
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            return MigrationContext.configure(connection).get_current_revision()
    finally:
        engine.dispose()


def test_fresh_postgres_upgrade_downgrade_reupgrade():
    cfg = config()
    database_url = os.environ["DATABASE_URL"]

    command.upgrade(cfg, "head")
    assert revision(database_url) == HEAD

    command.downgrade(cfg, "base")
    assert revision(database_url) is None

    command.upgrade(cfg, "head")
    assert revision(database_url) == HEAD
