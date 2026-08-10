"""DEPRECATED — `app.services.payments` ishlatilsin.

Bu modul `routers/payments.py` bilan bir vaqtda yashagan IKKINCHI, undan farq
qiladigan `grant_access()` nusxasi edi va hech qayerdan chaqirilmasdi.
Nusxadagi idempotentlik tekshiruvi `if ...: pass` bilan tugagani uchun,
ishlatilganda har chaqiruvda ortiqcha `Payment` yozuvi yaratardi va kupon
hisoblagichini umuman ko'rmasdi.

Dublikat olib tashlandi. Modul yagona implementatsiyaga yo'naltiriladi, shunda
uni import qiluvchi kod bo'lsa ham sinmaydi.
"""

from app.services.payments.access import grant_access, revoke_access

__all__ = ["grant_access", "revoke_access"]
