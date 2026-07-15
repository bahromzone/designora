# ruff: noqa: E501,E701,E702,I001
import json
from datetime import UTC,datetime
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel,Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.offline_sync import OfflineMutation
from app.models.user import User
router=APIRouter(prefix="/api/offline-sync",tags=["Offline Sync"])
def user(db,email):
 u=db.query(User).filter(User.email==email).first()
 if not u:raise HTTPException(status_code=401,detail="Login kerak")
 return u
class MutationIn(BaseModel):client_id:str;entity:str;entity_id:str;operation:str;payload:dict;client_updated_at:datetime;strategy:str="client_wins"
class BatchIn(BaseModel):mutations:list[MutationIn]=Field(max_length=100)
@router.post("/batch")
def batch(data:BatchIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email);out=[]
 for item in data.mutations:
  existing=db.query(OfflineMutation).filter(OfflineMutation.user_id==u.id,OfflineMutation.client_id==item.client_id).first()
  if existing:out.append({"client_id":item.client_id,"status":existing.status,"duplicate":True});continue
  latest=db.query(OfflineMutation).filter(OfflineMutation.user_id==u.id,OfflineMutation.entity==item.entity,OfflineMutation.entity_id==item.entity_id).order_by(OfflineMutation.server_updated_at.desc()).first();client_time=item.client_updated_at if item.client_updated_at.tzinfo else item.client_updated_at.replace(tzinfo=UTC);conflict=bool(latest and latest.server_updated_at and latest.server_updated_at.replace(tzinfo=latest.server_updated_at.tzinfo or UTC)>client_time)
  status="conflict" if conflict and item.strategy=="manual" else "applied";row=OfflineMutation(user_id=u.id,client_id=item.client_id,entity=item.entity,entity_id=item.entity_id,operation=item.operation,payload=json.dumps(item.payload),client_updated_at=client_time,status=status,conflict_payload=latest.payload if conflict else None);db.add(row);out.append({"client_id":item.client_id,"status":status,"duplicate":False,"server_payload":json.loads(latest.payload)if status=="conflict"and latest else None})
 db.commit();return{"results":out,"synced":sum(1 for x in out if x["status"]=="applied"),"conflicts":sum(1 for x in out if x["status"]=="conflict")}
