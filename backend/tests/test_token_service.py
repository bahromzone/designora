"""Refresh-token yordamchilari birlik testlari (XAVFSIZLIK) — DB'siz."""

from datetime import UTC, datetime

from app.services.token_service import (
    generate_refresh_token,
    hash_token,
    refresh_expiry,
)


def test_generated_tokens_are_unique():
    a = generate_refresh_token()
    b = generate_refresh_token()
    assert a != b
    assert len(a) > 30


def test_hash_is_deterministic_and_hex():
    t = generate_refresh_token()
    assert hash_token(t) == hash_token(t)
    assert len(hash_token(t)) == 64  # sha256 hex


def test_hash_differs_per_token():
    assert hash_token("a") != hash_token("b")


def test_refresh_expiry_in_future():
    assert refresh_expiry(7) > datetime.now(UTC)
