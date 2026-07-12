"""Alembic revision graph integrity tests.

The first legacy revision predates the complete LMS schema, so replaying the whole
history on an empty database is intentionally not claimed here. These tests prevent
new broken, duplicate, orphaned, or non-reversible revision contracts from merging.
"""

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

BACKEND_DIR = Path(__file__).resolve().parents[1]


def alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "app" / "alembic"))
    return config


def test_revision_graph_is_resolvable_and_unique():
    script = ScriptDirectory.from_config(alembic_config())
    revisions = list(script.walk_revisions())
    revision_ids = [item.revision for item in revisions]

    assert revisions, "No Alembic revisions found"
    assert script.get_heads(), "Alembic graph has no head revision"
    assert len(revision_ids) == len(set(revision_ids)), "Duplicate Alembic revision IDs"


def test_every_revision_has_upgrade_and_downgrade_contracts():
    script = ScriptDirectory.from_config(alembic_config())
    for item in script.walk_revisions():
        assert callable(item.module.upgrade), f"{item.revision} has no upgrade()"
        assert callable(item.module.downgrade), f"{item.revision} has no downgrade()"


def test_all_parent_revisions_resolve():
    script = ScriptDirectory.from_config(alembic_config())
    known = {item.revision for item in script.walk_revisions()}
    for item in script.walk_revisions():
        parents = item.down_revision
        if parents is None:
            continue
        if isinstance(parents, str):
            parents = (parents,)
        missing = set(parents) - known
        assert not missing, f"{item.revision} references missing parents: {missing}"
