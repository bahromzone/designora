"""Fayl yuklash validatsiyasi: tur, hajm va magic-bytes."""

from __future__ import annotations

IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
DOCUMENT_EXTENSIONS = {"pdf", "zip", "doc", "docx", "ppt", "pptx"}
VIDEO_EXTENSIONS = {"mp4", "webm", "mov", "m4v"}

MAX_AVATAR_BYTES = 2 * 1024 * 1024
MAX_ASSIGNMENT_BYTES = 20 * 1024 * 1024
MAX_VIDEO_BYTES = 512 * 1024 * 1024

_SIGNATURES: dict[str, list[bytes]] = {
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "gif": [b"GIF87a", b"GIF89a"],
    "webp": [b"RIFF"],
    "pdf": [b"%PDF-"],
    "zip": [b"PK\x03\x04", b"PK\x05\x06"],
    "docx": [b"PK\x03\x04"],
    "pptx": [b"PK\x03\x04"],
    "doc": [b"\xd0\xcf\x11\xe0"],
    "ppt": [b"\xd0\xcf\x11\xe0"],
    "mp4": [b"ftyp"],
    "m4v": [b"ftyp"],
    "mov": [b"ftyp"],
    "webm": [b"\x1a\x45\xdf\xa3"],
}


class UploadValidationError(ValueError):
    pass


def get_extension(filename: str) -> str:
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1].lower().strip()


def sniff_matches(content: bytes, ext: str) -> bool:
    signatures = _SIGNATURES.get(ext)
    if not signatures:
        return True
    # MP4/MOV/M4V ftyp is normally at byte 4, not byte 0.
    if ext in {"mp4", "mov", "m4v"}:
        return any(content[4:12].startswith(sig) for sig in signatures)
    return any(content.startswith(sig) for sig in signatures)


def validate_upload(filename: str, content: bytes, *, allowed_extensions: set[str], max_bytes: int) -> str:
    ext = get_extension(filename)
    if not ext:
        raise UploadValidationError("Fayl kengaytmasi aniqlanmadi")
    if ext not in allowed_extensions:
        raise UploadValidationError(f"Ruxsat etilmagan fayl turi: .{ext}")
    if not content:
        raise UploadValidationError("Fayl bo'sh")
    if len(content) > max_bytes:
        raise UploadValidationError(f"Fayl hajmi {max_bytes / (1024 * 1024):.0f} MB dan oshmasligi kerak")
    if not sniff_matches(content, ext):
        raise UploadValidationError("Fayl mazmuni kengaytmaga mos kelmaydi")
    return ext


def validate_avatar(filename: str, content: bytes) -> str:
    return validate_upload(filename, content, allowed_extensions=IMAGE_EXTENSIONS, max_bytes=MAX_AVATAR_BYTES)


def validate_assignment_file(filename: str, content: bytes) -> str:
    return validate_upload(filename, content, allowed_extensions=IMAGE_EXTENSIONS | DOCUMENT_EXTENSIONS, max_bytes=MAX_ASSIGNMENT_BYTES)


def validate_video(filename: str, content: bytes) -> str:
    return validate_upload(filename, content, allowed_extensions=VIDEO_EXTENSIONS, max_bytes=MAX_VIDEO_BYTES)
