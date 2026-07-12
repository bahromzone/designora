import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
MIGRATION_DATABASE_URL = os.getenv("MIGRATION_TEST_DATABASE_URL")


def alembic_config() -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "app/alembic"))
    if MIGRATION_DATABASE_URL:
        config.set_main_option(
            "sqlalchemy.url", MIGRATION_DATABASE_URL.replace("%", "%%")
        )
    return config


def current_revision(database_url: str) -> str | None:
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            return MigrationContext.configure(connection).get_current_revision()
    finally:
        engine.dispose()


def test_revision_graph_has_one_base_and_one_head() -> None:
    script = ScriptDirectory.from_config(alembic_config())

    assert len(script.get_bases()) == 1, "Migration graph must have exactly one base"
    assert len(script.get_heads()) == 1, "Migration graph must have exactly one head"


@pytest.mark.skipif(
    not MIGRATION_DATABASE_URL,
    reason="MIGRATION_TEST_DATABASE_URL is required for migration lifecycle tests",
)
def test_upgrade_downgrade_and_reupgrade_on_postgresql() -> None:
    assert MIGRATION_DATABASE_URL is not None
    config = alembic_config()
    script = ScriptDirectory.from_config(config)
    head = script.get_current_head()
    engine = create_engine(MIGRATION_DATABASE_URL)

    try:
        with engine.begin() as connection:
            connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))

        command.upgrade(config, "head")
        assert current_revision(MIGRATION_DATABASE_URL) == head

        tables = set(inspect(engine).get_table_names())
        assert "users" in tables
        assert "alembic_version" in tables
        assert len(tables) >= 10, "Head migration created suspiciously few tables"

        command.downgrade(config, "base")
        assert current_revision(MIGRATION_DATABASE_URL) is None
        assert "users" not in set(inspect(engine).get_table_names())

        command.upgrade(config, "head")
        assert current_revision(MIGRATION_DATABASE_URL) == head
        assert "users" in set(inspect(engine).get_table_names())
    finally:
        engine.dispose()
