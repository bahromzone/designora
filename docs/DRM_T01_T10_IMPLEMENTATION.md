# DRM T01 + T10 implementation

## T01: raw media browserga chiqmasin

DRM yoqilganda:

- local static video upload endpointi `410` qaytaradi;
- multipart upload tugagach original public URL lesson’ga yozilmaydi;
- raw signing endpointi ishlamaydi;
- student playback faqat encrypted HLS `.m3u8` yoki DASH `.mpd` manifest orqali ishlaydi;
- MP4/WebM/MOV/M4V asset `ready` holatiga o‘ta olmaydi;
- public CDN/object-storage URL’lari keyingi infra bosqichida private ACL bilan yopiladi.

## T10: encryption/package qilinmagan video publish bo‘lmasin

Multipart upload endi videoni `uploaded` holatida qoldiradi. Bu `ready` degani emas. Keyingi worker/provider pipeline quyidagilarni bajarishi kerak:

```text
uploaded -> queued -> transcoding -> encrypting -> ready
                                      \-> failed
```

`DRM_ENABLED=true` bo‘lganda course builder checklist quyidagilarni talab qiladi:

- lesson content yoki encrypted manifest mavjud;
- `processing_status=ready`;
- manifest `.m3u8` yoki `.mpd`;
- raw `video_url` bilan bulk lesson yaratish bloklangan;
- `processing=ready` faqat encrypted HLS/DASH manifest bo‘lsa qabul qilinadi.

## Qolgan ish

Bu patch encryption workerning o‘zi emas. Keyingi bosqichda PallyCon packaging webhook/worker qo‘shiladi: u upload key’ni oladi, encrypted renditions yaratadi, lesson’ga faqat encrypted manifest URL’ni yozadi va `processing_status=ready` qiladi. Provider tasdig‘isiz `ready` statusini qo‘lda berish production’da taqiqlanadi.
