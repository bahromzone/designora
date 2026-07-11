# ruff: noqa: E501
import re
from fastapi import APIRouter,Depends,HTTPException,Query
from pydantic import BaseModel,Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.forum import ForumPost,ForumReport,ForumThread
from app.models.lesson import Lesson
from app.models.notification import Notification
from app.models.user import User

router=APIRouter(prefix="/api/course-community",tags=["Course Community"]);STAFF={"admin","superadmin"}
def user(db,email):
 u=db.query(User).filter(User.email==email).first()
 if not u:raise HTTPException(status_code=401,detail="Avtorizatsiya talab etiladi")
 return u
def access(db,u,course_id):
 c=db.query(Course).filter(Course.id==course_id).first()
 if not c:raise HTTPException(status_code=404,detail="Kurs topilmadi")
 if u.role in STAFF or c.instructor_id==u.id:return c
 if not db.query(Enrollment).filter(Enrollment.user_id==u.id,Enrollment.course_id==course_id).first():raise HTTPException(status_code=403,detail="Kurs community'si faqat qatnashchilar uchun")
 return c
def mentions(text):return list(dict.fromkeys(re.findall(r"@([\w.+-]+@[\w.-]+)",text or "")))
def notify(db,emails,message):
 for email in emails:
  u=db.query(User).filter(User.email==email).first()
  if u:db.add(Notification(user_id=u.id,message=message,type="mention"))
class ThreadIn(BaseModel):title:str=Field(min_length=3,max_length=200);body:str="";course_id:int;lesson_id:int|None=None
class PostIn(BaseModel):body:str=Field(min_length=1,max_length=8000)
class ReportIn(BaseModel):reason:str=Field(min_length=3,max_length=100);details:str|None=None;thread_id:int|None=None;post_id:int|None=None
class ResolveIn(BaseModel):status:str;resolution:str|None=None

@router.get("/courses/{course_id}/threads")
def list_threads(course_id:int,lesson_id:int|None=None,q:str|None=None,page:int=Query(1,ge=1),db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email);access(db,u,course_id);query=db.query(ForumThread).filter(ForumThread.course_id==course_id)
 if lesson_id is not None:query=query.filter(ForumThread.lesson_id==lesson_id)
 if q:query=query.filter(ForumThread.title.ilike(f"%{q}%"))
 rows=query.order_by(ForumThread.is_pinned.desc(),ForumThread.updated_at.desc()).offset((page-1)*20).limit(20).all()
 return [{"id":r.id,"title":r.title,"body":r.body,"lesson_id":r.lesson_id,"author":r.user.name if r.user else None,"replies":r.posts.count(),"accepted":bool(r.accepted_post_id),"is_pinned":r.is_pinned,"created_at":r.created_at.isoformat()}for r in rows]

@router.post("/threads",status_code=201)
def create_thread(data:ThreadIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email);access(db,u,data.course_id)
 if data.lesson_id and not db.query(Lesson).filter(Lesson.id==data.lesson_id,Lesson.course_id==data.course_id).first():raise HTTPException(status_code=400,detail="Dars bu kursga tegishli emas")
 r=ForumThread(user_id=u.id,course_id=data.course_id,lesson_id=data.lesson_id,title=data.title,body=data.body,category="course");db.add(r);notify(db,mentions(data.body),f"Siz yangi mavzuda mention qilindingiz: {data.title}");db.commit();db.refresh(r);return{"id":r.id}

@router.get("/threads/{thread_id}")
def detail(thread_id:int,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email);t=db.query(ForumThread).filter(ForumThread.id==thread_id).first()
 if not t:raise HTTPException(status_code=404,detail="Mavzu topilmadi")
 access(db,u,t.course_id);course=db.query(Course).filter(Course.id==t.course_id).first();t.views=(t.views or 0)+1;db.commit()
 posts=[]
 for p in t.posts.all():posts.append({"id":p.id,"body":p.body,"author":p.user.name if p.user else None,"user_id":p.user_id,"is_instructor":p.is_instructor,"is_accepted":p.id==t.accepted_post_id,"mentions":(p.mentions or "").split(",")if p.mentions else[],"created_at":p.created_at.isoformat()})
 related=db.query(ForumThread).filter(ForumThread.course_id==t.course_id,ForumThread.id!=t.id).order_by(ForumThread.views.desc()).limit(3).all()
 return{"id":t.id,"title":t.title,"body":t.body,"course_id":t.course_id,"lesson_id":t.lesson_id,"author":t.user.name if t.user else None,"owner_id":t.user_id,"can_accept":u.id==t.user_id or u.role in STAFF or course.instructor_id==u.id,"posts":posts,"related":[{"id":r.id,"title":r.title}for r in related]}

@router.post("/threads/{thread_id}/posts",status_code=201)
def reply(thread_id:int,data:PostIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email);t=db.query(ForumThread).filter(ForumThread.id==thread_id).first()
 if not t:raise HTTPException(status_code=404,detail="Mavzu topilmadi")
 c=access(db,u,t.course_id);m=mentions(data.body);p=ForumPost(thread_id=t.id,user_id=u.id,body=data.body,is_instructor=c.instructor_id==u.id or u.role in STAFF,mentions=",".join(m));db.add(p);notify(db,m,f"Siz forum javobida mention qilindingiz: {t.title}");db.commit();db.refresh(p);return{"id":p.id,"is_instructor":p.is_instructor}

@router.post("/threads/{thread_id}/accept/{post_id}")
def accept(thread_id:int,post_id:int,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email);t=db.query(ForumThread).filter(ForumThread.id==thread_id).first();c=access(db,u,t.course_id)
 if u.id!=t.user_id and c.instructor_id!=u.id and u.role not in STAFF:raise HTTPException(status_code=403,detail="Accepted answer belgilashga ruxsat yo'q")
 if not db.query(ForumPost).filter(ForumPost.id==post_id,ForumPost.thread_id==thread_id).first():raise HTTPException(status_code=404,detail="Javob topilmadi")
 t.accepted_post_id=post_id;db.commit();return{"accepted_post_id":post_id}

@router.post("/reports",status_code=201)
def report(data:ReportIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email)
 if bool(data.thread_id)==bool(data.post_id):raise HTTPException(status_code=400,detail="Faqat thread yoki post tanlang")
 r=ForumReport(reporter_id=u.id,**data.model_dump());db.add(r);db.commit();db.refresh(r);return{"id":r.id,"status":r.status}
@router.get("/moderation/reports")
def reports(db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email)
 if u.role not in STAFF:raise HTTPException(status_code=403,detail="Faqat moderator uchun")
 return[{"id":r.id,"thread_id":r.thread_id,"post_id":r.post_id,"reason":r.reason,"details":r.details,"status":r.status}for r in db.query(ForumReport).order_by(ForumReport.id.desc()).all()]
@router.patch("/moderation/reports/{report_id}")
def resolve(report_id:int,data:ResolveIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 u=user(db,email)
 if u.role not in STAFF:raise HTTPException(status_code=403,detail="Faqat moderator uchun")
 r=db.query(ForumReport).filter(ForumReport.id==report_id).first()
 if not r:raise HTTPException(status_code=404,detail="Report topilmadi")
 r.status=data.status;r.resolution=data.resolution;r.moderator_id=u.id;db.commit();return{"id":r.id,"status":r.status}
