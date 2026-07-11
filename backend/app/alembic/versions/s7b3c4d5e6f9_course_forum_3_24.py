"""course forum 3.24
Revision ID: s7b3c4d5e6f9
Revises: r6a2b3c4d5e8
"""
from typing import Sequence,Union
import sqlalchemy as sa
from alembic import op
revision="s7b3c4d5e6f9";down_revision:Union[str,Sequence[str],None]="r6a2b3c4d5e8";branch_labels=None;depends_on=None
def upgrade():
 op.add_column("forum_threads",sa.Column("lesson_id",sa.Integer(),sa.ForeignKey("lessons.id",ondelete="SET NULL")))
 op.add_column("forum_threads",sa.Column("accepted_post_id",sa.Integer()))
 op.add_column("forum_posts",sa.Column("is_instructor",sa.Boolean(),server_default=sa.false()))
 op.add_column("forum_posts",sa.Column("mentions",sa.Text()))
 op.create_table("forum_reports",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("reporter_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("thread_id",sa.Integer(),sa.ForeignKey("forum_threads.id",ondelete="CASCADE")),sa.Column("post_id",sa.Integer(),sa.ForeignKey("forum_posts.id",ondelete="CASCADE")),sa.Column("reason",sa.String(),nullable=False),sa.Column("details",sa.Text()),sa.Column("status",sa.String(),server_default="open"),sa.Column("moderator_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="SET NULL")),sa.Column("resolution",sa.Text()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
def downgrade():
 op.drop_table("forum_reports");op.drop_column("forum_posts","mentions");op.drop_column("forum_posts","is_instructor");op.drop_column("forum_threads","accepted_post_id");op.drop_column("forum_threads","lesson_id")
