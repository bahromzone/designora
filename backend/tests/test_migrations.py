import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text

import app.models  # noqa: F401
from app.core.database import Base

BACKEND_ROOT = Path(__file__).resolve().parents[1]
MIGRATION_DATABASE_URL = os.getenv("MIGRATION_TEST_DATABASE_URL")


def alembic_config() -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "app/alembic"))
    if MIGRATION_DATABASE_URL:
        escaped_url = MIGRATION_DATABASE_URL.replace("%", "%%")
        config.set_main_option("sqlalchemy.url", escaped_url)
    return config


def current_revision(database_url: str) -> str | None:
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            return context.get_current_revision()
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
def test_latest_revision_can_downgrade_and_upgrade_on_postgresql() -> None:
    assert MIGRATION_DATABASE_URL is not None
    config = alembic_config()
    script = ScriptDirectory.from_config(config)
    head = script.get_current_head()
    head_revision = script.get_revision(head)
    previous_revision = head_revision.down_revision
    engine = create_engine(MIGRATION_DATABASE_URL)

    try:
        with engine.begin() as connection:
            connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))
        Base.metadata.create_all(engine)
        command.stamp(config, "head")

        assert current_revision(MIGRATION_DATABASE_URL) == head
        assert "users" in set(inspect(engine).get_table_names())

        command.downgrade(config, "-1")
        assert current_revision(MIGRATION_DATABASE_URL) == previous_revision

        command.upgrade(config, "head")
        assert current_revision(MIGRATION_DATABASE_URL) == head
        user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
        assert "onboarding_completed" in user_columns
    finally:
        engine.dispose()
