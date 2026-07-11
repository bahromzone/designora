# ruff: noqa: E501
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.monetization import CourseBundle, FinancialAidApplication, Subscription, SubscriptionPlan, TeamLicense, TeamLicenseMember
from app.models.user import User

router = APIRouter(prefix="/api/monetization", tags=["Monetization"])


def current_user(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def admin(user: User = Depends(current_user)) -> User:
    if user.role not in {"admin", "superadmin"}:
        raise HTTPException(status_code=403, detail="Faqat admin uchun")
    return user


def grant_courses(db: Session, user_id: int, course_ids: list[int]) -> None:
    for course_id in course_ids:
        exists = db.query(Enrollment).filter(Enrollment.user_id == user_id, Enrollment.course_id == course_id).first()
        if not exists:
            db.add(Enrollment(user_id=user_id, course_id=course_id, progress_percent=0))


class BundleIn(BaseModel):
    title: str = Field(min_length=3)
    slug: str = Field(min_length=3)
    description: str | None = None
    course_ids: list[int] = Field(min_length=2)
    price: int = Field(ge=0)
    is_active: bool = False


class PlanIn(BaseModel):
    name: str
    code: str
    monthly_price: int = Field(gt=0)
    course_ids: list[int] | None = None
    is_active: bool = False
    readiness_note: str | None = None


class TeamIn(BaseModel):
    company_name: str
    course_ids: list[int] = Field(min_length=1)
    seats: int = Field(ge=1, le=10000)


class InviteIn(BaseModel):
    email: str


class AidIn(BaseModel):
    course_id: int
    aid_type: str
    reason: str = Field(min_length=20)
    requested_installments: int | None = Field(None, ge=2, le=12)


class DecisionIn(BaseModel):
    status: str
    note: str | None = None


@router.get("/catalog")
def catalog(db: Session = Depends(get_db)):
    bundles = db.query(CourseBundle).filter(CourseBundle.is_active.is_(True)).all()
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active.is_(True)).all()
    return {"bundles": [{"id": row.id, "title": row.title, "slug": row.slug, "description": row.description, "course_ids": row.course_ids or [], "price": row.price} for row in bundles], "subscriptions": [{"id": row.id, "name": row.name, "code": row.code, "monthly_price": row.monthly_price, "course_ids": row.course_ids or []} for row in plans], "subscription_warning": "Subscription faqat retention va kontent hajmi tasdiqlanganda faollashtiriladi."}


@router.post("/bundles", status_code=201)
def create_bundle(data: BundleIn, db: Session = Depends(get_db), _: User = Depends(admin)):
    if db.query(Course).filter(Course.id.in_(data.course_ids)).count() != len(set(data.course_ids)):
        raise HTTPException(status_code=400, detail="Ba'zi kurslar topilmadi")
    row = CourseBundle(**data.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "message": "Bundle yaratildi"}


@router.post("/bundles/{bundle_id}/activate")
def activate_bundle(bundle_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.query(CourseBundle).filter(CourseBundle.id == bundle_id, CourseBundle.is_active.is_(True)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Bundle topilmadi")
    grant_courses(db, user.id, row.course_ids or []); db.commit()
    return {"message": "Bundle kurslari ochildi", "course_ids": row.course_ids or []}


@router.post("/plans", status_code=201)
def create_plan(data: PlanIn, db: Session = Depends(get_db), _: User = Depends(admin)):
    row = SubscriptionPlan(**data.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "message": "Subscription plan yaratildi"}


@router.post("/plans/{plan_id}/subscribe")
def subscribe(plan_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id, SubscriptionPlan.is_active.is_(True)).first()
    if not plan:
        raise HTTPException(status_code=409, detail="Subscription hali ishga tushirilmagan")
    row = Subscription(user_id=user.id, plan_id=plan.id, status="active", current_period_end=datetime.now(UTC) + timedelta(days=30))
    db.add(row); grant_courses(db, user.id, plan.course_ids or []); db.commit()
    return {"message": "Subscription faollashdi", "period_end": row.current_period_end.isoformat()}


@router.post("/teams", status_code=201)
def create_team(data: TeamIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = TeamLicense(company_name=data.company_name, owner_user_id=user.id, course_ids=data.course_ids, seats=data.seats, status="active")
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "message": "Team license yaratildi"}


@router.post("/teams/{license_id}/members", status_code=201)
def invite_member(license_id: int, data: InviteIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    license = db.query(TeamLicense).filter(TeamLicense.id == license_id, TeamLicense.owner_user_id == user.id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License topilmadi")
    if license.used_seats >= license.seats:
        raise HTTPException(status_code=409, detail="Bo'sh seat qolmagan")
    member_user = db.query(User).filter(User.email == data.email).first()
    row = TeamLicenseMember(license_id=license.id, email=data.email, user_id=member_user.id if member_user else None, status="active" if member_user else "invited")
    db.add(row); license.used_seats += 1
    if member_user:
        grant_courses(db, member_user.id, license.course_ids or [])
    db.commit()
    return {"id": row.id, "status": row.status, "used_seats": license.used_seats}


@router.post("/aid", status_code=201)
def apply_aid(data: AidIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if data.aid_type not in {"scholarship", "installment"}:
        raise HTTPException(status_code=400, detail="aid_type scholarship yoki installment bo'lishi kerak")
    if data.aid_type == "installment" and not data.requested_installments:
        raise HTTPException(status_code=400, detail="Bo'lib to'lash sonini kiriting")
    row = FinancialAidApplication(user_id=user.id, **data.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "status": row.status}


@router.patch("/aid/{application_id}")
def decide_aid(application_id: int, data: DecisionIn, db: Session = Depends(get_db), _: User = Depends(admin)):
    if data.status not in {"approved", "rejected"}:
        raise HTTPException(status_code=400, detail="Noto'g'ri qaror")
    row = db.query(FinancialAidApplication).filter(FinancialAidApplication.id == application_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")
    row.status = data.status; row.decision_note = data.note
    if data.status == "approved" and row.aid_type == "scholarship":
        grant_courses(db, row.user_id, [row.course_id])
    db.commit()
    return {"id": row.id, "status": row.status}
