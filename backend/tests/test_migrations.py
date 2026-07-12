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
CURRENT_REVISION = "x2b8c9d0e1f4"


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


def test_revision_graph_resolves_current_revision() -> None:
    script = ScriptDirectory.from_config(alembic_config())
    revision = script.get_revision(CURRENT_REVISION)

    assert revision is not None
    assert revision.down_revision is not None
    assert list(script.walk_revisions())


@pytest.mark.skipif(
    not MIGRATION_DATABASE_URL,
    reason="MIGRATION_TEST_DATABASE_URL is required for migration lifecycle tests",
)
def test_latest_revision_can_downgrade_and_upgrade_on_postgresql() -> None:
    assert MIGRATION_DATABASE_URL is not None
    config = alembic_config()
    script = ScriptDirectory.from_config(config)
    previous_revision = script.get_revision(CURRENT_REVISION).down_revision
    engine = create_engine(MIGRATION_DATABASE_URL)

    try:
        with engine.begin() as connection:
            connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))
            connection.execute(
                text(
                    """
                    CREATE TABLE users (
                        id SERIAL PRIMARY KEY,
                        onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
                        learning_goal VARCHAR(30),
                        experience_level VARCHAR(30),
                        learning_interests JSON,
                        weekly_learning_hours INTEGER,
                        preferred_language VARCHAR(10) DEFAULT 'uz',
                        reminder_time VARCHAR(5)
                    )
                    """
                )
            )

        command.stamp(config, CURRENT_REVISION)
        assert current_revision(MIGRATION_DATABASE_URL) == CURRENT_REVISION

        command.downgrade(config, "-1")
        assert current_revision(MIGRATION_DATABASE_URL) == previous_revision
        downgraded_columns = {
            column["name"] for column in inspect(engine).get_columns("users")
        }
        assert "onboarding_completed" not in downgraded_columns

        command.upgrade(config, CURRENT_REVISION)
        assert current_revision(MIGRATION_DATABASE_URL) == CURRENT_REVISION
        upgraded_columns = {
            column["name"] for column in inspect(engine).get_columns("users")
        }
        assert "onboarding_completed" in upgraded_columns
        assert "preferred_language" in upgraded_columns
    finally:
        engine.dispose()
