# ruff: noqa: E701,E702,E712,I001
# fmt: off
"""In-app notifications and roadmap 3.15 reminder preferences."""
from datetime import UTC, datetime
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.models.reminder_preference import PushSubscription, ReminderPreference
from app.models.user import User
router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
def _get_user(db,email):
 user=db.query(User).filter(User.email==email).first()
 if not user: raise HTTPException(status_code=401,detail="Avtorizatsiya talab etiladi")
 return user
def _preference(db,user_id):
 row=db.query(ReminderPreference).filter(ReminderPreference.user_id==user_id).first()
 if not row:
  row=ReminderPreference(user_id=user_id);db.add(row);db.commit();db.refresh(row)
 return row
def _notification_dict(row): return {"id":row.id,"message":row.message,"type":row.type,"link":row.link,"is_read":row.is_read,"created_at":row.created_at.isoformat() if row.created_at else None}
def _preference_dict(row,subscriptions=0): return {key:getattr(row,key) for key in ("email_enabled","in_app_enabled","push_enabled","lesson_reminders","deadline_reminders","review_reminders","marketing_enabled","frequency","quiet_start","quiet_end","timezone")}|{"push_subscriptions":subscriptions}
class PreferencePatch(BaseModel):
 email_enabled:bool|None=None;in_app_enabled:bool|None=None;push_enabled:bool|None=None;lesson_reminders:bool|None=None;deadline_reminders:bool|None=None;review_reminders:bool|None=None;marketing_enabled:bool|None=None
 frequency:Literal["instant","daily","weekly"]|None=None
 quiet_start:str|None=Field(default=None,pattern=r"^([01]\d|2[0-3]):[0-5]\d$");quiet_end:str|None=Field(default=None,pattern=r"^([01]\d|2[0-3]):[0-5]\d$");timezone:str|None=Field(default=None,max_length=80)
 @field_validator("timezone")
 @classmethod
 def valid_timezone(cls,value):
  if value:
   try: ZoneInfo(value)
   except ZoneInfoNotFoundError as error: raise ValueError("Noto‘g‘ri timezone") from error
  return value
class PushSubscriptionIn(BaseModel):
 endpoint:str=Field(min_length=10,max_length=1000);p256dh:str|None=Field(default=None,max_length=300);auth:str|None=Field(default=None,max_length=300)
@router.get("")
def list_notifications(only_unread:bool=False,limit:int=Query(50,ge=1,le=100),email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);query=db.query(Notification).filter(Notification.user_id==user.id)
 if only_unread: query=query.filter(Notification.is_read==False)
 return [_notification_dict(row) for row in query.order_by(Notification.is_read.asc(),Notification.created_at.desc()).limit(limit).all()]
@router.get("/unread-count")
def unread_count(email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);return {"unread":db.query(Notification).filter(Notification.user_id==user.id,Notification.is_read==False).count()}
@router.get("/preferences")
def get_preferences(email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);count=db.query(PushSubscription).filter(PushSubscription.user_id==user.id).count();return _preference_dict(_preference(db,user.id),count)
@router.patch("/preferences")
def update_preferences(data:PreferencePatch,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);row=_preference(db,user.id)
 for key,value in data.model_dump(exclude_unset=True).items(): setattr(row,key,value)
 row.updated_at=datetime.now(UTC);db.commit();return _preference_dict(row,db.query(PushSubscription).filter(PushSubscription.user_id==user.id).count())
@router.post("/push-subscriptions",status_code=201)
def subscribe_push(data:PushSubscriptionIn,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);row=db.query(PushSubscription).filter(PushSubscription.endpoint==data.endpoint).first()
 if not row: row=PushSubscription(user_id=user.id,**data.model_dump());db.add(row)
 else: row.user_id,row.p256dh,row.auth=user.id,data.p256dh,data.auth
 _preference(db,user.id).push_enabled=True;db.commit();return {"message":"Browser push yoqildi","id":row.id}
@router.delete("/push-subscriptions")
def unsubscribe_push(endpoint:str,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);removed=db.query(PushSubscription).filter(PushSubscription.user_id==user.id,PushSubscription.endpoint==endpoint).delete()
 if db.query(PushSubscription).filter(PushSubscription.user_id==user.id).count()==0: _preference(db,user.id).push_enabled=False
 db.commit();return {"removed":removed}
@router.post("/preferences/test")
def test_reminder(email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);preference=_preference(db,user.id);current=datetime.now(ZoneInfo(preference.timezone)).strftime("%H:%M")
 quiet=(preference.quiet_start<=current or current<preference.quiet_end) if preference.quiet_start>preference.quiet_end else preference.quiet_start<=current<preference.quiet_end;channels=[]
 if not quiet:
  if preference.in_app_enabled: db.add(Notification(user_id=user.id,message="Test reminder muvaffaqiyatli ishladi",type="reminder",link="/calendar"));channels.append("in_app")
  if preference.email_enabled: channels.append("email")
  if preference.push_enabled and db.query(PushSubscription).filter(PushSubscription.user_id==user.id).count(): channels.append("push")
  db.commit()
 return {"quiet_hours":quiet,"channels":channels,"frequency":preference.frequency}
@router.post("/{notification_id}/read")
def mark_read(notification_id:int,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);row=db.query(Notification).filter(Notification.id==notification_id,Notification.user_id==user.id).first()
 if not row: raise HTTPException(status_code=404,detail="Bildirishnoma topilmadi")
 row.is_read=True;db.commit();return {"message":"O'qilgan deb belgilandi","id":row.id}
@router.post("/read-all")
def mark_all_read(email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);updated=db.query(Notification).filter(Notification.user_id==user.id,Notification.is_read==False).update({Notification.is_read:True});db.commit();return {"message":"Barchasi o'qilgan deb belgilandi","updated":updated}
@router.delete("/{notification_id}")
def delete_notification(notification_id:int,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_get_user(db,email);row=db.query(Notification).filter(Notification.id==notification_id,Notification.user_id==user.id).first()
 if not row: raise HTTPException(status_code=404,detail="Bildirishnoma topilmadi")
 db.delete(row);db.commit();return {"message":"O'chirildi","id":notification_id}
# fmt: on
