"""Admin Courses Router, admin va superadmin uchun platforma CRUD."""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.user import User

router=APIRouter(prefix="/api/admin/courses",tags=["Admin - Courses"])
_ADMIN_ROLES={"admin","superadmin"}

def require_admin(email:str=Depends(get_current_user),db:Session=Depends(get_db))->User:
    user=db.query(User).filter(User.email==email).first()
    if not user: raise HTTPException(status_code=401,detail="Avtorizatsiya talab etiladi")
    if not user.is_active: raise HTTPException(status_code=403,detail="Hisobingiz bloklangan")
    if user.role not in _ADMIN_ROLES: raise HTTPException(status_code=403,detail="Faqat adminlar uchun")
    return user

class CourseCreate(BaseModel):
    title:Annotated[str,StringConstraints(min_length=3,max_length=200)]
    description:str|None=None
    category:str|None=None
    price:int|None=0
    thumbnail_url:str|None=None
    is_active:bool|None=True
class CourseUpdate(BaseModel):
    title:Annotated[str,StringConstraints(min_length=3,max_length=200)]|None=None
    description:str|None=None
    category:str|None=None
    price:int|None=None
    thumbnail_url:str|None=None
    is_active:bool|None=None

@router.get("")
def list_courses(db:Session=Depends(get_db),admin:User=Depends(require_admin)):
    courses=db.query(Course).order_by(Course.id.desc()).all()
    return [{"id":c.id,"title":c.title,"category":c.category,"price":c.price,"is_active":c.is_active,"thumbnail_url":c.thumbnail_url,"description":c.description} for c in courses]

@router.post("",status_code=201)
def create_course(data:CourseCreate,db:Session=Depends(get_db),admin:User=Depends(require_admin)):
    course=Course(title=data.title,description=data.description,category=data.category.lower() if data.category else None,price=data.price or 0,thumbnail_url=data.thumbnail_url,is_active=data.is_active if data.is_active is not None else True,instructor_id=admin.id)
    db.add(course)
    try: db.commit();db.refresh(course)
    except Exception as exc: db.rollback();raise HTTPException(status_code=500,detail=f"Saqlashda xatolik: {exc}")
    return JSONResponse(status_code=201,content={"message":"Kurs muvaffaqiyatli qo'shildi","id":course.id,"title":course.title})

@router.patch("/{course_id}")
def update_course(course_id:int,data:CourseUpdate,db:Session=Depends(get_db),admin:User=Depends(require_admin)):
    course=db.query(Course).filter(Course.id==course_id).first()
    if not course: raise HTTPException(status_code=404,detail="Kurs topilmadi")
    fields=data.model_dump(exclude_none=True)
    if fields.get("category"): fields["category"]=fields["category"].lower()
    for field,value in fields.items(): setattr(course,field,value)
    try: db.commit();db.refresh(course)
    except Exception as exc: db.rollback();raise HTTPException(status_code=500,detail=f"Yangilashda xatolik: {exc}")
    return {"message":"Kurs yangilandi","id":course.id}

@router.delete("/{course_id}")
def delete_course(course_id:int,db:Session=Depends(get_db),admin:User=Depends(require_admin)):
    course=db.query(Course).filter(Course.id==course_id).first()
    if not course: raise HTTPException(status_code=404,detail="Kurs topilmadi")
    try: db.delete(course);db.commit()
    except Exception as exc: db.rollback();raise HTTPException(status_code=500,detail=f"O'chirishda xatolik: {exc}")
    return {"message":"Kurs o'chirildi","id":course_id}

@router.patch("/{course_id}/toggle")
def toggle_course(course_id:int,db:Session=Depends(get_db),admin:User=Depends(require_admin)):
    course=db.query(Course).filter(Course.id==course_id).first()
    if not course: raise HTTPException(status_code=404,detail="Kurs topilmadi")
    course.is_active=not course.is_active;db.commit()
    return {"message":"Kurs faolligi yangilandi","is_active":course.is_active}
