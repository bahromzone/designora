"""add_notification_columns

Revision ID: 8250541035bb
Revises: a1b2c3d4e5f6
Create Date: 2026-03-29 18:56:46.344170

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '8250541035bb'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── ASSIGNMENTS ──
    conn.execute(sa.text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS course_id  INTEGER"))
    conn.execute(sa.text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS title      VARCHAR"))
    conn.execute(sa.text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date   TIMESTAMPTZ"))
    conn.execute(sa.text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ"))

    # assignments.course_id → courses(id) FK
    _add_fk_if_missing(conn, 'assignments', 'course_id', 'courses', 'id')

    # ── CERTIFICATES ──
    conn.execute(sa.text("ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id  INTEGER"))
    conn.execute(sa.text("ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_at  TIMESTAMPTZ"))
    conn.execute(sa.text("ALTER TABLE certificates ADD COLUMN IF NOT EXISTS title      VARCHAR"))

    # certificates.course_id → courses(id) FK
    _add_fk_if_missing(conn, 'certificates', 'course_id', 'courses', 'id')

    # ── COURSES ──
    conn.execute(sa.text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR"))
    conn.execute(sa.text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id INTEGER"))

    # courses.instructor_id → users(id) FK
    _add_fk_if_missing(conn, 'courses', 'instructor_id', 'users', 'id')

    # ── TIMESTAMPS: TIMESTAMP → TIMESTAMPTZ ──
    for table, col in [
        ('password_resets', 'expires_at'),
        ('progress',        'last_activity'),
        ('progress',        'updated_at'),
        ('users',           'created_at'),
    ]:
        _safe_alter_to_timestamptz(conn, table, col)


def downgrade() -> None:
    pass  # Downgrade qo'lda amalga oshiriladi


# ── YORDAMCHI FUNKSIYALAR ──

def _add_fk_if_missing(conn, table, col, ref_table, ref_col):
    """FK allaqachon mavjud bo'lsa o'tkazib yuboradi."""
    result = conn.execute(sa.text("""
        SELECT COUNT(*) FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_name = kcu.table_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = :table
          AND kcu.column_name = :col
    """), {"table": table, "col": col})
    if result.scalar() == 0:
        conn.execute(sa.text(
            f"ALTER TABLE {table} ADD CONSTRAINT fk_{table}_{col} "
            f"FOREIGN KEY ({col}) REFERENCES {ref_table}({ref_col})"
        ))


def _safe_alter_to_timestamptz(conn, table, col):
    """Ustun mavjud bo'lsa TIMESTAMPTZ ga o'zgartiradi, yo'q bo'lsa o'tkazib yuboradi."""
    result = conn.execute(sa.text("""
        SELECT data_type FROM information_schema.columns
        WHERE table_name = :table AND column_name = :col
    """), {"table": table, "col": col})
    row = result.fetchone()
    if row and 'timestamp with time zone' not in row[0]:
        try:
            conn.execute(sa.text(
                f"ALTER TABLE {table} ALTER COLUMN {col} TYPE TIMESTAMPTZ "
                f"USING {col}::TIMESTAMPTZ"
            ))
        except Exception:
            pass  # Ba'zi hollarda type cast imkonsiz — o'tkazib yuborish