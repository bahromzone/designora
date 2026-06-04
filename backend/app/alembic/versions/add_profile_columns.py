"""add profile columns to users table

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-03-28

Bu migration users jadvaliga quyidagi ustunlarni qo'shadi:
  - bio
  - phone
  - location
  - website
  - avatar_url
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'a1b2c3d4e5f6'
down_revision = 'c3deada45f15'   # ← oxirgi migration ID sini shu yerga yozing
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Har bir ustun mavjud bo'lmasa qo'shadi (xavfsiz)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]

    if 'bio' not in existing_cols:
        op.add_column('users', sa.Column('bio', sa.String(), nullable=True))

    if 'phone' not in existing_cols:
        op.add_column('users', sa.Column('phone', sa.String(), nullable=True))

    if 'location' not in existing_cols:
        op.add_column('users', sa.Column('location', sa.String(), nullable=True))

    if 'website' not in existing_cols:
        op.add_column('users', sa.Column('website', sa.String(), nullable=True))

    if 'avatar_url' not in existing_cols:
        op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'website')
    op.drop_column('users', 'location')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'bio')