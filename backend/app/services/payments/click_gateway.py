"""Click Merchant API (Prepare/Complete) transport qatlami.

Bu modul FAQAT protokol bilan ishlaydi: kalit, imzo va xato kodlari. Kursga
kirish `access.py` da beriladi.
"""

import hashlib
import hmac
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.services.payments.primitives import safe_int

logger = logging.getLogger(__name__)

# Click xato kodlari
ERR_SIGN = -1
ERR_AMOUNT = -2
ERR_ALREADY_PAID = -4
ERR_ORDER_NOT_FOUND = -5
ERR_CANCELLED = -9


def secret() -> str:
    """Fail closed uchun: bo'sh kalit bilan imzoni har kim hisoblab chiqaradi.

    Ya'ni kalit sozlanmagan hostda to'lovsiz "Complete" yuborib kurs ochib
    olish mumkin bo'lardi. Chaqiruvchi bo'sh natijada webhook'ni rad etadi.
    """
    return (settings.CLICK_SECRET_KEY or "").strip()


def signature(*parts) -> str:
    """Click imzosi: md5(qismlar ketma-ketligi).

    md5 tanlov emas, Click Merchant API spetsifikatsiyasi talabi.
    """
    return hashlib.md5(
        "".join(str(p) for p in parts).encode()
    ).hexdigest()  # noqa: S324


def signature_matches(expected: str, received) -> bool:
    return hmac.compare_digest(expected, str(received or ""))


def find_order(db: Session, order_id_raw) -> Order | None:
    order_id = safe_int(order_id_raw)
    if not order_id:
        return None
    return db.query(Order).filter(Order.id == order_id).first()


def not_configured(stage: str) -> dict:
    logger.error("CLICK_SECRET_KEY sozlanmagan — click/%s rad etildi", stage)
    return {"error": ERR_SIGN, "error_note": "Integratsiya sozlanmagan"}


def failure(code: int, note: str) -> dict:
    return {"error": code, "error_note": note}


def success(order: Order, click_trans_id, **extra) -> dict:
    """Click muvaffaqiyatli javobi. `extra` bosqichga xos maydon uchun."""
    return {
        "error": 0,
        "error_note": "Success",
        "click_trans_id": click_trans_id,
        "merchant_trans_id": str(order.id),
        **extra,
    }
