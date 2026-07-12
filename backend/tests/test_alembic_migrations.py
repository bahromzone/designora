"""Production database migration contract tests."""

import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect

BACKEND_DIR = Path(__file__).resolve().parents[1]


def alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "app" / "alembic"))
    config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"].replace("%", "%%"))
    return config


def current_revision(database_url: str) -> str | None:
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            return MigrationContext.configure(connection).get_current_revision()
    finally:
        engine.dispose()


def test_revision_graph_has_exactly_one_head():
    script = ScriptDirectory.from_config(alembic_config())
    heads = script.get_heads()
    assert len(heads) == 1, f"Alembic graph must have one head, found: {heads}"


def test_fresh_database_upgrade_downgrade_and_reupgrade():
    config = alembic_config()
    database_url = os.environ["DATABASE_URL"]
    script = ScriptDirectory.from_config(config)
    head = script.get_current_head()

    command.upgrade(config, "head")
    assert current_revision(database_url) == head

    engine = create_engine(database_url)
    try:
        tables = set(inspect(engine).get_table_names())
    finally:
        engine.dispose()
    assert {"users", "courses", "alembic_version"}.issubset(tables)

    command.downgrade(config, "base")
    assert current_revision(database_url) is None

    command.upgrade(config, "head")
    assert current_revision(database_url) == head
