"""Alembic revision graph integrity tests."""

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_alembic_revision_graph_loads_with_heads_and_base():
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "app" / "alembic"))
    script = ScriptDirectory.from_config(config)

    assert script.get_heads(), "Alembic graph has no head"
    assert script.get_bases(), "Alembic graph has no base"
    assert list(script.walk_revisions()), "Alembic graph has no revisions"
