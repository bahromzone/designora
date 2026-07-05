"""Parol hashing (bcrypt) testlari."""

from app.core.password import _truncate, hash_password, verify_password


def test_hash_is_not_plaintext():
    hashed = hash_password("Secret123")
    assert hashed != "Secret123"
    assert hashed.startswith("$2")  # bcrypt prefiksi


def test_verify_correct_password():
    hashed = hash_password("Secret123")
    assert verify_password("Secret123", hashed) is True


def test_verify_wrong_password():
    hashed = hash_password("Secret123")
    assert verify_password("Wrong999", hashed) is False


def test_same_password_different_hashes():
    """Bcrypt tuz (salt) tufayli har safar boshqa hash beradi."""
    assert hash_password("Secret123") != hash_password("Secret123")


def test_truncate_limits_to_72_bytes():
    long_password = "A" * 100
    assert len(_truncate(long_password)) == 72


def test_long_passwords_verify():
    """72 baytdan uzun parollar ham izchil tekshiriladi."""
    pw = "P" * 200 + "1"
    hashed = hash_password(pw)
    assert verify_password(pw, hashed) is True
