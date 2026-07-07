"""Ko'p tillilik (i18n) — uz / ru / en (BOSQICH 5).

Sof funksiyalar, DB'siz — to'liq unit-test qilinadi. Interfeys kalitlari uchun
tarjimalar katalogi; noma'lum kalit yoki til uchun xavfsiz zaxira.
"""

from __future__ import annotations

SUPPORTED_LANGUAGES = ["uz", "ru", "en"]
DEFAULT_LANGUAGE = "uz"

TRANSLATIONS: dict[str, dict[str, str]] = {
    "uz": {
        "welcome": "Xush kelibsiz",
        "courses": "Kurslar",
        "my_courses": "Mening kurslarim",
        "sign_in": "Kirish",
        "sign_up": "Ro'yxatdan o'tish",
        "search": "Qidirish",
        "certificate": "Sertifikat",
        "enroll": "Ro'yxatdan o'tish",
        "price_free": "Bepul",
        "leaderboard": "Reyting",
        "reviews": "Sharhlar",
    },
    "ru": {
        "welcome": "Добро пожаловать",
        "courses": "Курсы",
        "my_courses": "Мои курсы",
        "sign_in": "Вход",
        "sign_up": "Регистрация",
        "search": "Поиск",
        "certificate": "Сертификат",
        "enroll": "Записаться",
        "price_free": "Бесплатно",
        "leaderboard": "Рейтинг",
        "reviews": "Отзывы",
    },
    "en": {
        "welcome": "Welcome",
        "courses": "Courses",
        "my_courses": "My courses",
        "sign_in": "Sign in",
        "sign_up": "Sign up",
        "search": "Search",
        "certificate": "Certificate",
        "enroll": "Enroll",
        "price_free": "Free",
        "leaderboard": "Leaderboard",
        "reviews": "Reviews",
    },
}


def normalize_language(lang: str | None) -> str:
    """Til kodini qo'llab-quvvatlanadigan qiymatga keltiradi."""
    if not lang:
        return DEFAULT_LANGUAGE
    code = lang.strip().lower()[:2]
    return code if code in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def translate(key: str, lang: str | None = None) -> str:
    """Kalitni berilgan tilga tarjima qiladi (zaxira: uz, keyin kalitning o'zi)."""
    lang = normalize_language(lang)
    catalog = TRANSLATIONS.get(lang, {})
    if key in catalog:
        return catalog[key]
    return TRANSLATIONS[DEFAULT_LANGUAGE].get(key, key)


def get_catalog(lang: str | None = None) -> dict[str, str]:
    """Til uchun to'liq katalog (uz zaxira ustiga birlashtirilgan)."""
    lang = normalize_language(lang)
    return {**TRANSLATIONS[DEFAULT_LANGUAGE], **TRANSLATIONS.get(lang, {})}
