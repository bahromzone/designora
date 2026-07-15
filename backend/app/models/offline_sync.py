from datetime import UTC, datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from app.core.database import Base

def now(): return datetime.now(UTC)
class OfflineMutation(Base):
 __tablename__="offline_mutations";__table_args__=(UniqueConstraint("user_id","client_id",name="uq_offline_mutation_client"),);id=Column(Integer,primary_key=True);user_id=Column(Integer,ForeignKey("users.id",ondelete="CASCADE"),nullable=False);client_id=Column(String,nullable=False);entity=Column(String,nullable=False);entity_id=Column(String,nullable=False);operation=Column(String,nullable=False);payload=Column(Text,nullable=False);client_updated_at=Column(DateTime(timezone=True),nullable=False);server_updated_at=Column(DateTime(timezone=True),default=now,onupdate=now);status=Column(String,default="applied");conflict_payload=Column(Text)
