"""Click Merchant API (Prepare + Complete) gateway.

Router form'ni o'qiydi, imzo va holat mantiqi shu modulda.

XAVFSIZLIK: CLICK_SECRET_KEY sozlanmagan bo'lsa webhook umuman xizmat
ko'rsatmaydi. Bo'sh kalit bilan imzoni har kim hisoblab chiqara olardi —
ya'ni to'lovsiz "Complete" yuborib kurs ochib olsa bo'lardi.
"""

import hashlib
import hmac
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.services.payment_service import grant_access as _grant_access
from app.services.payment_service import revoke_access as _revoke_access

logger = logging.getLogger(__name__)

# Click xato kodlari
CLICK_ERR_SIGN = -1
CLICK_ERR_AMOUNT = -2
CLICK_ERR_ALREADY_PAID = -4
CLICK_ERR_ORDER_NOT_FOUND = -5
CLICK_ERR_CANCELLED = -9


def _safe_int(value) -> int | None:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def _safe_float(value) -> float | None:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def _click_secret() -> str:
    return (settings.CLICK_SECRET_KEY or "").strip()


def _click_signature(*parts) -> str:
    # md5 — Click Merchant API spetsifikatsiyasi talabi, tanlov yo'q.
    return hashlib.md5(
        "".join(str(p) for p in parts).encode()
    ).hexdigest()  # noqa: S324


def _click_sign_ok(expected: str, received) -> bool:
    return hmac.compare_digest(expected, str(received or ""))


def _click_find_order(db: Session, order_id_raw) -> Order | None:
    order_id = _safe_int(order_id_raw)
    if not order_id:
        return None
    return db.query(Order).filter(Order.id == order_id).first()


def prepare(db: Session, form: dict) -> dict:
    secret = _click_secret()
    if not secret:
        logger.error("CLICK_SECRET_KEY sozlanmagan — click/prepare rad etildi")
        return {"error": CLICK_ERR_SIGN, "error_note": "Integratsiya sozlanmagan"}

    order = _click_find_order(db, form.get("merchant_trans_id"))
    if not order:
        return {"error": CLICK_ERR_ORDER_NOT_FOUND, "error_note": "Buyurtma topilmadi"}

    # sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
    #                   + amount + action + sign_time)
    expected = _click_signature(
        form.get("click_trans_id"),
        form.get("service_id"),
        secret,
        form.get("merchant_trans_id"),
        form.get("amount"),
        form.get("action"),
        form.get("sign_time"),
    )
    if not _click_sign_ok(expected, form.get("sign_string")):
        return {"error": CLICK_ERR_SIGN, "error_note": "Imzo noto'g'ri"}

    amount = _safe_float(form.get("amount"))
    if amount is None or abs(amount - (order.amount or 0)) > 0.01:
        return {"error": CLICK_ERR_AMOUNT, "error_note": "Summa mos kelmadi"}
    if order.status == "paid":
        return {"error": CLICK_ERR_ALREADY_PAID, "error_note": "Allaqachon to'langan"}
    if order.status == "cancelled":
        return {"error": CLICK_ERR_CANCELLED, "error_note": "Buyurtma bekor qilingan"}

    order.provider = "click"
    order.provider_transaction_id = form.get("click_trans_id")
    db.commit()
    return {
        "error": 0,
        "error_note": "Success",
        "click_trans_id": form.get("click_trans_id"),
        "merchant_trans_id": str(order.id),
        "merchant_prepare_id": order.id,
    }


def complete(db: Session, form: dict) -> dict:
    secret = _click_secret()
    if not secret:
        logger.error("CLICK_SECRET_KEY sozlanmagan — click/complete rad etildi")
        return {"error": CLICK_ERR_SIGN, "error_note": "Integratsiya sozlanmagan"}

    order = _click_find_order(db, form.get("merchant_trans_id"))
    if not order:
        return {"error": CLICK_ERR_ORDER_NOT_FOUND, "error_note": "Buyurtma topilmadi"}

    expected = _click_signature(
        form.get("click_trans_id"),
        form.get("service_id"),
        secret,
        form.get("merchant_trans_id"),
        form.get("merchant_prepare_id"),
        form.get("amount"),
        form.get("action"),
        form.get("sign_time"),
    )
    if not _click_sign_ok(expected, form.get("sign_string")):
        return {"error": CLICK_ERR_SIGN, "error_note": "Imzo noto'g'ri"}

    # error < 0 → Click bekor qildi (yoki pul qaytarildi)
    if (_safe_int(form.get("error")) or 0) < 0:
        # Bekor qilinganda kirish ham yopiladi
        _revoke_access(db, order)
        db.commit()
        return {"error": CLICK_ERR_CANCELLED, "error_note": "Tranzaksiya bekor qilindi"}

    # Summa tekshiruvi
    amount = _safe_float(form.get("amount"))
    if amount is None or abs(amount - (order.amount or 0)) > 0.01:
        return {"error": CLICK_ERR_AMOUNT, "error_note": "Summa mos kelmadi"}

    if order.status == "cancelled":
        return {"error": CLICK_ERR_CANCELLED, "error_note": "Buyurtma bekor qilingan"}

    if order.status != "paid":
        _grant_access(db, order)
    db.commit()
    return {
        "error": 0,
        "error_note": "Success",
        "click_trans_id": form.get("click_trans_id"),
        "merchant_trans_id": str(order.id),
        "merchant_confirm_id": order.id,
    }
