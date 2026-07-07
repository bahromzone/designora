# 🚀 BOSQICH 5 — Miqyoslash va mukammallik

> Maqsad: professional, ishonchli, tez platforma.

Ushbu bosqich infratuzilma qatlamini qo'shadi. Barcha tashqi bog'liqliklar
(Redis, Sentry) **ixtiyoriy** — o'rnatilmasa yoki sozlanmasa, tizim xavfsiz
zaxira rejimida ishlaydi (masalan, xotiradagi kesh). Shu sabab CI Redis/Sentry
serversiz ham to'liq yashil bo'ladi.

## ✅ Bajarilgan ishlar

| Vazifa | Holat | Izoh |
|--------|-------|------|
| Kesh (Redis) | ✅ | `cache` xizmati — Redis bo'lsa Redis, aks holda xotira |
| Monitoring (Sentry) | ✅ | `SENTRY_DSN` bo'lsa ishga tushadi |
| Metrikalar (Prometheus) | ✅ | `/metrics` + so'rov middleware'i |
| Health / readiness | ✅ | `/health`, `/ready` (DB tekshiruvi) |
| Video himoyasi (signed URL) | ✅ | HMAC imzolangan, muddatli havolalar |
| Ko'p tillilik (i18n) | ✅ | uz / ru / en katalog + `/api/i18n` |
| SEO (sitemap + robots) | ✅ | `/sitemap.xml`, `/robots.txt` |

> Kelajak (infratuzilma/DevOps, kod tashqarisida): Celery/ARQ fon vazifalari,
> Grafana dashboardlari, gorizontal masshtablash, load testing, React Native
> mobil ilova, to'liq PWA (service worker frontend'da).

## 🧩 Yangi modullar

**Servislar (sof, testlangan):**
- `services/cache.py` — Redis + xotira zaxira keshi
- `services/i18n_service.py` — tarjima katalogi (uz/ru/en)
- `services/seo_service.py` — sitemap.xml / robots.txt generatsiyasi
- `services/video_service.py` — HMAC signed URL (imzolash + tekshirish)

**Yadro:**
- `core/metrics.py` — bog'liqliksiz Prometheus-uslub reestri
- `core/monitoring.py` — ixtiyoriy Sentry ishga tushirish

## 🔌 Yangi API'lar

### System (`/`)
- `GET /health` · `GET /ready` · `GET /metrics`
- `GET /robots.txt` · `GET /sitemap.xml`
- `GET /api/i18n/languages` · `GET /api/i18n/{lang}`

### Media (`/api/media`)
- `POST /lessons/{id}/sign` — imzolangan video havolasi (yozilgan/preview shart)
- `GET /verify` — imzoni tekshirish (ommaviy, CDN uchun)

## ⚙️ Yangi sozlamalar (barchasi ixtiyoriy)

| Sozlama | Vazifa |
|---------|--------|
| `REDIS_URL` | Redis ulanishi (bo'lmasa xotira keshi) |
| `SENTRY_DSN` | Sentry monitoring (bo'lmasa o'chirilgan) |
| `MEDIA_SIGNING_KEY` | Video imzo kaliti (bo'lmasa `SECRET_KEY`) |
| `MEDIA_CDN_BASE_URL` | Video CDN bazaviy manzili |
| `DEFAULT_LANGUAGE` | Standart til (default: `uz`) |

> Prodakshnda Redis va Sentry uchun: `pip install redis sentry-sdk` va tegishli
> sozlamalarni `.env` ga qo'shing.

## 🧪 Testlar

```bash
cd backend
pytest tests/test_i18n_service.py tests/test_seo_service.py \
       tests/test_video_service.py tests/test_cache.py \
       tests/test_metrics.py tests/test_system_api.py \
       tests/test_media_api.py -v
```
