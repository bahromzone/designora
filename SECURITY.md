# 🔐 Designora — Xavfsizlik siyosati

## Qamrab olingan (XAVFSIZLIK bloki)

### Autentifikatsiya va sessiya
- **JWT httpOnly cookie'da** — access-token JS uchun ko'rinmaydi (XSS himoyasi),
  `secure` (prod), `samesite=strict`.
- **Refresh-token rotatsiyasi** — har yangilashda yangi token beriladi, eskisi
  bekor qilinadi. Token bazada faqat **SHA-256 hash** sifatida saqlanadi.
- **Reuse-detection** — bekor qilingan tokendan qayta foydalanilsa,
  foydalanuvchining barcha sessiyalari bekor qilinadi (`POST /api/auth/refresh`).
- `POST /api/auth/logout-all` — barcha qurilmalardan chiqish.

### Fayl yuklash
- **Kengaytma + hajm + magic-bytes** tekshiruvi (`upload_service`). Kengaytmasi
  soxtalashtirilgan fayllar kontent imzosi orqali aniqlanadi.
- Fayl nomi **UUID** ga almashtiriladi — path-traversal va bosib yozishning oldi.
- Avatar: 2 MB, faqat rasm. Topshiriq: 20 MB, rasm + hujjat.

### Rate limiting
- Kritik endpointlar (`/login`, `/register`) `slowapi` bilan cheklangan
  (5/min). Global limit: 200/min.

### Video kontent
- **Signed URL** (HMAC, muddatli) — hotlink va ruxsatsiz ko'rishning oldi
  (`/api/media`, BOSQICH 5).

### GDPR / maxfiylik
- `GET /api/privacy/export` — shaxsiy ma'lumotlarni JSON'da eksport.
- `DELETE /api/privacy/account` — hisobni o'chirish (right to be forgotten),
  parol tasdig'i bilan; bog'liq yozuvlar CASCADE orqali tozalanadi.

### Infratuzilma
- **Dependabot** — pip / npm / GitHub Actions haftalik yangilanadi
  (`.github/dependabot.yml`).
- **Kunlik DB backup** — `scripts/backup_db.sh` (pg_dump + gzip + retention +
  ixtiyoriy S3).
- **Security headers** — CSP, HSTS (prod), X-Frame-Options, nosniff
  (`SecurityHeadersMiddleware`).

## Zaiflik haqida xabar berish

Zaiflik topsangiz, iltimos ommaviy issue ochmang. To'g'ridan-to'g'ri
**security@designora.uz** ga yozing. 48 soat ichida javob beramiz.

## Prodakshn tavsiyalari

- `.env` dagi barcha `*_SECRET_KEY` larni kuchli, tasodifiy qiymatlarga qo'ying.
- `ENVIRONMENT=production` — `secure` cookie, HSTS va CSRF tekshiruvini yoqadi.
- Redis + Sentry ni yoqing (`pip install redis sentry-sdk`).
- Backup skriptini cron'ga qo'ying va tiklashni sinab ko'ring.
