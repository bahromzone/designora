"""bosqich-3: learning quality — quiz, qa, notes, badges, submissions, certificates

Revision ID: f3a9c1b2d4e6
Revises: 36d8c7d581aa
Create Date: 2026-07-06 20:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f3a9c1b2d4e6"
down_revision: Union[str, Sequence[str], None] = "36d8c7d581aa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """BOSQICH 3 jadvallari + ustunlari."""
    # ── quizzes ──
    op.create_table(
        "quizzes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lesson_id", sa.Integer, sa.ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("passing_score", sa.Integer, server_default="70"),
        sa.Column("max_attempts", sa.Integer, nullable=True),
        sa.Column("time_limit_minutes", sa.Integer, nullable=True),
        sa.Column("is_active", sa.Boolean, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── quiz_questions ──
    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("quiz_id", sa.Integer, sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("type", sa.String, server_default="single"),
        sa.Column("options", sa.JSON, nullable=True),
        sa.Column("correct_answers", sa.JSON, nullable=True),
        sa.Column("points", sa.Integer, server_default="1"),
        sa.Column("order", sa.Integer, server_default="0"),
        sa.Column("explanation", sa.Text, nullable=True),
    )

    # ── quiz_attempts ──
    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("quiz_id", sa.Integer, sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("attempt_number", sa.Integer, server_default="1"),
        sa.Column("score", sa.Float, server_default="0"),
        sa.Column("earned_points", sa.Integer, server_default="0"),
        sa.Column("total_points", sa.Integer, server_default="0"),
        sa.Column("passed", sa.Boolean, server_default=sa.false()),
        sa.Column("answers", sa.JSON, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── lesson_questions (Q&A) ──
    op.create_table(
        "lesson_questions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("lesson_id", sa.Integer, sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("is_resolved", sa.Boolean, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── lesson_answers ──
    op.create_table(
        "lesson_answers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("question_id", sa.Integer, sa.ForeignKey("lesson_questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("is_instructor", sa.Boolean, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── lesson_notes ──
    op.create_table(
        "lesson_notes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("lesson_id", sa.Integer, sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("timestamp_seconds", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── badges ──
    op.create_table(
        "badges",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String, nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String, nullable=True),
        sa.Column("points", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_badges_code", "badges", ["code"], unique=True)

    # ── user_badges ──
    op.create_table(
        "user_badges",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("badge_id", sa.Integer, sa.ForeignKey("badges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    # ── assignment_submissions ──
    op.create_table(
        "assignment_submissions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("assignment_id", sa.Integer, sa.ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("file_url", sa.String, nullable=True),
        sa.Column("status", sa.String, server_default="submitted"),
        sa.Column("grade", sa.Integer, nullable=True),
        sa.Column("feedback", sa.Text, nullable=True),
        sa.Column("graded_by", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("graded_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── assignments: yangi ustunlar ──
    op.add_column("assignments", sa.Column("lesson_id", sa.Integer, sa.ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True))
    op.add_column("assignments", sa.Column("description", sa.Text, nullable=True))
    op.add_column("assignments", sa.Column("max_score", sa.Integer, server_default="100"))

    # ── certificates: verifikatsiya + PDF ──
    op.add_column("certificates", sa.Column("serial", sa.String, nullable=True))
    op.add_column("certificates", sa.Column("verification_code", sa.String, nullable=True))
    op.add_column("certificates", sa.Column("pdf_url", sa.String, nullable=True))
    op.add_column("certificates", sa.Column("grade", sa.String, nullable=True))
    op.create_index("ix_certificates_verification_code", "certificates", ["verification_code"], unique=True)
    op.create_index("ix_certificates_serial", "certificates", ["serial"], unique=True)


def downgrade() -> None:
    """BOSQICH 3 o'zgarishlarini bekor qiladi."""
    op.drop_index("ix_certificates_serial", table_name="certificates")
    op.drop_index("ix_certificates_verification_code", table_name="certificates")
    op.drop_column("certificates", "grade")
    op.drop_column("certificates", "pdf_url")
    op.drop_column("certificates", "verification_code")
    op.drop_column("certificates", "serial")

    op.drop_column("assignments", "max_score")
    op.drop_column("assignments", "description")
    op.drop_column("assignments", "lesson_id")

    op.drop_table("assignment_submissions")
    op.drop_table("user_badges")
    op.drop_index("ix_badges_code", table_name="badges")
    op.drop_table("badges")
    op.drop_table("lesson_notes")
    op.drop_table("lesson_answers")
    op.drop_table("lesson_questions")
    op.drop_table("quiz_attempts")
    op.drop_table("quiz_questions")
    op.drop_table("quizzes")
