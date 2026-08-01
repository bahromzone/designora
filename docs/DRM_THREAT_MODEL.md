# Designora DRM Threat Model

**Holat:** Draft security design for the PallyCon multi-DRM pilot  
**Sana:** 2026-08-01  
**Qamrov:** student video playback, instructor upload, DRM license flow, browser/native clients, storage/CDN va monitoring

## 1. Maqsad va xavfsizlik chegarasi

Designora premium dars videolarini ruxsatsiz yuklab olish, link ulashish, license o‘g‘irlash va bir account’dan ommaviy foydalanishga qarshi himoyalaydi. DRM videoni browserga oddiy MP4 sifatida bermaydi, lekin ekran oldida boshqa telefon bilan suratga olishni 100% to‘xtata olmaydi.

**Asosiy prinsip:** kontent encryption va license enforcement managed multi-DRM orqali; authentication, authorization, session, watermark, revoke, audit va incident response Designora tomonidan boshqariladi.

## 2. Aktivlar

| Aktiv | Maxfiylik | Butunlik | Mavjudlik | Himoya talabi |
|---|---:|---:|---:|---|
| Original MP4 | Yuqori | Yuqori | O‘rta | Private object storage, server-side encryption, browserga bermaslik |
| Encrypted CMAF/HLS/DASH segmentlari | Yuqori | Yuqori | Yuqori | CENC, private CDN/storage, tokenized delivery |
| HLS/DASH manifest | Yuqori | Yuqori | Yuqori | Short-lived signed access, no-cache |
| DRM license key/material | Kritik | Kritik | Yuqori | Provider vault, backend secret manager, loglarda maskalash |
| User playback session | Yuqori | Yuqori | Yuqori | Redis TTL, nonce, device binding, revoke |
| User identity/enrollment/payment holati | Yuqori | Yuqori | Yuqori | AuthN/AuthZ, minimal payload, audit |
| Watermark metadata | Yuqori | Yuqori | O‘rta | Session binding, privacy-safe rendering |
| Audit va incident loglari | O‘rta | Yuqori | Yuqori | Append-only access, retention, alerting |

## 3. Ishonch chegaralari

1. **Browser/device:** hostile environment. Foydalanuvchi DevTools, proxy, modified browser yoki rooted/jailbroken qurilma ishlatishi mumkin.
2. **Frontend JavaScript:** secret saqlanmaydi; frontenddagi har qanday signalni bypass qilish mumkin.
3. **Designora API:** access-control, session va auditning asosiy ishonch nuqtasi.
4. **DRM provider/license service:** encryption key va license policy uchun trusted external boundary.
5. **Object storage/CDN:** faqat private, signed va encrypted assetlarni yetkazadi.
6. **Admin/instructor:** yuqori huquqli actor; barcha media amallari audit qilinadi.

## 4. Threat actorlar

| Actor | Imkoniyati | Motivatsiya |
|---|---|---|
| Oddiy enrolled user | Browser, network, account | Shaxsiy nusxa yoki link ulashish |
| Account sharer | Bir accountni bir nechta qurilmada ishlatish | Kursni boshqalar bilan bo‘lishish |
| Pirat foydalanuvchi | Proxy, DevTools, automation, capture software | Ommaviy tarqatish yoki monetizatsiya |
| Compromised account | O‘g‘irlangan credential/token | Premium kontentga kirish |
| Insider instructor/admin | Upload va content access | Original assetni ko‘chirish |
| Compromised infrastructure | Storage, CI/CD yoki secret access | Mass extraction |
| Third-party provider failure | DRM/CDN/license outage | Availability va rollback xavfi |

## 5. Risklar va mitigatsiyalar

| ID | Tahdid | Ehtimol | Ta’sir | Risk | Nazorat | Qabul mezoni |
|---|---|---:|---:|---:|---|---|
| T01 | Raw MP4 URL topilib, browserdan yuklab olish | Yuqori | Yuqori | Kritik | DRM-only playback; raw URL fallback yo‘q; private bucket | Public MP4 URL ishlamaydi |
| T02 | Manifest yoki segment URL’ini boshqa userga ulashish | Yuqori | Yuqori | Kritik | 5 daqiqalik token, session binding, CDN token validation | Token boshqa session/userda ishlamaydi |
| T03 | License endpointni abuse qilish | O‘rta | Yuqori | Yuqori | Backend proxy, enrollment check, nonce, rate limit, device/session limit | Unauthorized license 401/403 oladi |
| T04 | Account sharing | Yuqori | O‘rta | Yuqori | Concurrent session limit, device registry, anomaly detection, revoke | Limitdan keyin yangi session block qilinadi |
| T05 | Screenshot yoki screen recording | Yuqori | Yuqori | Yuqori | DRM, native capture policy, visible + forensic watermark, pause/detection signals | Capture tarqalsa session aniqlanadi |
| T06 | Telefon bilan ekran suratga olish | Muqarrar | Yuqori | Yuqori | Dynamic watermark, user notification, takedown workflow | Watermarkdan account/session aniqlanadi |
| T07 | DevTools/network interception | Yuqori | Yuqori | Yuqori | HTTPS, EME/DRM, short-lived tokens, no raw key exposure | Extracted response playable bo‘lmaydi |
| T08 | Token/localStorage o‘g‘irlanishi | O‘rta | Yuqori | Yuqori | HttpOnly cookie, refresh rotation, short TTL, logout revoke | Revoke’dan keyin token ishlamaydi |
| T09 | Rooted/jailbroken yoki compromised device | O‘rta | Yuqori | Yuqori | Device integrity signal, native app policy, risk scoring | High-risk device playback cheklanadi |
| T10 | Instructor originalni noto‘g‘ri upload qiladi | O‘rta | Yuqori | Yuqori | Private upload, server-side validation, async transcode/encrypt, publish gate | Encryption ready bo‘lmasa publish block |
| T11 | Admin/CI secret leak | Past | Kritik | Yuqori | Secret manager, least privilege, rotation, secret scanning, no logs | Secretlar repo/logda yo‘q |
| T12 | Provider/CDN outage | O‘rta | Yuqori | Yuqori | Health checks, retry, status page, controlled fallback policy | Raw MP4 fallback ochilmaydi |
| T13 | Replay yoki duplicated license request | O‘rta | O‘rta | O‘rta | Nonce, request timestamp, idempotency, provider policy | Eski request qayta ishlamaydi |
| T14 | Watermark metadata orqali privacy leakage | O‘rta | O‘rta | O‘rta | Masked email, minimum PII, retention policy | Full email/secret ko‘rsatilmaydi |
| T15 | Upload abuse yoki malware | O‘rta | Yuqori | Yuqori | Type/magic-byte/size validation, antivirus queue, quarantine | Untrusted file ready holatiga o‘tmaydi |
| T16 | Storage ACL yoki CDN misconfiguration | O‘rta | Kritik | Kritik | IaC review, deny-public policy, automated bucket audit | Anonymous request 403 oladi |

## 6. Playback state machine

```text
requested
  -> authenticated
  -> enrolled
  -> risk_checked
  -> session_issued
  -> drm_license_granted
  -> playing
  -> heartbeat_valid
  -> completed / revoked / expired
```

Har bir bosqichda failure default holat: **deny playback**. `DRM_ENABLED=true` bo‘lganda `video_url` MP4 yoki raw source bo‘lsa manifest endpoint `409`, raw signing endpoint esa `410` qaytaradi.

## 7. Majburiy control plane

### Authentication va authorization

- Har playback request’da active user, course enrollment va lesson access tekshiriladi.
- Refund, account disable, logout-all va admin revoke barcha faol sessionlarni bekor qiladi.
- Instructor faqat o‘z kursi assetlarini boshqaradi; admin action audit qilinadi.

### Session

- `playback_session_id`, `user_id`, `lesson_id`, `course_id`, `device_hash`, IP risk va expiry saqlanadi.
- Redis TTL session uchun source of truth bo‘ladi.
- Default concurrency: 1 active session, verified policy bilan 2 gacha.
- Heartbeat timeout’dan keyin license/manifest access block qilinadi.

### Manifest va segment delivery

- Original va encrypted assetlar public bucketda bo‘lmaydi.
- Manifest va segment tokenlari qisqa TTL bilan beriladi.
- `Cache-Control: no-store, private`, `Referrer-Policy: no-referrer` va HTTPS majburiy.
- CDN origin faqat CDN identity orqali ochiladi.

### License

- Widevine, FairPlay va PlayReady license URL’lari frontend secret emas.
- License request backend policy’dan o‘tadi va providerga forward qilinadi.
- License response/body/tokenlar application logiga yozilmaydi.
- Persistent/offline license default o‘chiq; keyinchalik alohida threat review talab qiladi.

### Watermark

- Visible watermark: masked user identity, session ID fragment, lesson ID va UTC timestamp.
- Position, opacity va rotation periodically o‘zgaradi.
- Forensic watermark provider qo‘llab-quvvatlasa encrypted rendition yoki session-level variantga qo‘shiladi.
- Watermark PII’ni minimallashtiradi va retention policy bilan boshqariladi.

## 8. Capture policy

### Browser

Browserda screenshot yoki recordingni universal va kafolatli bloklash mumkin emas. Shuning uchun browser control kombinatsiyasi ishlatiladi: DRM, disable download/PiP/remote playback, fullscreen va visibility signal, dynamic watermark, license heartbeat va anomaly response.

### Android/iOS native

- Android: `FLAG_SECURE`, capture state va root detection.
- iOS: screen capture state observer, playback pause/blank va jailbreak risk signal.
- Native clientda screen capture policy browserga qaraganda kuchliroq bo‘ladi, lekin external camera uchun yechim emas.

### Response ladder

1. Capture signal: watermarkni kuchaytirish va event yozish.
2. Qayta-qayta signal: playback pause va re-auth.
3. High-risk behavior: session revoke, barcha qurilmalardan logout.
4. Abuse evidence: user/session watermark bilan incident case va takedown.

## 9. Observability va alertlar

Majburiy eventlar:

- `playback_session_created`
- `drm_license_requested`
- `drm_license_denied`
- `manifest_issued`
- `segment_denied`
- `heartbeat_missed`
- `concurrent_limit_hit`
- `capture_signal_detected`
- `session_revoked`
- `watermark_abuse_reported`

Alertlar:

- bir userda qisqa vaqtda ko‘p device/IP;
- bir lesson uchun ketma-ket license failure;
- anonymous CDN 200 response;
- raw MP4 request;
- unusual segment scraping pattern;
- admin/instructor bulk download-like behavior;
- secret/config o‘zgarishi.

## 10. Test rejasi

### Unit

- enrollment va role policy;
- session expiry/revoke;
- concurrency counter;
- signed manifest/segment token;
- device binding;
- watermark payload masking;
- provider error mapping.

### Integration

- enrolled vs unenrolled playback;
- refund/account disable’dan keyin revoke;
- old manifest/token replay;
- raw MP4 endpoint blocked;
- CDN anonymous access denied;
- license proxy rate limit;
- upload quarantine va publish gate.

### Browser/device matrix

- Chrome/Windows va Android: Widevine;
- Firefox/desktop: Widevine;
- Edge/Windows: PlayReady fallback;
- Safari/macOS/iOS: FairPlay;
- Android/iOS native: capture policy;
- unsupported browser: deny with clear UX.

### Abuse testing

Faqat ruxsat berilgan staging assetlarida: DevTools/network replay, parallel sessions, token expiry, account sharing, capture signal, rooted/jailbroken device signal va CDN ACL audit.

## 11. Residual risk

Quyidagilarni to‘liq yo‘q qilib bo‘lmaydi:

- boshqa telefon yoki kamera bilan yozib olish;
- compromised/rooted/jailbroken device;
- software-only DRM/CDM weakness;
- insider screen recording;
- provider yoki CDN outage;
- watermarkni crop/blur qilish.

Shu sabab biznes qarori “hech kim nusxa ololmaydi” emas, balki **nusxa olishni qimmatlashtirish, tarqalgan nusxani aniqlash va account/sessionni tez revoke qilish** bo‘ladi.

## 12. Go-live gate

Production’da DRM-only rejim yoqilishidan oldin:

- [ ] PallyCon tenant va license endpointlar tayyor.
- [ ] Encrypted CMAF/HLS/DASH pilot video tayyor.
- [ ] Raw MP4 public access 403.
- [ ] Manifest/segment token TTL va revoke testlari yashil.
- [ ] Widevine, FairPlay, PlayReady testlari yashil.
- [ ] Concurrent playback limit ishlaydi.
- [ ] Visible watermark har sessionda unique.
- [ ] Capture detection response ladder test qilingan.
- [ ] Storage/CDN public ACL auditdan o‘tgan.
- [ ] Secret scanning va rotation jarayoni tayyor.
- [ ] Incident owner, takedown va support playbook mavjud.
- [ ] Monitoring alertlari stagingda signal bergan.
- [ ] Rollback raw MP4’ni ochmasdan ishlaydi.

## Yakuniy qaror

Designora uchun to‘g‘ri arxitektura: **managed multi-DRM + private encrypted delivery + Designora session/policy control + dynamic watermark + native capture controls + monitoring**. O‘zimizdan “DRM algoritmi” yaratish kerak emas; o‘zimiz yaratadigan qism aynan access policy, session lifecycle, watermark, abuse detection va incident response bo‘ladi.
