"""instructor: users jadvaliga ariza maydonlari

Revision ID: j8e4f5a6b7c0
Revises: i7d3e4f5a6b9
Create Date: 2026-07-10 08:20:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "j8e4f5a6b7c0"
down_revision: Union[str, Sequence[str], None] = "i7d3e4f5a6b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """O'qituvchi bo'lish arizasi uchun ustunlar."""
    op.add_column(
        "users",
        sa.Column(
            "instructor_status",
            sa.String(),
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column("users", sa.Column("instructor_bio", sa.String(), nullable=True))
    op.add_column(
        "users", sa.Column("instructor_expertise", sa.String(), nullable=True)
    )
    op.add_column(
        "users", sa.Column("instructor_portfolio", sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("users", "instructor_portfolio")
    op.drop_column("users", "instructor_expertise")
    op.drop_column("users", "instructor_bio")
    op.drop_column("users", "instructor_status")
