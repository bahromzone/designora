# ruff: noqa: E501,E701,E702,I001
from datetime import UTC,datetime,timedelta
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.gamification_v2 import CourseMilestone,LeaderboardPreference,SkillBadge,StreakWallet,UserSkillBadge,XPEvent
from app.models.user import User
from app.services.gamification_service import award_points
router=APIRouter(prefix="/api/gamification-v2",tags=["Meaningful Gamification"])
RULES={"lesson_complete":10,"quiz_passed":20,"assignment_submitted":25,"feedback_applied":30,"course_complete":100,"helpful_answer":15}
def u(db,email):
 x=db.query(User).filter(User.email==email).first()
 if not x:raise HTTPException(status_code=401,detail="Login kerak")
 return x
class EventIn(BaseModel):action:str;source_id:str|None=None
class PrefIn(BaseModel):is_public:bool
class BadgePublicIn(BaseModel):is_public:bool
class MilestoneIn(BaseModel):course_id:int;code:str;title:str
@router.post("/events")
def event(data:EventIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 user=u(db,email);points=RULES.get(data.action)
 if not points:raise HTTPException(status_code=400,detail="Bu harakat XP bermaydi")
 if data.source_id and db.query(XPEvent).filter(XPEvent.user_id==user.id,XPEvent.action==data.action,XPEvent.source_id==data.source_id).first():return{"awarded":0,"duplicate":True}
 row=XPEvent(user_id=user.id,action=data.action,source_id=data.source_id,points=points);db.add(row);award_points(db,user,points);db.commit();return{"awarded":points,"points":user.points}
@router.post("/streak/check-in")
def checkin(db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 user=u(db,email);wallet=db.query(StreakWallet).filter(StreakWallet.user_id==user.id).first()
 if not wallet:wallet=StreakWallet(user_id=user.id,freeze_tokens=1);db.add(wallet)
 now=datetime.now(UTC);last=wallet.last_activity_at
 if last and last.tzinfo is None:last=last.replace(tzinfo=UTC)
 gap=(now.date()-last.date()).days if last else None
 if gap==1:user.streak_days=(user.streak_days or 0)+1
 elif gap and gap>1:
  if gap==2 and wallet.freeze_tokens>0:wallet.freeze_tokens-=1;user.streak_days=(user.streak_days or 0)+1;wallet.recovered_at=now
  else:user.streak_days=1
 elif not last:user.streak_days=1
 wallet.last_activity_at=now;db.commit();return{"streak_days":user.streak_days,"freeze_tokens":wallet.freeze_tokens,"recovered":bool(wallet.recovered_at and wallet.recovered_at.date()==now.date())}
@router.get("/dashboard")
def dashboard(db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 user=u(db,email);wallet=db.query(StreakWallet).filter(StreakWallet.user_id==user.id).first();pref=db.query(LeaderboardPreference).filter(LeaderboardPreference.user_id==user.id).first();badges=db.query(UserSkillBadge,SkillBadge).join(SkillBadge,UserSkillBadge.badge_id==SkillBadge.id).filter(UserSkillBadge.user_id==user.id).all();milestones=db.query(CourseMilestone).filter(CourseMilestone.user_id==user.id).all()
 return{"points":user.points or 0,"level":user.level or 1,"streak_days":user.streak_days or 0,"freeze_tokens":wallet.freeze_tokens if wallet else 1,"leaderboard_public":pref.is_public if pref else False,"badges":[{"id":ub.id,"code":b.code,"title":b.title,"skill":b.skill,"icon":b.icon,"is_public":ub.is_public}for ub,b in badges],"milestones":[{"course_id":m.course_id,"code":m.code,"title":m.title}for m in milestones]}
@router.put("/leaderboard-preference")
def preference(data:PrefIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 user=u(db,email);row=db.query(LeaderboardPreference).filter(LeaderboardPreference.user_id==user.id).first()
 if not row:row=LeaderboardPreference(user_id=user.id);db.add(row)
 row.is_public=data.is_public;db.commit();return{"is_public":row.is_public}
@router.get("/leaderboard")
def board(db:Session=Depends(get_db)):
 rows=db.query(User,LeaderboardPreference).join(LeaderboardPreference,LeaderboardPreference.user_id==User.id).filter(LeaderboardPreference.is_public.is_(True)).order_by(User.points.desc()).limit(100).all();return[{"rank":i,"name":x.name,"points":x.points or 0,"level":x.level or 1,"streak_days":x.streak_days or 0}for i,(x,p)in enumerate(rows,1)]
@router.put("/badges/{user_badge_id}/public")
def badge_public(user_badge_id:int,data:BadgePublicIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 user=u(db,email);row=db.query(UserSkillBadge).filter(UserSkillBadge.id==user_badge_id,UserSkillBadge.user_id==user.id).first()
 if not row:raise HTTPException(status_code=404,detail="Badge topilmadi")
 row.is_public=data.is_public;db.commit();return{"id":row.id,"is_public":row.is_public}
@router.post("/milestones",status_code=201)
def milestone(data:MilestoneIn,db:Session=Depends(get_db),email:str=Depends(get_current_user)):
 user=u(db,email);existing=db.query(CourseMilestone).filter(CourseMilestone.user_id==user.id,CourseMilestone.course_id==data.course_id,CourseMilestone.code==data.code).first()
 if existing:return{"id":existing.id,"duplicate":True}
 row=CourseMilestone(user_id=user.id,**data.model_dump());db.add(row);db.commit();db.refresh(row);return{"id":row.id,"duplicate":False}
