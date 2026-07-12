"""offline sync 3.27
Revision ID: u9d5e6f7a8b1
Revises: t8c4d5e6f7a0
"""
from typing import Sequence,Union
import sqlalchemy as sa
from alembic import op
revision="u9d5e6f7a8b1";down_revision:Union[str,Sequence[str],None]="t8c4d5e6f7a0";branch_labels=None;depends_on=None
def upgrade():op.create_table("offline_mutations",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("client_id",sa.String(),nullable=False),sa.Column("entity",sa.String(),nullable=False),sa.Column("entity_id",sa.String(),nullable=False),sa.Column("operation",sa.String(),nullable=False),sa.Column("payload",sa.Text(),nullable=False),sa.Column("client_updated_at",sa.DateTime(timezone=True),nullable=False),sa.Column("server_updated_at",sa.DateTime(timezone=True),server_default=sa.func.now()),sa.Column("status",sa.String(),server_default="applied"),sa.Column("conflict_payload",sa.Text()),sa.UniqueConstraint("user_id","client_id",name="uq_offline_mutation_client"))
def downgrade():op.drop_table("offline_mutations")
