# ruff: noqa: E701,E702
# fmt: off
"""Roadmap 3.14: timezone-aware day/week/month learning calendar."""
from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.assignment import Assignment
from app.models.calendar_event import CalendarEvent
from app.models.enrollment import Enrollment
from app.models.user import User
router=APIRouter(prefix="/api/calendar",tags=["Calendar"])
EVENT_TYPES={"assignment","live_session","learning_plan","instructor_review"}
def _user(db,email):
 user=db.query(User).filter(User.email==email).first()
 if not user: raise HTTPException(status_code=401,detail="Avtorizatsiya talab etiladi")
 return user
def _zone(value):
 try:return ZoneInfo(value)
 except ZoneInfoNotFoundError:raise HTTPException(status_code=400,detail="Timezone noto‘g‘ri")
def _utc(value):
 if value.tzinfo is None:return value.replace(tzinfo=UTC)
 return value.astimezone(UTC)
def _event(row,timezone):
 zone=_zone(timezone);start=_utc(row["starts_at"]).astimezone(zone);end=_utc(row["ends_at"]).astimezone(zone) if row.get("ends_at") else None
 return {**row,"starts_at":start.isoformat(),"ends_at":end.isoformat() if end else None,"timezone":timezone}
class EventIn(BaseModel):
 title:str=Field(min_length=2,max_length=180);event_type:str;starts_at:datetime;ends_at:datetime|None=None;course_id:int|None=None;link:str|None=Field(default=None,max_length=500);description:str|None=Field(default=None,max_length=3000)
@router.get("/events")
def events(start:datetime,end:datetime,timezone:str="UTC",event_type:str|None=None,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_user(db,email);_zone(timezone);start_utc,end_utc=_utc(start),_utc(end)
 if end_utc<=start_utc:raise HTTPException(status_code=400,detail="Noto‘g‘ri sana oralig‘i")
 enrolled_ids=[row[0] for row in db.query(Enrollment.course_id).filter(Enrollment.user_id==user.id).all()];rows=[]
 if enrolled_ids and (not event_type or event_type=="assignment"):
  assignments=db.query(Assignment).filter(Assignment.course_id.in_(enrolled_ids),Assignment.due_date>=start_utc,Assignment.due_date<end_utc).all();rows.extend({"id":f"assignment-{item.id}","title":item.title or "Topshiriq","event_type":"assignment","starts_at":item.due_date,"ends_at":None,"course_id":item.course_id,"link":f"/organish/{item.course_id}","description":"Assignment deadline"} for item in assignments)
 query=db.query(CalendarEvent).filter(CalendarEvent.user_id==user.id,CalendarEvent.starts_at>=start_utc,CalendarEvent.starts_at<end_utc)
 if event_type:query=query.filter(CalendarEvent.event_type==event_type)
 for item in query.order_by(CalendarEvent.starts_at.asc()).all():rows.append({"id":item.id,"title":item.title,"event_type":item.event_type,"starts_at":item.starts_at,"ends_at":item.ends_at,"course_id":item.course_id,"link":item.link,"description":item.description})
 return sorted([_event(row,timezone) for row in rows],key=lambda row:row["starts_at"])
@router.post("/events",status_code=201)
def create_event(data:EventIn,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_user(db,email)
 if data.event_type not in EVENT_TYPES-{"assignment"}:raise HTTPException(status_code=400,detail="Event turi noto‘g‘ri")
 starts_at,ends_at=_utc(data.starts_at),_utc(data.ends_at) if data.ends_at else None
 if ends_at and ends_at<=starts_at:raise HTTPException(status_code=400,detail="Tugash vaqti boshlanishdan keyin bo‘lsin")
 item=CalendarEvent(user_id=user.id,title=data.title,event_type=data.event_type,starts_at=starts_at,ends_at=ends_at,course_id=data.course_id,link=data.link,description=data.description);db.add(item);db.commit();db.refresh(item);return {"id":item.id,"message":"Calendar event yaratildi"}
@router.delete("/events/{event_id}")
def delete_event(event_id:int,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 user=_user(db,email);item=db.query(CalendarEvent).filter(CalendarEvent.id==event_id,CalendarEvent.user_id==user.id).first()
 if not item:raise HTTPException(status_code=404,detail="Event topilmadi")
 db.delete(item);db.commit();return {"message":"Event o‘chirildi"}
# fmt: on
