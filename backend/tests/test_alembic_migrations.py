"""Alembic graph and PostgreSQL schema integrity tests.

The repository contains a legacy, production-stamped migration history whose first
revision predates the complete LMS schema. We therefore protect the revision graph
and current model schema without rewriting already-deployed historical revisions.
"""

import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect

from app.core.database import Base
import app.models  # noqa: F401

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
            return set(MigrationContext.configure(connection).get_current_heads())
    finally:
        engine.dispose()


def test_revision_graph_and_contracts_are_valid():
    script = ScriptDirectory.from_config(alembic_config())
    heads = set(script.get_heads())
    assert heads, "Alembic graph has no head revision"

    revisions = list(script.walk_revisions())
    revision_ids = [item.revision for item in revisions]
    assert len(revision_ids) == len(set(revision_ids)), "Duplicate Alembic revision IDs"
    for item in revisions:
        assert callable(item.module.upgrade), f"{item.revision} has no upgrade()"
        assert callable(item.module.downgrade), f"{item.revision} has no downgrade()"


def test_current_schema_and_revision_stamps_on_postgres():
    config = alembic_config()
    database_url = os.environ["DATABASE_URL"]
    expected_heads = set(ScriptDirectory.from_config(config).get_heads())
    engine = create_engine(database_url)
    try:
        Base.metadata.create_all(engine)
        tables = set(inspect(engine).get_table_names())
        assert {"users", "courses", "lessons", "assignments", "certificates"}.issubset(tables)

        command.stamp(config, "heads")
        assert current_revisions(database_url) == expected_heads
        command.stamp(config, "base", purge=True)
        assert current_revisions(database_url) == set()
        command.stamp(config, "heads")
        assert current_revisions(database_url) == expected_heads
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()
