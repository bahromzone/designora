"""restore the migration revision present in existing databases

The local PostgreSQL database already records this revision in
alembic_version, but the source file was missing from the repository. Keep
this compatibility migration intentionally empty: schema changes belong to
the following audit-log migration.
"""

from typing import Sequence, Union

revision: str = "d9ba40825d72"
down_revision: Union[str, Sequence[str], None] = "s7b3c4d5e6f9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
