"""add streak days column

Revision ID: 4d43538a95be
Revises: cb50ebc4efbf
Create Date: 2026-03-27 16:15:03.957367

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d43538a95be'
down_revision: Union[str, Sequence[str], None] = 'cb50ebc4efbf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Faqat kerakli ustunni qo'shamiz
    op.add_column('users', sa.Column('streak_days', sa.Integer(), server_default='0', nullable=True))

def downgrade() -> None:
    # Orqaga qaytish kerak bo'lib qolsa, ustunni o'chiramiz
    op.drop_column('users', 'streak_days')
