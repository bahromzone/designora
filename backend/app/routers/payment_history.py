from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.get("/history")
def payment_history(
    email: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .all()
    )
    return [
        {
            "id": order.id,
            "course_id": order.course_id,
            "course_title": order.course.title if order.course else None,
            "amount": order.amount or 0,
            "currency": order.currency or "UZS",
            "status": order.status,
            "provider": order.provider,
            "discount": order.discount_amount or 0,
            "created_at": (order.created_at.isoformat() if order.created_at else None),
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "receipt_number": order.receipt_number,
        }
        for order in orders
    ]
