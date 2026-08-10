# 🎨 Designora

> O'zbekiston uchun jahon darajasidagi **online dizayn ta'lim platformasi**.
> Backend: **FastAPI + PostgreSQL** · Frontend: **React 19 + Vite + Tailwind**

[![CI](https://github.com/bahromzone/designora/actions/workflows/ci.yml/badge.svg)](https://github.com/bahromzone/designora/actions/workflows/ci.yml)

## 📦 Loyiha tuzilishi

```
designora/
├── backend/            # FastAPI API (Python 3.12)
│   ├── app/            # core, models, routers, services, admin
│   ├── tests/          # pytest testlari
│   └── pyproject.toml
├── frontend/           # React + Vite ilova
│   ├── src/            # components, pages, context, lib
│   └── e2e/            # Playwright critical journey va layout gate
├── docs/               # arxitektura, API va roadmap
├── docker-compose.yml  # db, redis, backend, frontend
└── .github/workflows/  # CI/CD va browser E2E
```

## 🚀 Tez boshlash

### Docker

```bash
cp backend/env.example backend/.env  # qiymatlarni to'ldiring
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- API hujjatlari → http://localhost:8000/docs

### Qo'lda

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp env.example .env
uvicorn app.main:app --reload
```

Alohida terminalda:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

## 🔑 Muhit o'zgaruvchilari

Real `.env` fayllari **hech qachon** commit qilinmaydi. Production uchun quyidagilar majburiy:

- `DATABASE_URL`, `SECRET_KEY`, `SESSION_SECRET_KEY`, `JWT_SECRET_KEY`;
- `REDIS_URL` yoki `RATE_LIMIT_STORAGE_URI`;
- Payme/Click webhook kalitlari;
- video storage credentials va public base URL;
- `ALLOWED_ORIGINS` va email sozlamalari.

Kuchli kalit yaratish:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Auth xavfsizligi

Access va refresh tokenlar frontend JavaScript'iga berilmaydi. Ular `httpOnly`, `SameSite=Strict` cookie'larda saqlanadi; refresh token rotation va reuse detection bilan himoyalangan. Frontend `localStorage`'da token saqlamaydi.

Production'da Redis ishlamasa ilova boot vaqtida to'xtaydi: ko'p worker'li muhitda `memory://` rate limit xavfsiz emas.

## 🧪 Testlar va kod sifati

### Backend

```bash
cd backend
pytest
ruff check .
black --check .
```

CI testlarni SQLite va PostgreSQL'da alohida ishga tushiradi. PostgreSQL production dialekti sifatida blocking gate hisoblanadi. Testlar haqiqiy `DATABASE_URL`ga tegmaydi.

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run format:check
npm run test:run
npm run coverage
npm run build
```

`format:check` faqat tekshiradi, fayllarni o'zgartirmaydi.

### Browser E2E

Critical student journey `frontend/e2e/critical-journey.spec.mjs` ichida: login, reload'dan keyin cookie session, enrollment, lesson ochish va dashboard'ga qaytish. GitHub Actions'da `E2E_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_COURSE_ID` secretlari kerak.

Layout regression gate `frontend/e2e/layout-regression.spec.mjs` ichida: onboarding modal navigatsiyasi va navbar profil menyusi bir nechta viewport hamda past balandlikda geometriya invariantlari bilan qulflanadi. Piksel snapshot ataylab ishlatilmaydi, chunki runner'da shrift renderi o'zgaradi va gate flaky bo'lib ishonchini yo'qotadi. O'rniga tekshiriladi: element viewport ichida to'liqmi, o'z konteyneri chegarasida qolganmi, ustini boshqa element to'smaganmi va bir qatordagi elementlar haqiqatan bir qatordami.

```bash
cd frontend/e2e
npm install
npx playwright install --with-deps chromium
E2E_BASE_URL=... E2E_EMAIL=... E2E_PASSWORD=... E2E_COURSE_ID=... npm test
```

## 🏗️ Arxitektura

- **Backend** — FastAPI JSON API, cookie-based auth, JWT, CSRF, rate limiting, security headers va IP-blocking middleware.
- **Frontend** — React SPA, React Router, Framer Motion va GSAP.
- **Ma'lumotlar bazasi** — PostgreSQL production uchun, SQLite lokal testlar uchun, Alembic migratsiyalari bilan.
- **Kesh/navbat** — Redis.
- **Media** — signed video URL, multipart object-storage upload va bounded disk streaming.
- **Payments** — Payme/Click webhook validation, idempotent checkout va access grant/revoke.

Batafsil: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## 🤝 Hissa qo'shish

1. `git checkout -b feature/xususiyat-nomi`
2. `pre-commit install`
3. Testlar va CI yashil bo'lishini kuting
4. Pull Request oching

## 🗺️ Yo'l xaritasi

Avval kritik student journey ishonchliligi, keyin Student Dashboard, onboarding, assignment feedback, portfolio, search va learning paths. Random feature emas, real learning outcome ustuvor.
