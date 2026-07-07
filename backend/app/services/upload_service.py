"""Fayl yuklash validatsiyasi — tur / hajm / magic-bytes (XAVFSIZLIK bloki).

Sof funksiyalar, DB'siz — to'liq unit-test qilinadi. Fayl kengaytmasi, hajmi va
haqiqiy kontent turini (magic bytes / signature sniffing) tekshiradi, shunda
kengaytmasi almashtirilgan zararli fayllar ham aniqlanadi.
"""

from __future__ import annotations

# Ruxsat etilgan turlar: kengaytma → (MIME, ruxsat berilgan magic-bytes ro'yxati)
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
DOCUMENT_EXTENSIONS = {"pdf", "zip", "doc", "docx", "ppt", "pptx"}

MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2 MB
MAX_ASSIGNMENT_BYTES = 20 * 1024 * 1024  # 20 MB

# Fayl imzolari (magic bytes) — kontent turini haqiqatan tekshirish uchun
_SIGNATURES: dict[str, list[bytes]] = {
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "gif": [b"GIF87a", b"GIF89a"],
    "webp": [b"RIFF"],  # RIFF....WEBP
    "pdf": [b"%PDF-"],
    "zip": [b"PK\x03\x04", b"PK\x05\x06"],
    # docx/pptx aslida zip konteyner
    "docx": [b"PK\x03\x04"],
    "pptx": [b"PK\x03\x04"],
    "doc": [b"\xd0\xcf\x11\xe0"],
    "ppt": [b"\xd0\xcf\x11\xe0"],
}


class UploadValidationError(ValueError):
    """Fayl validatsiyasi muvaffaqiyatsiz bo'lganda ko'tariladi."""


def get_extension(filename: str) -> str:
    """Fayl nomidan kichik harfli kengaytmani ajratadi (nuqtasiz)."""
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1].lower().strip()


def sniff_matches(content: bytes, ext: str) -> bool:
    """Fayl boshidagi baytlar kengaytmaning imzosiga mos kelishini tekshiradi.

    Imzo ma'lum bo'lmagan kengaytma uchun True (faqat kengaytma bo'yicha ruxsat).
    """
    signatures = _SIGNATURES.get(ext)
    if not signatures:
        return True
    return any(content.startswith(sig) for sig in signatures)


def validate_upload(
    filename: str,
    content: bytes,
    *,
    allowed_extensions: set[str],
    max_bytes: int,
) -> str:
    """Faylni tekshiradi. Muvaffaqiyatli bo'lsa normallashgan kengaytma qaytaradi.

    Aks holda `UploadValidationError` ko'taradi.
    """
    ext = get_extension(filename)
    if not ext:
        raise UploadValidationError("Fayl kengaytmasi aniqlanmadi")
    if ext not in allowed_extensions:
        allowed = ", ".join(sorted(allowed_extensions))
        raise UploadValidationError(
            f"Ruxsat etilmagan fayl turi: .{ext} (ruxsat: {allowed})"
        )
    size = len(content)
    if size == 0:
        raise UploadValidationError("Fayl bo'sh")
    if size > max_bytes:
        mb = max_bytes / (1024 * 1024)
        raise UploadValidationError(f"Fayl hajmi {mb:.0f} MB dan oshmasligi kerak")
    if not sniff_matches(content, ext):
        raise UploadValidationError(
            "Fayl mazmuni kengaytmaga mos kelmaydi (buzilgan yoki soxta fayl)"
        )
    return ext


def validate_avatar(filename: str, content: bytes) -> str:
    return validate_upload(
        filename,
        content,
        allowed_extensions=IMAGE_EXTENSIONS,
        max_bytes=MAX_AVATAR_BYTES,
    )


def validate_assignment_file(filename: str, content: bytes) -> str:
    return validate_upload(
        filename,
        content,
        allowed_extensions=IMAGE_EXTENSIONS | DOCUMENT_EXTENSIONS,
        max_bytes=MAX_ASSIGNMENT_BYTES,
    )
