"""Course reviews, ratings and unified moderation reports."""

from datetime import UTC, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enrollment import Enrollment
from app.models.moderation import ContentReport
from app.models.review import Review
from app.models.user import User
from app.services import review_service
router=APIRouter(prefix="/api/reviews",tags=["Reviews"])
def now():return datetime.now(UTC)
def user(db,email):
 row=db.query(User).filter(User.email==email).first()
 if not row:raise HTTPException(status_code=401,detail="Avtorizatsiya talab etiladi")
 return row
class ReviewIn(BaseModel):rating:Annotated[int,Field(ge=1,le=5)];comment:str|None=None
class ReportReviewIn(BaseModel):reason:str=Field(min_length=3,max_length=100);details:str|None=Field(default=None,max_length=2000)
def payload(r,author=None):return{"id":r.id,"user_id":r.user_id,"author":author,"course_id":r.course_id,"rating":r.rating,"comment":r.comment,"created_at":r.created_at.isoformat()if r.created_at else None,"updated_at":r.updated_at.isoformat()if r.updated_at else None}
@router.get("/courses/{course_id}")
def list_reviews(course_id:int,db:Session=Depends(get_db)):
 rows=db.query(Review).filter(Review.course_id==course_id).order_by(Review.created_at.desc()).all();return[payload(r,(db.query(User).filter(User.id==r.user_id).first() or User()).name)for r in rows]
@router.get("/courses/{course_id}/summary")
def summary(course_id:int,db:Session=Depends(get_db)):
 ratings=[r for(r,)in db.query(Review.rating).filter(Review.course_id==course_id).all()];avg,count=review_service.compute_rating_aggregate(ratings);return{"course_id":course_id,"rating_avg":avg,"rating_count":count,"distribution":review_service.rating_distribution(ratings)}
@router.post("/courses/{course_id}",status_code=201)
def upsert(course_id:int,data:ReviewIn,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 u=user(db,email)
 if not db.query(Enrollment).filter(Enrollment.user_id==u.id,Enrollment.course_id==course_id).first():raise HTTPException(status_code=403,detail="Sharh uchun kursga yozilishingiz kerak")
 row=db.query(Review).filter(Review.user_id==u.id,Review.course_id==course_id).first();created=row is None
 if row is None:row=Review(user_id=u.id,course_id=course_id);db.add(row)
 row.rating=data.rating;row.comment=data.comment;row.updated_at=now();db.flush();review_service.recompute_course_rating(db,course_id);db.commit();db.refresh(row);return payload(row,u.name)|{"created":created}
@router.post("/{review_id}/report",status_code=201)
def report_review(review_id:int,data:ReportReviewIn,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 u=user(db,email);review=db.query(Review).filter(Review.id==review_id).first()
 if not review:raise HTTPException(status_code=404,detail="Sharh topilmadi")
 existing=db.query(ContentReport).filter(ContentReport.reporter_id==u.id,ContentReport.content_type=="review",ContentReport.content_id==review.id,ContentReport.status=="open").first()
 if existing:return{"id":existing.id,"duplicate":True}
 row=ContentReport(reporter_id=u.id,content_type="review",content_id=review.id,reported_user_id=review.user_id,reason=data.reason,details=data.details);db.add(row);db.commit();db.refresh(row);return{"id":row.id,"duplicate":False}
@router.delete("/{review_id}")
def remove(review_id:int,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 u=user(db,email);row=db.query(Review).filter(Review.id==review_id).first()
 if not row:raise HTTPException(status_code=404,detail="Sharh topilmadi")
 if row.user_id!=u.id and u.role not in{"admin","superadmin"}:raise HTTPException(status_code=403,detail="Ruxsat yo'q")
 course_id=row.course_id;db.delete(row);db.flush();review_service.recompute_course_rating(db,course_id);db.commit();return{"id":review_id}
