from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.coupon import Coupon
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["Admin - Payments"])


def require_admin(
    email: str = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active or user.role not in {"admin", "superadmin"}:
        raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user


class CouponIn(BaseModel):
    code: str
    type: str = "percent"
    value: int
    max_uses: int | None = None
    expires_at: datetime | None = None


@router.get("/orders")
def orders(
    status: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Order).order_by(Order.id.desc())
    if status and status != "all":
        query = query.filter(Order.status == status)
    rows = query.limit(200).all()
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "user_email": row.user.email if row.user else None,
            "course_id": row.course_id,
            "course_title": row.course.title if row.course else None,
            "amount": row.amount,
            "discount_amount": row.discount_amount,
            "provider": row.provider,
            "status": row.status,
            "refund_status": row.refund_status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.post("/orders/{order_id}/refund")
def request_refund(
    order_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    if order.status != "paid":
        raise HTTPException(
            status_code=400, detail="Faqat to'langan order refund qilinadi"
        )
    if order.refund_status != "none":
        raise HTTPException(status_code=400, detail="Refund allaqachon yuborilgan")
    order.refund_status = "requested"
    db.commit()
    return {
        "message": "Refund so'rovi qayd etildi",
        "id": order.id,
        "refund_status": order.refund_status,
    }


@router.get("/coupons")
def coupons(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(Coupon).order_by(Coupon.id.desc()).all()
    return [
        {
            "id": row.id,
            "code": row.code,
            "type": row.type,
            "value": row.value,
            "max_uses": row.max_uses,
            "used_count": row.used_count,
            "is_active": row.is_active,
            "expires_at": row.expires_at.isoformat() if row.expires_at else None,
        }
        for row in rows
    ]


@router.post("/coupons", status_code=201)
def create_coupon(
    data: CouponIn, db: Session = Depends(get_db), _: User = Depends(require_admin)
):
    code = data.code.strip().upper()
    if not code:
        raise HTTPException(
            status_code=400, detail="Kupon kodi bo'sh bo'lishi mumkin emas"
        )
    if (
        data.type not in {"percent", "fixed"}
        or data.value <= 0
        or (data.type == "percent" and data.value > 100)
    ):
        raise HTTPException(status_code=400, detail="Kupon qiymati noto'g'ri")
    if data.max_uses is not None and data.max_uses <= 0:
        raise HTTPException(
            status_code=400, detail="max_uses 0 dan katta bo'lishi kerak"
        )
    if db.query(Coupon).filter(Coupon.code == code).first():
        raise HTTPException(status_code=409, detail="Bu kupon mavjud")
    row = Coupon(
        code=code,
        type=data.type,
        value=data.value,
        max_uses=data.max_uses,
        expires_at=data.expires_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "code": row.code}


@router.patch("/coupons/{coupon_id}/toggle")
def toggle_coupon(
    coupon_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)
):
    row = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Kupon topilmadi")
    row.is_active = not row.is_active
    db.commit()
    return {"id": row.id, "is_active": row.is_active}
