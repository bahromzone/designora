"""calendar events
Revision ID: l0a6b7c8d9e2
Revises: k9f5a6b7c8d1
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
revision: str = "l0a6b7c8d9e2"
down_revision: Union[str, Sequence[str], None] = "k9f5a6b7c8d1"
branch_labels = None
depends_on = None
def upgrade() -> None:
 op.create_table("calendar_events",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("title",sa.String(length=180),nullable=False),sa.Column("event_type",sa.String(length=40),nullable=False),sa.Column("starts_at",sa.DateTime(timezone=True),nullable=False),sa.Column("ends_at",sa.DateTime(timezone=True)),sa.Column("course_id",sa.Integer(),sa.ForeignKey("courses.id",ondelete="SET NULL")),sa.Column("link",sa.String(length=500)),sa.Column("description",sa.Text()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
 op.create_index("ix_calendar_events_user_id","calendar_events",["user_id"]);op.create_index("ix_calendar_events_event_type","calendar_events",["event_type"]);op.create_index("ix_calendar_events_starts_at","calendar_events",["starts_at"])
def downgrade() -> None:
 op.drop_index("ix_calendar_events_starts_at",table_name="calendar_events");op.drop_index("ix_calendar_events_event_type",table_name="calendar_events");op.drop_index("ix_calendar_events_user_id",table_name="calendar_events");op.drop_table("calendar_events")
