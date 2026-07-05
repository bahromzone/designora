# 🎨 Designora

> O'zbekiston uchun jahon darajasidagi **online dizayn ta'lim platformasi**.
> Backend: **FastAPI + PostgreSQL** · Frontend: **React 18 + Vite + Tailwind**

[![CI](https://github.com/bahromzone/designora/actions/workflows/ci.yml/badge.svg)](https://github.com/bahromzone/designora/actions/workflows/ci.yml)

---

## 📦 Loyiha tuzilishi

```
designora/
├── backend/            # FastAPI API (Python 3.12)
│   ├── app/
│   │   ├── core/       # config, database, security, middleware
│   │   ├── models/     # SQLAlchemy modellari
│   │   ├── routers/    # API endpointlari
│   │   ├── admin/      # sqladmin panel
│   │   ├── utils/      # yordamchilar
│   │   └── alembic/    # migratsiyalar
│   ├── tests/          # pytest testlari
│   ├── Dockerfile
│   └── pyproject.toml  # ruff / black / pytest sozlamalari
├── frontend/           # React + Vite ilova
│   ├── src/
│   │   ├── components/  # UI komponentlar
│   │   ├── pages/       # sahifalar
│   │   ├── context/     # AuthContext
│   │   ├── lib/         # API klient
│   │   └── test/        # vitest sozlamalari
│   ├── Dockerfile
│   └── eslint.config.js
├── docs/               # ARCHITECTURE.md, API.md
├── docker-compose.yml  # to'liq lokal stek
└── .github/workflows/  # CI/CD
```

---

## 🚀 Tez boshlash

### Variant A — Docker (tavsiya etiladi)

```bash
# 1. Muhit fayllarini tayyorlang
cp .env.example .env
cp backend/env.example backend/.env      # qiymatlarni to'ldiring

# 2. Ishga tushiring
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- API hujjatlari → http://localhost:8000/docs

### Variant B — Qo'lda (lokal)

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp env.example .env                       # qiymatlarni to'ldiring
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🔑 Muhit o'zgaruvchilari (secrets)

Real `.env` fayllari **hech qachon** commit qilinmaydi (`.gitignore` bilan himoyalangan).

Kuchli tasodifiy kalit yaratish:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

| O'zgaruvchi | Tavsif |
|-------------|--------|
| `DATABASE_URL` | Ma'lumotlar bazasi ulanishi |
| `SECRET_KEY` / `SESSION_SECRET_KEY` / `JWT_SECRET_KEY` | Kriptografik kalitlar |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (ixtiyoriy) |
| `MAIL_*` | SMTP sozlamalari |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA |
| `ALLOWED_ORIGINS` | CORS ruxsat etilgan manzillar |

To'liq ro'yxat: [`backend/env.example`](backend/env.example)

---

## 🧪 Testlar va kod sifati

### Backend

```bash
cd backend
pytest                 # testlar + coverage hisoboti
ruff check .           # linter
black --check .        # format tekshiruvi
```

Joriy qamrov (coverage): **~72%** (maqsad ≥ 60%).

### Frontend

```bash
cd frontend
npm run test:run       # vitest
npm run coverage       # coverage bilan
npm run lint           # eslint
npm run format:check   # prettier
npm run build          # ishlab chiqarish build
```

### Pre-commit hooks

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

Har commit'da avtomatik: trailing-whitespace, merge-conflict tekshiruvi, ruff, black, prettier.

---

## 🏗️ Arxitektura

Batafsil: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

- **Backend** — FastAPI JSON API. JWT + session autentifikatsiya, CSRF himoyasi,
  rate limiting (slowapi), security headers, IP-blocking middleware.
- **Frontend** — React SPA, React Router, Framer Motion + GSAP animatsiyalar.
- **Ma'lumotlar bazasi** — PostgreSQL (prod), SQLite (lokal/test), Alembic migratsiyalar.
- **Kesh/navbat** — Redis (compose'da tayyor, kelajakdagi funksiyalar uchun).

---

## 📖 API hujjatlari

- Interaktiv (Swagger): `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Qisqacha yo'riqnoma: [`docs/API.md`](docs/API.md)

---

## 🤝 Hissa qo'shish (Contributing)

1. Yangi branch oching: `git checkout -b feature/xususiyat-nomi`
2. `pre-commit install` — hooklarni yoqing
3. Testlar yozing va `pytest` / `npm run test:run` yashil bo'lsin
4. Pull Request oching — CI avtomatik lint + test + build tekshiradi

---

## 🗺️ Yo'l xaritasi

Loyiha bosqichma-bosqich rivojlanadi (LMS yadrosi → to'lovlar → o'rganish sifati
→ community → miqyoslash). Bu repozitoriya **Bosqich 0 — Poydevorni
mustahkamlash** yakunlangan holatini o'z ichiga oladi: testlar, Docker, CI/CD,
kod sifati vositalari, muhit boshqaruvi va hujjatlar.
