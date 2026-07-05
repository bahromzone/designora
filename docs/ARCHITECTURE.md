# 🏗️ Designora — Arxitektura

## Umumiy ko'rinish

Designora ikki qismli (decoupled) arxitekturaga ega:

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────┐
│   React SPA     │  ───────────────────▶    │   FastAPI API    │
│ (Vite, Tailwind)│  ◀───────────────────    │  (Python 3.12)   │
└─────────────────┘                          └────────┬─────────┘
                                                      │
                                       ┌──────────────┼──────────────┐
                                       ▼              ▼              ▼
                                 ┌──────────┐   ┌──────────┐   ┌──────────┐
                                 │PostgreSQL│   │  Redis   │   │  SMTP /  │
                                 │          │   │ (kesh)   │   │ Telegram │
                                 └──────────┘   └──────────┘   └──────────┘
```

---

## Backend (FastAPI)

### Qatlamlar

| Qatlam | Papka | Vazifa |
|--------|-------|--------|
| **Core** | `app/core/` | `config` (sozlamalar), `database` (SQLAlchemy engine/session), `security` (JWT), `password` (bcrypt), `middleware` (xavfsizlik) |
| **Models** | `app/models/` | SQLAlchemy ORM modellari: `User`, `Course`, `Lesson`, `Progress`, `Certificate`, `Assignment`, `Notification`, `Payment`, `PasswordReset` |
| **Routers** | `app/routers/` | API endpointlari: `auth`, `google`, `users`, `profile`, `courses_api`, `admin_courses` |
| **Admin** | `app/admin/` | sqladmin boshqaruv paneli |
| **Utils** | `app/utils/` | rol/marshrut yordamchilari, email |

### Autentifikatsiya

- **Local** — email + parol (bcrypt, 13 raund).
- **Google OAuth** — Authlib orqali.
- **Token** — JWT (python-jose, HS256). Token quyidagilardan o'qiladi (tartib bilan):
  1. Session (`request.session["user"]`)
  2. `access_token` cookie (httpOnly)
  3. `Authorization: Bearer` header
  4. `X-Access-Token` header

### Xavfsizlik

- **CSRF** himoyasi (fastapi-csrf-protect) — production'da login uchun.
- **Rate limiting** (slowapi) — `5/minute` auth endpointlarida, `200/minute` default.
- **Security headers** middleware — `X-Frame-Options`, `X-Content-Type-Options`, CSP, HSTS (prod).
- **IP-blocking** middleware.
- **CORS** — `ALLOWED_ORIGINS` orqali sozlanadi.

### Ma'lumotlar bazasi

- **Prod:** PostgreSQL (`psycopg2`).
- **Lokal/test:** SQLite.
- **Migratsiyalar:** Alembic (`app/alembic/versions/`).
- Ishga tushganda `Base.metadata.create_all()` jadvallarni yaratadi (lokal qulaylik uchun).

---

## Frontend (React)

| Qatlam | Papka | Vazifa |
|--------|-------|--------|
| **Pages** | `src/pages/` | Home, Courses, Login, Register, Profile, 404 |
| **Components** | `src/components/` | Navbar, Hero, CourseCard, FeatureCard, AppShell, ProtectedRoute |
| **Context** | `src/context/` | `AuthContext` — foydalanuvchi holati |
| **Lib** | `src/lib/api.js` | Markazlashtirilgan API klient (fetch wrapper) |

- **Routing:** React Router (`ProtectedRoute` himoyalangan sahifalar uchun).
- **Animatsiya:** Framer Motion + GSAP (ScrollTrigger).
- **Styling:** Tailwind CSS + CSS o'zgaruvchilari (dizayn tokenlari).
- **Til:** to'liq o'zbek tilidagi interfeys.

---

## DevOps

| Vosita | Fayl |
|--------|------|
| Konteynerlar | `backend/Dockerfile`, `frontend/Dockerfile` |
| Orkestratsiya | `docker-compose.yml` (db, redis, backend, frontend) |
| CI/CD | `.github/workflows/ci.yml` (lint → test → build → docker) |
| Kod sifati | `ruff`, `black` (Python) · `eslint`, `prettier` (JS) |
| Pre-commit | `.pre-commit-config.yaml` |
| Testlar | `pytest` (backend) · `vitest` + React Testing Library (frontend) |

---

## Ma'lumotlar oqimi: login misoli

1. Foydalanuvchi frontend'da `email` + `parol` kiritadi.
2. `authApi.login()` → `POST /api/auth/login`.
3. Backend parolni bcrypt bilan tekshiradi, streak'ni yangilaydi.
4. JWT yaratiladi, httpOnly cookie o'rnatiladi va javobda qaytariladi.
5. Frontend token/foydalanuvchini `AuthContext`da saqlaydi va rol asosida
   `/dashboard` yoki `/manage/courses` ga yo'naltiradi.
