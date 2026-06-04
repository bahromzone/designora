"""add last_login_date column

Revision ID: c3deada45f15
Revises: 4d43538a95be
Create Date: 2026-03-27 16:19:31.350586

"""
from typing import Sequence, Union
from sqlalchemy.dialects import postgresql
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3deada45f15'
down_revision: Union[str, Sequence[str], None] = '4d43538a95be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # last_login_date ustunini qo'shamiz
    op.add_column('users', sa.Column('last_login_date', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    # Orqaga qaytish uchun
    op.drop_column('users', 'last_login_date')