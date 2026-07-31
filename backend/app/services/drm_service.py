from __future__ import annotations

from urllib.parse import urljoin


class DRMConfigurationError(ValueError):
    pass


def _absolute(base_url: str, value: str | None) -> str | None:
    if not value:
        return None
    return urljoin(f"{base_url.rstrip('/')}/", value)


def build_playback_config(
    *,
    manifest_url: str,
    provider: str,
    base_url: str,
    widevine_license_url: str | None,
    fairplay_license_url: str | None,
    fairplay_certificate_url: str | None,
    playready_license_url: str | None,
) -> dict:
    if not manifest_url:
        raise DRMConfigurationError("DRM manifest URL is required")
    config = {
        "provider": provider,
        "manifest_url": _absolute(base_url, manifest_url),
        "systems": {
            "widevine": {
                "license_url": _absolute(base_url, widevine_license_url),
            },
            "fairplay": {
                "license_url": _absolute(base_url, fairplay_license_url),
                "certificate_url": _absolute(base_url, fairplay_certificate_url),
            },
            "playready": {
                "license_url": _absolute(base_url, playready_license_url),
            },
        },
        "download_allowed": False,
        "persistent_state_allowed": False,
    }
    return config
