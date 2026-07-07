"""bosqich-4: discovery + community — reviews, blog, forum, referrals

Revision ID: g5b1c2d3e4f7
Revises: f3a9c1b2d4e6
Create Date: 2026-07-07 10:20:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "g5b1c2d3e4f7"
down_revision: Union[str, Sequence[str], None] = "f3a9c1b2d4e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """BOSQICH 4 jadvallari + users ustunlari."""
    # ── reviews ──
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "course_id",
            sa.Integer,
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "course_id", name="uq_review_user_course"),
    )

    # ── blog_posts ──
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("slug", sa.String, nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("excerpt", sa.String, nullable=True),
        sa.Column("body", sa.Text, server_default=""),
        sa.Column("cover_image_url", sa.String, nullable=True),
        sa.Column(
            "author_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("tags", sa.String, nullable=True),
        sa.Column("meta_title", sa.String, nullable=True),
        sa.Column("meta_description", sa.String, nullable=True),
        sa.Column("is_published", sa.Boolean, server_default=sa.false()),
        sa.Column("views", sa.Integer, server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"], unique=True)

    # ── forum_threads ──
    op.create_table(
        "forum_threads",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "course_id",
            sa.Integer,
            sa.ForeignKey("courses.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("body", sa.Text, server_default=""),
        sa.Column("category", sa.String, server_default="umumiy"),
        sa.Column("is_pinned", sa.Boolean, server_default=sa.false()),
        sa.Column("is_locked", sa.Boolean, server_default=sa.false()),
        sa.Column("views", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── forum_posts ──
    op.create_table(
        "forum_posts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "thread_id",
            sa.Integer,
            sa.ForeignKey("forum_threads.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── referrals ──
    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "referrer_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "referred_user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("code", sa.String, nullable=False),
        sa.Column("status", sa.String, server_default="pending"),
        sa.Column("reward_points", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("referred_user_id", name="uq_referral_referred_user"),
    )
    op.create_index("ix_referrals_code", "referrals", ["code"])

    # ── users: referral ustunlari ──
    op.add_column("users", sa.Column("referral_code", sa.String, nullable=True))
    op.add_column("users", sa.Column("referred_by_id", sa.Integer, nullable=True))
    op.create_index(
        "ix_users_referral_code", "users", ["referral_code"], unique=True
    )


def downgrade() -> None:
    """BOSQICH 4 o'zgarishlarini bekor qiladi."""
    op.drop_index("ix_users_referral_code", table_name="users")
    op.drop_column("users", "referred_by_id")
    op.drop_column("users", "referral_code")

    op.drop_index("ix_referrals_code", table_name="referrals")
    op.drop_table("referrals")
    op.drop_table("forum_posts")
    op.drop_table("forum_threads")
    op.drop_index("ix_blog_posts_slug", table_name="blog_posts")
    op.drop_table("blog_posts")
    op.drop_table("reviews")
