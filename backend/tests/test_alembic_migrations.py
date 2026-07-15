"""Static integrity tests for the deployed legacy Alembic history."""

import ast
from pathlib import Path

VERSIONS = Path(__file__).resolve().parents[1] / "app" / "alembic" / "versions"


def revision_contract(path: Path) -> tuple[str, object, set[str]]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    values = {}
    functions = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.add(node.name)
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for target in targets:
                if isinstance(target, ast.Name) and target.id in {"revision", "down_revision"}:
                    values[target.id] = ast.literal_eval(node.value)
    return values.get("revision"), values.get("down_revision"), functions


def test_migration_files_have_unique_revision_contracts():
    files = sorted(VERSIONS.glob("*.py"))
    assert files, "No Alembic migration files found"
    contracts = [revision_contract(path) for path in files]
    revisions = [revision for revision, _, _ in contracts]
    assert all(revisions), "Every migration must declare revision"
    assert len(revisions) == len(set(revisions)), "Duplicate Alembic revision IDs"
    for path, (_, _, functions) in zip(files, contracts):
        assert {"upgrade", "downgrade"}.issubset(functions), f"{path.name} lacks upgrade/downgrade"


def test_all_declared_parent_revisions_exist():
    contracts = [revision_contract(path) for path in sorted(VERSIONS.glob("*.py"))]
    known = {revision for revision, _, _ in contracts}
    for revision, parents, _ in contracts:
        if parents is None:
            continue
        if isinstance(parents, str):
            parents = (parents,)
        assert set(parents) <= known, f"{revision} references missing parent: {set(parents) - known}"
