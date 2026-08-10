"""To'lov webhooklari uchun umumiy mayda yordamchilar.

Webhook payload'i tashqi tizimdan keladi va ishonchsiz: har qanday maydon
yo'q, bo'sh yoki butunlay boshqa tipda bo'lishi mumkin. Shuning uchun tipga
o'girish 500 bermaydi, `None` qaytaradi va chaqiruvchi to'g'ri provayder xato
kodi bilan javob beradi.
"""

from datetime import UTC, datetime


def now() -> datetime:
    return datetime.now(UTC)


def to_millis(value: datetime | None = None) -> int:
    """Payme ham, Click ham vaqtni millisekundli epoch'da kutadi."""
    return int((value or now()).timestamp() * 1000)


def safe_int(value) -> int | None:
    """Webhook qiymatini xavfsiz int'ga o'giradi (500 o'rniga None)."""
    try:
        return int(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def safe_float(value) -> float | None:
    """Webhook qiymatini xavfsiz float'ga o'giradi (500 o'rniga None)."""
    try:
        return float(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None
