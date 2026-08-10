"""Backward-compatible shim for the canonical payment access service."""

from app.services.payments.access import grant_access, revoke_access

__all__ = ["grant_access", "revoke_access"]
