# Designora DRM pilot: PallyCon

This branch adds the backend contract for a PallyCon multi-DRM pilot. It deliberately does not enable DRM by default and it never stores provider secrets in the frontend.

## Required provider setup

Create a PallyCon tenant and obtain the provider-specific packaging and license values for:

- Widevine: Chrome, Firefox and Android
- FairPlay Streaming: Safari and iOS
- PlayReady: Edge and supported Windows devices

The exact PallyCon license URLs and FairPlay certificate URL are tenant-specific. Put them only in `backend/.env` or the deployment secret manager:

```env
DRM_ENABLED=true
DRM_PROVIDER=pallycon
DRM_MANIFEST_BASE_URL=https://your-drm-cdn.example
DRM_WIDEVINE_LICENSE_URL=https://your-pallycon-tenant.example/widevine
DRM_FAIRPLAY_LICENSE_URL=https://your-pallycon-tenant.example/fairplay
DRM_FAIRPLAY_CERTIFICATE_URL=https://your-pallycon-tenant.example/fairplay/certificate
DRM_PLAYREADY_LICENSE_URL=https://your-pallycon-tenant.example/playready
```

## Playback contract

`POST /api/media/lessons/{lesson_id}/drm-manifest` checks authentication and enrollment, disables caching, and returns a short-lived playback configuration. The lesson must point to an encrypted HLS `.m3u8` or DASH `.mpd` manifest. Raw MP4 playback is rejected once `DRM_ENABLED=true`.

## Rollout

1. Package one staging lesson to CMAF/CENC and upload only the encrypted manifest and segments.
2. Configure the PallyCon license endpoints and validate Chrome, Firefox, Edge, Safari and Android/iOS.
3. Add the provider's browser EME/player adapter and request licenses only after enrollment checks.
4. Migrate lessons in batches; do not delete raw originals until encrypted playback passes monitoring.
5. Enable `DRM_ENABLED=true` only after the staging pilot is green.

DRM blocks direct file downloads, but screen recording and compromised devices still require forensic watermarking and incident monitoring.