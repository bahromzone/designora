from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect

BACKEND_DIR = Path(__file__).resolve().parents[1]


def config() -> Config:
    return Config(str(BACKEND_DIR / "alembic-canonical.ini"))


def revision(engine) -> str | None:
    with engine.connect() as connection:
        return MigrationContext.configure(connection).get_current_revision()


def test_fresh_postgres_upgrade_downgrade_reupgrade():
    cfg = config()
    engine = create_engine(cfg.get_main_option("sqlalchemy.url"))
    try:
        command.upgrade(cfg, "head")
        assert revision(engine) == "20260712_01"
        tables = set(inspect(engine).get_table_names())
        assert {"users", "courses", "lessons", "assignments", "certificates"} <= tables

        command.downgrade(cfg, "base")
        assert revision(engine) is None
        assert "users" not in set(inspect(engine).get_table_names())

        command.upgrade(cfg, "head")
        assert revision(engine) == "20260712_01"
    finally:
        engine.dispose()
