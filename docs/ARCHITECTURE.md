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
| Services | `app/services/` | to'lov gateway'lari, access grant/revoke, token, upload, video va biznes yordamchilari |
| Admin | `app/admin/` | sqladmin boshqaruv paneli |

Router'lar iloji boricha yupqa: ular so'rovni o'qiydi va javobni qaytaradi.
Protokol va biznes mantiq xizmat qatlamida turadi. To'lovlar shu qoidaning
namunasi: `routers/payments.py` faqat HTTP, protokol esa
`services/payme_gateway.py` va `services/click_gateway.py` ichida.

## Autentifikatsiya

Local login, register, password reset va OAuth muvaffaqiyatli bo'lganda access va refresh tokenlar `httpOnly`, `SameSite=Strict` cookie sifatida beriladi. Frontend tokenni `localStorage`'ga saqlamaydi. Refresh token har ishlatilganda rotation qilinadi; bekor qilingan tokenni qayta ishlatish barcha sessiyalarni yopadi.

Backend eski Bearer headerlarni ayrim migration/integration oqimlari uchun qabul qilishi mumkin, lekin asosiy browser oqimi cookie-based. CORS `allow_credentials=True` bilan aniq originlar ro'yxatiga cheklangan.

## To'lovlar

Ikkita provider bor: Payme (JSON-RPC 2.0 Merchant API) va Click (Prepare +
Complete). Ikkalasi ham bitta xizmatga tayanadi:

- `grant_access(db, order)` — Enrollment, Progress va legacy Payment yozuvini
  yaratadi, kupon hisoblagichini oshiradi. Idempotent.
- `revoke_access(db, order)` — to'liq teskarisi. Bekor qilish yoki refunddan
  keyin kursga kirish yopiladi, aks holda "to'la → o'qi → pulni qaytar"
  sxemasi bilan kursni bepul olish mumkin bo'lardi.

Webhook kalitlari sozlanmagan bo'lsa har ikki gateway fail closed ishlaydi:
so'rov umuman xizmat ko'rmaydi.

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
- E2E: Playwright critical student journey va layout regression gate.

## Release flow

1. Ruff va Black;
2. migration against PostgreSQL;
3. SQLite va PostgreSQL pytest;
4. frontend lint, format, test, coverage va build;
5. Docker image build;
6. real environment browser E2E;
7. faqat barcha gate'lar yashil bo'lganda production deploy.
