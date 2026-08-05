"""Stream upload validation tests."""

import pytest

from app.services.upload_service import UploadValidationError, validate_upload_metadata


_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 56


def test_metadata_validation_uses_size_and_prefix_only():
    assert (
        validate_upload_metadata(
            "avatar.png",
            _PNG,
            2 * 1024 * 1024,
            allowed_extensions={"png"},
            max_bytes=2 * 1024 * 1024,
        )
        == "png"
    )


def test_metadata_validation_rejects_oversized_stream():
    with pytest.raises(UploadValidationError):
        validate_upload_metadata(
            "avatar.png",
            _PNG,
            2 * 1024 * 1024 + 1,
            allowed_extensions={"png"},
            max_bytes=2 * 1024 * 1024,
        )
