"""Provayder checkout sahifasiga redirect URL yasash.

Alohida modulda, chunki bu URL'ni ikkita router ishlatadi: `payments.checkout`
va `checkout_experience` (quote/retry). Ilgari `checkout_experience` boshqa
routerdan `_build_pay_url` private funksiyasini import qilishga majbur edi.
"""

import base64

from fastapi import HTTPException

from app.core.config import settings
from app.models.order import Order


def build_pay_url(provider: str, order: Order) -> str:
    if provider == "payme":
        # Payme summani tiyinda kutadi: so'm * 100
        raw = (
            f"m={settings.PAYME_MERCHANT_ID};"
            f"ac.order_id={order.id};"
            f"a={order.amount * 100}"
        )
        encoded = base64.b64encode(raw.encode()).decode()
        return f"{settings.PAYME_CHECKOUT_URL}/{encoded}"

    if provider == "click":
        return (
            f"{settings.CLICK_CHECKOUT_URL}"
            f"?service_id={settings.CLICK_SERVICE_ID}"
            f"&merchant_id={settings.CLICK_MERCHANT_ID}"
            f"&amount={order.amount}"
            f"&transaction_param={order.id}"
            f"&return_url={settings.FRONTEND_URL}/tolov/natija/{order.id}"
        )

    raise HTTPException(status_code=400, detail="Noma'lum to'lov provayderi")
