"""Payme Merchant API (JSON-RPC 2.0) transport qatlami.

Bu modul FAQAT protokol bilan ishlaydi: autentifikatsiya, javob konverti,
holat va xato kodlari, order izlash. Kursga kirish `access.py` da beriladi.
"""

import base64
import hmac
import logging

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.services.payments.primitives import safe_int

logger = logging.getLogger(__name__)

# Tranzaksiya holatlari
STATE_CREATED = 1
STATE_PERFORMED = 2

# JSON-RPC xato kodlari
ERR_INSUFFICIENT_PRIVILEGE = -32504
ERR_METHOD_NOT_FOUND = -32601
ERR_INVALID_AMOUNT = -31001
ERR_ACCOUNT_NOT_FOUND = -31050
ERR_CANNOT_PERFORM = -31008
ERR_TRANSACTION_NOT_FOUND = -31003


def authorize(request: Request) -> bool:
    """`Authorization: Basic base64("Paycom:<PAYME_KEY>")` tekshiruvi.

    Fail closed: PAYME_KEY sozlanmagan bo'lsa webhook BUTUNLAY rad etiladi.
    Aks holda kalitsiz hostda istalgan odam "Paycom:" yuborib pullik kursni
    ocha olardi. Solishtirish `hmac.compare_digest` bilan, ya'ni javob vaqti
    kalitning to'g'ri belgilari soniga bog'liq emas.
    """
    expected_key = (settings.PAYME_KEY or "").strip()
    if not expected_key:
        logger.error("PAYME_KEY sozlanmagan — payme webhook rad etildi")
        return False

    header = request.headers.get("Authorization", "")
    if not header.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(header[6:]).decode()
        _, key = decoded.split(":", 1)
    except Exception:
        return False
    return hmac.compare_digest(key, expected_key)


def error(req_id, code: int, message: str) -> dict:
    """JSON-RPC xato konverti. Payme uchta tilda matn kutadi."""
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {
            "code": code,
            "message": {"uz": message, "ru": message, "en": message},
        },
    }


def result(req_id, payload: dict) -> dict:
    return {"jsonrpc": "2.0", "id": req_id, "result": payload}


def find_order(db: Session, params: dict) -> Order | None:
    """`params.account.order_id` orqali order topadi."""
    account = params.get("account") or {}
    if not isinstance(account, dict):
        return None
    order_id = safe_int(account.get("order_id"))
    if not order_id:
        return None
    return db.query(Order).filter(Order.id == order_id).first()


def find_by_transaction(db: Session, txn) -> Order | None:
    if not txn:
        return None
    return db.query(Order).filter(Order.provider_transaction_id == txn).first()


def amount_matches(params: dict, order: Order) -> bool:
    """Payme summani tiyinda yuboradi, bazada so'mda saqlanadi."""
    return params.get("amount") == order.amount * 100
