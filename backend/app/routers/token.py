from __future__ import annotations
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import INACTIVE_ACCOUNT_DETAIL, create_access_token, get_current_user
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services import token_service

router=APIRouter(prefix="/api/auth",tags=["Auth"]);_REFRESH_COOKIE="refresh_token"
def _is_production():return settings.ENVIRONMENT=="production"
def _set_refresh_cookie(response,token):response.set_cookie(key=_REFRESH_COOKIE,value=token,httponly=True,secure=_is_production(),max_age=token_service.REFRESH_TOKEN_TTL_DAYS*24*3600,samesite="strict",path="/api/auth")
def _revoke_all(db,user_id):return db.query(RefreshToken).filter(RefreshToken.user_id==user_id,RefreshToken.revoked_at.is_(None)).update({RefreshToken.revoked_at:datetime.now(UTC)})
def issue_refresh_token(db,user,user_agent=None):
    raw=token_service.generate_refresh_token();db.add(RefreshToken(user_id=user.id,token_hash=token_service.hash_token(raw),expires_at=token_service.refresh_expiry(),user_agent=(user_agent or "")[:255] or None));db.flush();return raw

@router.post("/refresh")
def refresh(request:Request,response:Response,db:Session=Depends(get_db)):
    raw=request.cookies.get(_REFRESH_COOKIE)
    if not raw:raise HTTPException(status_code=401,detail="Refresh-token topilmadi")
    rec=db.query(RefreshToken).filter(RefreshToken.token_hash==token_service.hash_token(raw)).first()
    if not rec:raise HTTPException(status_code=401,detail="Refresh-token yaroqsiz")
    if not rec.is_active:
        _revoke_all(db,rec.user_id);db.commit();raise HTTPException(status_code=401,detail="Refresh-token qayta ishlatildi — barcha sessiyalar bekor qilindi")
    user=db.query(User).filter(User.id==rec.user_id).first()
    if not user:raise HTTPException(status_code=401,detail="Foydalanuvchi topilmadi")
    if not user.is_active:
        _revoke_all(db,user.id);db.commit();raise HTTPException(status_code=403,detail=INACTIVE_ACCOUNT_DETAIL)
    new_raw=issue_refresh_token(db,user,request.headers.get("user-agent"));rec.revoked_at=datetime.now(UTC);rec.replaced_by=token_service.hash_token(new_raw);db.commit()
    access=create_access_token(user.email);response.set_cookie(key="access_token",value=access,httponly=True,secure=_is_production(),max_age=3600,samesite="strict");_set_refresh_cookie(response,new_raw);return {"access_token":access,"token_type":"bearer"}

@router.post("/logout-all")
def logout_all(request:Request,response:Response,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
    user=db.query(User).filter(User.email==email).first()
    if not user:raise HTTPException(status_code=401,detail="Avtorizatsiya talab etiladi")
    revoked=_revoke_all(db,user.id);db.commit();response.delete_cookie("access_token");response.delete_cookie(_REFRESH_COOKIE,path="/api/auth");return {"message":"Barcha sessiyalar yopildi","revoked":revoked}

@router.post("/issue-refresh")
def issue_refresh_for_current(request:Request,response:Response,email:str=Depends(get_current_user),db:Session=Depends(get_db)):
    user=db.query(User).filter(User.email==email).first()
    if not user:raise HTTPException(status_code=401,detail="Avtorizatsiya talab etiladi")
    if not user.is_active:raise HTTPException(status_code=403,detail=INACTIVE_ACCOUNT_DETAIL)
    raw=issue_refresh_token(db,user,request.headers.get("user-agent"));db.commit();_set_refresh_cookie(response,raw);return {"message":"Refresh-token berildi"}
