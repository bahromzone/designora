"""Fayl yuklash validatsiyasi birlik testlari (XAVFSIZLIK) — DB'siz."""

import pytest

from app.services.upload_service import (
    UploadValidationError,
    get_extension,
    sniff_matches,
    validate_assignment_file,
    validate_avatar,
)

_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
_JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
_PDF = b"%PDF-1.7\n" + b"\x00" * 32


def test_get_extension():
    assert get_extension("photo.PNG") == "png"
    assert get_extension("a.b.jpeg") == "jpeg"
    assert get_extension("noext") == ""
    assert get_extension("") == ""


def test_sniff_matches():
    assert sniff_matches(_PNG, "png") is True
    assert sniff_matches(_JPG, "png") is False
    # noma'lum imzo — kengaytma bo'yicha ruxsat
    assert sniff_matches(b"anything", "txt") is True


def test_validate_avatar_ok():
    assert validate_avatar("me.png", _PNG) == "png"
    assert validate_avatar("me.jpg", _JPG) == "jpg"


def test_validate_avatar_rejects_wrong_extension():
    with pytest.raises(UploadValidationError):
        validate_avatar("virus.exe", _PNG)


def test_validate_avatar_rejects_fake_content():
    # .png deb nomlangan, lekin ichida PDF
    with pytest.raises(UploadValidationError):
        validate_avatar("fake.png", _PDF)


def test_validate_avatar_rejects_empty():
    with pytest.raises(UploadValidationError):
        validate_avatar("empty.png", b"")


def test_validate_avatar_rejects_too_large():
    big = _PNG[:8] + b"\x00" * (3 * 1024 * 1024)
    with pytest.raises(UploadValidationError):
        validate_avatar("big.png", big)


def test_validate_assignment_allows_pdf():
    assert validate_assignment_file("topshiriq.pdf", _PDF) == "pdf"


def test_validate_assignment_rejects_unknown():
    with pytest.raises(UploadValidationError):
        validate_assignment_file("script.sh", b"#!/bin/sh\n")
