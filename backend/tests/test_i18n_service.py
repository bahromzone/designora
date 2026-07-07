"""i18n xizmati birlik testlari (BOSQICH 5) — DB'siz."""

from app.services.i18n_service import (
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    get_catalog,
    normalize_language,
    translate,
)


def test_supported_languages():
    assert set(SUPPORTED_LANGUAGES) == {"uz", "ru", "en"}
    assert DEFAULT_LANGUAGE == "uz"


def test_normalize_language():
    assert normalize_language("ru") == "ru"
    assert normalize_language("EN") == "en"
    assert normalize_language("ru-RU") == "ru"
    assert normalize_language(None) == "uz"
    assert normalize_language("fr") == "uz"  # qo'llab-quvvatlanmaydi -> default


def test_translate_known_key():
    assert translate("courses", "en") == "Courses"
    assert translate("courses", "ru") == "Курсы"
    assert translate("courses", "uz") == "Kurslar"


def test_translate_falls_back_to_default_then_key():
    # noma'lum til -> default (uz)
    assert translate("welcome", "fr") == "Xush kelibsiz"
    # noma'lum kalit -> kalitning o'zi
    assert translate("nonexistent_key", "en") == "nonexistent_key"


def test_get_catalog_merges_over_default():
    catalog = get_catalog("en")
    assert catalog["search"] == "Search"
    # barcha kalitlar mavjud (default'dan to'ldirilgan)
    assert set(catalog.keys()) >= {"welcome", "courses", "certificate"}
