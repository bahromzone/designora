# ruff: noqa: E501,E701,E702
from datetime import UTC,datetime
from app.core.security import create_access_token
from app.models.user import User
def test_offline_batch_idempotent(client,db_session):
 u=User(email="offline327@example.com",name="Offline");db_session.add(u);db_session.commit();h={"Authorization":f"Bearer {create_access_token(u.email)}"};body={"mutations":[{"client_id":"m1","entity":"note","entity_id":"lesson-1","operation":"upsert","payload":{"body":"cached note"},"client_updated_at":datetime.now(UTC).isoformat()}]};first=client.post("/api/offline-sync/batch",headers=h,json=body);second=client.post("/api/offline-sync/batch",headers=h,json=body);assert first.json()["synced"]==1;assert second.json()["results"][0]["duplicate"]is True
