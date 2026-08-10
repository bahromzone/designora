"""Payme Merchant API (JSON-RPC 2.0) gateway.

Router faqat HTTP qatlamini ushlab turadi: body'ni o'qiydi va Authorization
sarlavhasini uzatadi. Protokol mantiqi — auth, holat mashinasi, summa
tekshiruvi va xato kodlari — shu modulda.

XAVFSIZLIK: PAYME_KEY sozlanmagan bo'lsa webhook HAR DOIM rad etiladi
(fail closed). Aks holda istalgan odam "to'ladim" deb so'rov yuborib
pullik kursni bepul ocha olardi.
"""

import base64
import hmac
import logging
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order
from app.services.payment_service import grant_access as _grant_access
from app.services.payment_service import revoke_access as _revoke_access

logger = logging.getLogger(__name__)

# Payme holat kodlari
PAYME_STATE_CREATED = 1
PAYME_STATE_PERFORMED = 2

# Payme JSON-RPC xato kodlari
PAYME_ERR_INSUFFICIENT_PRIVILEGE = -32504
PAYME_ERR_METHOD_NOT_FOUND = -32601
PAYME_ERR_INVALID_AMOUNT = -31001
PAYME_ERR_ACCOUNT_NOT_FOUND = -31050
PAYME_ERR_CANNOT_PERFORM = -31008
PAYME_ERR_TRANSACTION_NOT_FOUND = -31003


def _now():
    return datetime.now(UTC)


def _safe_int(value) -> int | None:
    """Webhook'dan kelgan qiymatni xavfsiz int'ga o'giradi (500 o'rniga None)."""
    try:
        return int(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def authorize(header: str) -> bool:
    """Authorization: Basic base64('Paycom:<PAYME_KEY>').

    Ikkita kritik shart:
    1. Kalit bo'sh bo'lsa webhook butunlay rad etiladi (fail closed).
    2. Solishtirish `==` o'rniga hmac.compare_digest — timing attack yopiq.
    """
    expected_key = (settings.PAYME_KEY or "").strip()
    if not expected_key:
        logger.error("PAYME_KEY sozlanmagan — payme webhook rad etildi")
        return False

    if not header.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(header[6:]).decode()
        _, key = decoded.split(":", 1)
    except Exception:
        return False
    return hmac.compare_digest(key, expected_key)


def _payme_error(req_id, code, message):
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {
            "code": code,
            "message": {"uz": message, "ru": message, "en": message},
        },
    }


def _payme_find_order(db: Session, params: dict) -> Order | None:
    account = params.get("account") or {}
    order_id = _safe_int(account.get("order_id"))
    if not order_id:
        return None
    return db.query(Order).filter(Order.id == order_id).first()


def _payme_find_by_txn(db: Session, txn: str) -> Order | None:
    if not txn:
        return None
    return db.query(Order).filter(Order.provider_transaction_id == txn).first()


def handle(db: Session, body: dict, authorization: str) -> dict:
    """JSON-RPC so'rovni bajaradi. Javob har doim HTTP 200, xato body ichida."""
    req_id = body.get("id")
    method = body.get("method")
    params = body.get("params") or {}

    if not authorize(authorization):
        return _payme_error(req_id, PAYME_ERR_INSUFFICIENT_PRIVILEGE, "Ruxsat yo'q")

    # ── CheckPerformTransaction ──
    if method == "CheckPerformTransaction":
        order = _payme_find_order(db, params)
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_ACCOUNT_NOT_FOUND, "Buyurtma topilmadi"
            )
        if params.get("amount") != order.amount * 100:
            return _payme_error(req_id, PAYME_ERR_INVALID_AMOUNT, "Summa noto'g'ri")
        return {"jsonrpc": "2.0", "id": req_id, "result": {"allow": True}}

    # ── CreateTransaction ──
    if method == "CreateTransaction":
        order = _payme_find_order(db, params)
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_ACCOUNT_NOT_FOUND, "Buyurtma topilmadi"
            )
        if params.get("amount") != order.amount * 100:
            return _payme_error(req_id, PAYME_ERR_INVALID_AMOUNT, "Summa noto'g'ri")

        txn = params.get("id")
        if order.provider_transaction_id and order.provider_transaction_id != txn:
            return _payme_error(
                req_id, PAYME_ERR_CANNOT_PERFORM, "Boshqa tranzaksiya mavjud"
            )
        if order.status == "cancelled":
            return _payme_error(
                req_id, PAYME_ERR_CANNOT_PERFORM, "Buyurtma bekor qilingan"
            )

        order.provider = "payme"
        order.provider_transaction_id = txn
        order.provider_state = PAYME_STATE_CREATED
        db.commit()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "create_time": int(_now().timestamp() * 1000),
                "transaction": str(order.id),
                "state": PAYME_STATE_CREATED,
            },
        }

    # ── PerformTransaction ──
    if method == "PerformTransaction":
        order = _payme_find_by_txn(db, params.get("id"))
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
            )
        # Bekor qilingan buyurtmani qayta "to'landi" qilib bo'lmaydi
        if order.status == "cancelled":
            return _payme_error(
                req_id, PAYME_ERR_CANNOT_PERFORM, "Tranzaksiya bekor qilingan"
            )
        if order.provider_state != PAYME_STATE_PERFORMED:
            _grant_access(db, order)
            order.provider_state = PAYME_STATE_PERFORMED
            db.commit()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "perform_time": int((order.paid_at or _now()).timestamp() * 1000),
                "transaction": str(order.id),
                "state": PAYME_STATE_PERFORMED,
            },
        }

    # ── CancelTransaction ──
    if method == "CancelTransaction":
        order = _payme_find_by_txn(db, params.get("id"))
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
            )
        # Bekor holati: yaratilgan bo'lsa -1, bajarilgan bo'lsa -2
        cancel_state = -abs(order.provider_state or 1)
        # Statusni o'zgartirish yetarli emas — Enrollment ham bekor qilinishi
        # kerak, aks holda refunddan keyin kurs ochiq qoladi.
        _revoke_access(db, order, reason=params.get("reason"))
        order.provider_state = cancel_state
        db.commit()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "cancel_time": order.cancel_time_ms,
                "transaction": str(order.id),
                "state": order.provider_state,
            },
        }

    # ── CheckTransaction ──
    if method == "CheckTransaction":
        order = _payme_find_by_txn(db, params.get("id"))
        if not order:
            return _payme_error(
                req_id, PAYME_ERR_TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi"
            )
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "create_time": int(order.created_at.timestamp() * 1000),
                "perform_time": (
                    int(order.paid_at.timestamp() * 1000) if order.paid_at else 0
                ),
                "cancel_time": order.cancel_time_ms or 0,
                "transaction": str(order.id),
                "state": order.provider_state or 0,
                "reason": order.cancel_reason,
            },
        }

    return _payme_error(req_id, PAYME_ERR_METHOD_NOT_FOUND, "Metod topilmadi")
