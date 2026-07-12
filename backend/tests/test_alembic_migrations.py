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


def current_revisions(database_url: str) -> set[str]:
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            return set(context.get_current_heads())
    finally:
        engine.dispose()


def test_revision_graph_is_resolvable():
    script = ScriptDirectory.from_config(alembic_config())
    heads = set(script.get_heads())
    assert heads, "Alembic graph has no head revision"
    for head in heads:
        assert script.get_revision(head) is not None


def test_fresh_database_upgrade_downgrade_and_reupgrade():
    config = alembic_config()
    database_url = os.environ["DATABASE_URL"]
    expected_heads = set(ScriptDirectory.from_config(config).get_heads())

    command.upgrade(config, "heads")
    assert current_revisions(database_url) == expected_heads

    engine = create_engine(database_url)
    try:
        tables = set(inspect(engine).get_table_names())
    finally:
        engine.dispose()
    assert {"users", "courses", "alembic_version"}.issubset(tables)

    command.downgrade(config, "base")
    assert current_revisions(database_url) == set()

    command.upgrade(config, "heads")
    assert current_revisions(database_url) == expected_heads
