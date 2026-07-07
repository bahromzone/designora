"""Video signed URL xizmati birlik testlari (BOSQICH 5) — DB'siz."""

from app.services.video_service import (
    build_signed_url,
    sign_path,
    verify_signed,
)

_SECRET = "test-signing-key"


def test_sign_is_deterministic():
    a = sign_path("/video/1.mp4", 1000, _SECRET)
    b = sign_path("/video/1.mp4", 1000, _SECRET)
    assert a == b


def test_sign_changes_with_inputs():
    base = sign_path("/video/1.mp4", 1000, _SECRET)
    assert sign_path("/video/2.mp4", 1000, _SECRET) != base
    assert sign_path("/video/1.mp4", 2000, _SECRET) != base
    assert sign_path("/video/1.mp4", 1000, "other-key") != base


def test_build_and_verify_roundtrip():
    signed = build_signed_url(
        "/video/1.mp4", _SECRET, base_url="https://cdn.uz", ttl_seconds=100, now=1000
    )
    assert signed["expires"] == 1100
    assert signed["url"].startswith("https://cdn.uz/video/1.mp4?expires=1100&token=")
    ok = verify_signed(
        "/video/1.mp4", signed["expires"], signed["token"], _SECRET, now=1050
    )
    assert ok is True


def test_verify_rejects_expired():
    signed = build_signed_url("/v.mp4", _SECRET, ttl_seconds=100, now=1000)
    assert (
        verify_signed("/v.mp4", signed["expires"], signed["token"], _SECRET, now=5000)
        is False
    )


def test_verify_rejects_tampered_token():
    signed = build_signed_url("/v.mp4", _SECRET, ttl_seconds=100, now=1000)
    assert (
        verify_signed("/v.mp4", signed["expires"], "deadbeef", _SECRET, now=1050)
        is False
    )
