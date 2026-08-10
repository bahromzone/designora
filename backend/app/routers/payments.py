"""
Payments Router — monetizatsiya yadrosi HTTP qatlami.

Prefix: /api/payments

- POST /checkout                → Order yaratadi (pending), to'lov URL qaytaradi
- POST /payme                   → Payme Merchant API webhook (JSON-RPC 2.0)
- POST /click/prepare           → Click Prepare bosqichi
- POST /click/complete          → Click Complete bosqichi
- GET  /orders/{order_id}       → buyurtma holatini tekshirish (frontend polling)

Bu fayl ATAYLAB yupqa: u faqat so'rovni o'qiydi va javobni qaytaradi.
Biznes mantiq xizmat qatlamida:

- `services/payment_service.py`  → grant_access / revoke_access
- `services/payme_gateway.py`    → Payme JSON-RPC protokoli
- `services/click_gateway.py`    → Click imzo va Prepare/Complete
- `services/checkout_service.py` → checkout, kupon va to'lov URL'i

To'lov muvaffaqiyatli bo'lgach grant_access() Enrollment yaratadi —
access control (learning.py) avtomatik ochiladi. Bekor qilinganda yoki
pul qaytarilganda revoke_access() aksincha, kirishni butunlay yopadi.
"""

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.services import click_gateway, payme_gateway
from app.services.checkout_service import build_pay_url, create_checkout, order_status

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# checkout_experience.py tarixiy ravishda shu nomni import qiladi. Qayta
# eksport qilinadi, shunda mavjud import yo'llari sinmaydi.
_build_pay_url = build_pay_url


class CheckoutBody(BaseModel):
    course_id: int
    provider: str  # payme / click
    coupon_code: str | None = None


@router.post("/checkout")
def checkout(
    body: CheckoutBody,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_checkout(
        db,
        email,
        course_id=body.course_id,
        provider=body.provider,
        coupon_code=body.coupon_code,
    )


@router.get("/orders/{order_id}")
def read_order_status(
    order_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return order_status(db, email, order_id)


@router.post("/payme")
async def payme_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    return payme_gateway.handle(db, body, request.headers.get("Authorization", ""))


@router.post("/click/prepare")
async def click_prepare(request: Request, db: Session = Depends(get_db)):
    return click_gateway.prepare(db, dict(await request.form()))


@router.post("/click/complete")
async def click_complete(request: Request, db: Session = Depends(get_db)):
    return click_gateway.complete(db, dict(await request.form()))
