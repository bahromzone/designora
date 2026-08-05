# 🏗️ Designora — Arxitektura

## Umumiy ko'rinish

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────┐
│   React SPA     │  ───────────────────▶    │   FastAPI API    │
│ React 19/Vite   │  ◀───────────────────    │   Python 3.12    │
└─────────────────┘                          └────────┬─────────┘
                                                      │
                                       ┌──────────────┼──────────────┐
                                       ▼              ▼              ▼
                                 ┌──────────┐   ┌──────────┐   ┌──────────┐
                                 │PostgreSQL│   │  Redis   │   │ Object   │
                                 │          │   │          │   │ storage  │
                                 └──────────┘   └──────────┘   └──────────┘
```

## Backend qatlamlari

| Qatlam | Papka | Vazifa |
|--------|-------|--------|
| Core | `app/core/` | config, database, JWT/cookie security, middleware, metrics |
| Models | `app/models/` | SQLAlchemy domen modellari |
| Routers | `app/routers/` | auth, learning, payments, media, instructor, admin va community API |
| Services | `app/services/` | token, upload, video va biznes yordamchilari |
| Admin | `app/admin/` | sqladmin boshqaruv paneli |

## Autentifikatsiya

Local login, register, password reset va OAuth muvaffaqiyatli bo'lganda access va refresh tokenlar `httpOnly`, `SameSite=Strict` cookie sifatida beriladi. Frontend tokenni `localStorage`'ga saqlamaydi. Refresh token har ishlatilganda rotation qilinadi; bekor qilingan tokenni qayta ishlatish barcha sessiyalarni yopadi.

Backend eski Bearer headerlarni ayrim migration/integration oqimlari uchun qabul qilishi mumkin, lekin asosiy browser oqimi cookie-based. CORS `allow_credentials=True` bilan aniq originlar ro'yxatiga cheklangan.

## Xavfsizlik

- production'da umumiy Redis rate-limit storage majburiy;
- security headers, HSTS va CSP;
- payment webhook secret va signature validation;
- checkout idempotency key uchun unique database constraint;
- protected video uchun 5 daqiqalik signed URL;
- uploadlar diskka stream qilinadi, magic bytes va max size bounded tekshiriladi;
- PostgreSQL migration CI va real browser E2E gate.

## Ma'lumotlar bazasi va migration

Yangi database to'liq Alembic history orqali quriladi. Faqat pre-Alembic legacy jadvalalari bor database bir marta metadata baseline qilinadi. `alembic_version` mavjud bo'lsa, deploy faqat normal `alembic upgrade heads` yo'lidan boradi.

## Frontend

- Routing: React Router;
- state: `AuthContext`, browser cookie session;
- API: `src/lib/api.js`, barcha requestlar `credentials: include` bilan;
- styling: Tailwind va CSS design tokens;
- tests: Vitest + React Testing Library;
- E2E: Playwright critical student journey.

## Release flow

1. Ruff va Black;
2. migration against PostgreSQL;
3. SQLite va PostgreSQL pytest;
4. frontend lint, format, test, coverage va build;
5. Docker image build;
6. real environment browser E2E;
7. faqat barcha gate'lar yashil bo'lganda production deploy.
