# Implementation Plan: Backend Architecture Refactor

## Overview

Ushbu reja Designora FastAPI backendini qatlamli (layered) arxitekturaga **regressiyasiz** o'tkazishni amalga oshiradi. Tasklar dizayndagi **bosqichma-bosqich migratsiya ketma-ketligini** (Qadam 0 baseline → Qadam 7 yakuniy verifikatsiya) aynan takrorlaydi: har bir qadam additive bo'lib, ilova har qadamdan keyin import qilinadigan va `TestClient` bilan ishga tushadigan holatda qoladi. `app/models/` va `app/alembic/` **tegilmaydi** (DB schema o'zgarmaydi, autogenerate nol operatsiya hosil qiladi).

Implementatsiya tili: **Python** (dizayndagi kabi). Yagona test buyrug'i: `backend/` katalogidan `pytest`. Testlar `backend/tests/` da joylashadi.

Konvensiyalar:
- `*` bilan belgilangan sub-tasklar **ixtiyoriy** (test-related) — MVP uchun o'tkazib yuborilishi mumkin, lekin no-regression kafolati uchun tavsiya etiladi.
- Har bir property testi Hypothesis bilan **kamida 100 misol** (`max_examples=100`) bajaradi va izoh teg formati: `Feature: backend-architecture-refactor, Property {n}: {text}`.
- Checkpoint tasklari har asosiy qadam oxirida import + autogenerate-zero-ops + endpoint-reachability tekshiruvini ta'minlaydi.

## Tasks

- [ ] 1. Qadam 0 — Test scaffolding va baseline golden snapshot
  - [ ] 1.1 `requirements.txt` ga test bog'liqliklarini qo'shish
    - `backend/requirements.txt` ga `pytest` va `hypothesis` qatorlarini qo'shish (`httpx` allaqachon mavjud, qayta qo'shilmaydi)
    - `backend/` dan `pytest` yagona hujjatlashtirilgan buyruq sifatida ishlashini va biror test yiqilganda nol bo'lmagan exit kodi qaytarishini tasdiqlash (pytest standart xulqi)
    - _Requirements: 8.4, 8.6_
  - [ ] 1.2 `tests/conftest.py` test fixture'larini yaratish
    - `backend/tests/__init__.py` va `backend/tests/conftest.py` yaratish
    - `sqlite:///:memory:` engine + `Base.metadata.create_all` asosida izolyatsiyalangan `Session` fixture (repository testlari uchun) yaratish
    - FastAPI `TestClient` fixture yaratish va `app.dependency_overrides` orqali `get_db` ni in-memory Session ga almashtirish (HTTP serveri/real DB siz)
    - _Requirements: 8.1, 8.2, 8.4_
  - [ ] 1.3 Refaktoringdan oldingi baseline golden snapshot va route inventory'ni qo'lga olish
    - `tests/golden/` ga har bir auth/profile/course-management endpoint javobining HTTP statusi va JSON maydon nomlari/nesting tuzilmasini (deterministik bo'lmagan `access_token`/timestamp e'tiborga olinmaydi) saqlash
    - Mavjud barcha `(path, method)` juftliklari ro'yxatini `app.routes` dan generatsiya qilib snapshot sifatida saqlash (keyingi reachability tekshiruvi uchun)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.5_

- [ ] 2. Qadam 1+2 — Schema qatlami (`app/schemas/`)
  - [ ] 2.1 `app/schemas/auth.py` yaratish
    - `app/schemas/__init__.py` paketini va `auth.py` ni yaratish
    - `RegisterRequest`, `LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest` ni `routers/auth.py` dagi inline modellardan maydon-baharf ko'chirish (`StringConstraints` min/max, `EmailStr`, `recaptcha_token`, `password_strength` `@field_validator` — ≥1 katta harf, ≥1 raqam)
    - _Requirements: 2.1, 2.4, 2.6_
  - [ ] 2.2 `app/schemas/profile.py` yaratish
    - `ProfileResponse` (barcha maydonlar + `from_attributes = True`), `ProfileUpdateRequest`, `ChangePasswordRequest`, `ProgressUpdateRequest` ni `routers/profile.py` dan ko'chirish
    - Maydon turlari, optional/required holati, default qiymatlar va validatorlarni aynan saqlash
    - _Requirements: 2.1, 2.4, 2.5, 2.6_
  - [ ] 2.3 `app/schemas/course.py` yaratish
    - `CourseCreate`, `CourseUpdate` ni `routers/admin_courses.py` dan ko'chirish (`title` `StringConstraints(min_length=3, max_length=200)` va boshqa maydonlar aynan)
    - _Requirements: 2.1, 2.4, 2.6_
  - [ ] 2.4 Router'larni schema importiga ulash va inline `BaseModel` e'lonlarini olib tashlash
    - `routers/auth.py`, `routers/profile.py`, `routers/admin_courses.py` ni `app/schemas/` dan import qiladigan qilib o'zgartirish
    - Router fayllaridagi barcha `class ...(BaseModel)` inline e'lonlarini o'chirish (Router_Layer da hech qanday Pydantic `BaseModel` qolmasligi shart)
    - _Requirements: 2.2, 2.3_
  - [ ]* 2.5 Schema validatsiya accept/reject invariantligi uchun property testi
    - **Property 5: Schema validatsiya accept/reject invariantligi**
    - **Validates: Requirements 2.6, 2.7**
    - Har bir schema uchun Hypothesis bilan tasodifiy valid/invalid payloadlar generatsiya qilib, ko'chirilgan model `StringConstraints`, `EmailStr` va `password_strength` ni buzgan payloadni rad etishini, qondirgan payloadni qabul qilishini tekshirish

- [ ] 3. Checkpoint — schema qatlami integratsiyasi
  - Ensure all tests pass, ask the user if questions arise. (`import app.main` ImportError'siz, autogenerate nol operatsiya, route'lar erishiladigan holatda, schema validatsiya testi o'tadi.)

- [ ] 4. Qadam 3 — Repository qatlami (`app/repositories/`)
  - [ ] 4.1 `user_repository.py` yaratish
    - `app/repositories/__init__.py` paketini va `user_repository.py` ni yaratish: `get_by_email`, `get_by_id`, `list_all` (`User.id.desc()`), `add` (`db.add` + `flush`, commit yo'q), `exists_by_email`
    - `Session` ni birinchi parametr sifatida qabul qilish; HTTP obyektlari yo'q; integrity xatosini swallow qilmaslik
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8_
  - [ ] 4.2 `course_repository.py` va `progress_repository.py` yaratish
    - `course_repository`: `get_by_id`, `get_active_by_id`, `list_all`, `add`, `delete` (bool)
    - `progress_repository`: `get_for_user_course`, `list_with_courses_for_user` (Progress JOIN Course), `sum_minutes_for_user`, `sum_minutes_in_range`, `add`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - [ ] 4.3 `certificate_repository.py`, `assignment_repository.py`, `password_reset_repository.py` yaratish
    - `certificate_repository`: `get_for_user_course`, `count_for_user`, `add`
    - `assignment_repository`: `count_pending_for_user` (`is_completed == False`)
    - `password_reset_repository`: `get_valid_by_token` (`expires_at > utcnow`), `delete_for_user`, `add`, `delete` (bool)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - [ ] 4.4 `notification_repository.py` va `payment_repository.py` yaratish
    - Standart CRUD interfeysi: `get_by_id`, `list_for_user`, `add` (Requirement 4.1 data-access inkapsulyatsiyasi uchun)
    - `Session` parametri; HTTP obyektlari yo'q
    - _Requirements: 4.1, 4.2, 4.5_
  - [ ]* 4.5 Repository qaytarish-shakli va round-trip property testi (in-memory SQLite)
    - **Property 7: Repository qaytarish-shakli va round-trip kontrakti**
    - **Validates: Requirements 4.3, 4.4, 4.6, 4.7**
    - `tests/conftest.py` in-memory Session fixture bilan: mavjud bo'lmagan kalit → `None`; add→get round-trip ekvivalent instance; bo'sh kolleksiya; delete bool natijasi (`True`/`False`)

- [ ] 5. Qadam 4 — Dependencies moduli (`app/dependencies/deps.py`)
  - [ ] 5.1 `app/dependencies/deps.py` yaratish
    - `app/dependencies/__init__.py` va `deps.py` yaratish
    - `core.database.get_db` va `core.security.get_current_user` ni re-export qilish
    - Yagona `get_current_admin` ni amalga oshirish: `user_repository.get_by_email`, qat'iy `role == "admin"` (boshqa rol → `HTTPException(403)`, kreditsiya yo'q → `get_current_user` orqali 401)
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 5.8_
  - [ ] 5.2 Admin guard dublikatlarini yagona dependency bilan almashtirish
    - `main.py::_require_admin` va `routers/admin_courses.py::require_admin` ni o'chirib, `deps.get_current_admin` ga almashtirish
    - `core/admin_guard.py::admin_required` ni `deps.get_current_admin` ga delegatsiya qiladigan ingichka wrapper'ga aylantirish (single source of truth)
    - Ko'chirilgan murojaatlar uchun barcha import'larni yangilash (ImportError qolmasligi shart)
    - _Requirements: 5.4, 5.5, 9.4_
  - [ ]* 5.3 Admin guard contract testi (TestClient)
    - admin token → 200; non-admin foydalanuvchi → 403; kreditsiya yo'q/yaroqsiz → 401 ekanini tasdiqlash
    - _Requirements: 5.7, 5.8_

- [ ] 6. Checkpoint — repository va dependencies integratsiyasi
  - Ensure all tests pass, ask the user if questions arise. (`import app.main` ImportError'siz, autogenerate nol operatsiya, route reachability, repository va admin guard testlari o'tadi.)

- [ ] 7. Qadam 5 — Service qatlami (`app/services/`)
  - [ ] 7.1 `auth_service.py` va domen exception'larni yaratish
    - `app/services/__init__.py`, exception modulini (`DuplicateEmailError`, `InvalidCredentialsError`, `InvalidTokenError`, `UserNotFoundError` va h.k.) va `auth_service.py` ni yaratish
    - `register_user`, `authenticate_user`, `update_streak` (UTC sana: null→1, bir xil kun→o'zgarmas, +1 kun→increment, uzilish→1, so'ng `last_login_date = now(utc)`), `create_password_reset`, `reset_password`, `redirect_target_for_role` ni `routers/auth.py` dan ko'chirish
    - Ma'lumotlarga faqat repository orqali kirish (to'g'ridan-to'g'ri SQLAlchemy yo'q); HTTP obyektlarini parametr sifatida olmaslik; multi-step yozuvda bitta commit / xatoda rollback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.7_
  - [ ]* 7.2 Streak state transition property testi + example testi
    - **Property 1: Streak state transition (UTC sana mantig'i)**
    - **Validates: Requirements 7.1, 7.2**
    - Fake repository bilan: tasodifiy `last_login_date` (jumladan null) va `streak_days` uchun to'rt holat invariantini tekshirish; plus Requirement 8.5 uchun aniq example testi (birinchi login=1, o'sha kun o'zgarmas, ketma-ket kun +1, uzilish→1)
    - _Requirements: 7.1, 7.2, 8.5_
  - [ ]* 7.3 Role-based redirect property testi
    - **Property 4: Role-based redirect target**
    - **Validates: Requirements 7.7**
    - Tasodifiy rol satrlari (`admin`, `superadmin`, registr aralash, `None`, ixtiyoriy) uchun natija faqat `/manage/courses` yoki `/dashboard` ekanini tekshirish
  - [ ] 7.4 `profile_service.py` yaratish
    - `get_profile`, `update_profile`, `change_password`, `get_stats` (7 kunlik activity, JSON struktura aynan), `update_progress` ni `routers/profile.py` dan ko'chirish
    - `update_progress` qoidalari: Progress yo'q→`percent=0,minutes_spent=0` auto-create; `percent` ni `min(max(percent,0),100)` clamp; `minutes_spent += (session or 0)`; `percent>=100` va sertifikat yo'q→aynan 1 Certificate + `points += 100 + session`; aks holda faqat `points += session`; bitta commit / xatoda rollback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.3, 7.4, 7.5, 7.6_
  - [ ]* 7.5 Certificate/points exactly-once property testi + example testi
    - **Property 2: Certificate va points aynan bir marta beriladi**
    - **Validates: Requirements 7.3, 7.4, 7.5, 3.3**
    - Fake repository bilan: tasodifiy boshlang'ich progress, `percent`, `minutes_spent` uchun exactly-once va idempotentlik invariantini; plus Requirement 8.7 uchun aniq example testi (birinchi 100% da 1 cert + 100 + minut; mavjud cert da faqat minut)
    - _Requirements: 7.3, 7.4, 7.5, 3.3, 8.7_
  - [ ]* 7.6 Percent clamping property testi
    - **Property 3: Percent clamping invariant**
    - **Validates: Requirements 7.6**
    - Tasodifiy butun `percent` (manfiy, 0..100, >100, juda katta) uchun saqlangan qiymat doim `[0,100]` da va aynan `min(max(percent,0),100)` ga teng ekanini tekshirish
  - [ ] 7.7 `course_service.py` yaratish
    - `list_courses`, `create_course`, `update_course` (yo'q→`CourseNotFoundError`), `delete_course`, `toggle_course`, `list_admin_users` ni `routers/admin_courses.py` va `main.py` admin block'idan ko'chirish
    - Repository orqali kirish; commit/rollback service'da
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_
  - [ ]* 7.8 Multi-step commit-once / rollback-on-failure property testi
    - **Property 6: Multi-step write — commit-once / rollback-on-failure**
    - **Validates: Requirements 3.5, 3.6**
    - Instrumented fake session bilan: register/reset-password/progress-completion da barcha qadamlar muvaffaqiyatli→aynan bitta commit; biror yozuv xato→rollback va qisman yozuv qolmasligi

- [ ] 8. Checkpoint — service qatlami integratsiyasi
  - Ensure all tests pass, ask the user if questions arise. (`import app.main` ImportError'siz, autogenerate nol operatsiya, route reachability, barcha service unit/property testlari o'tadi.)

- [ ] 9. Qadam 6 — Thin routers (`app/routers/`)
  - [ ] 9.1 `routers/auth.py` ni thin qilish
    - Barcha to'g'ridan-to'g'ri SQLAlchemy chaqiruvlarini (`db.query/add/commit/refresh/delete`) `auth_service` ga delegatsiya qilish; router faqat parse/validatsiya, service chaqirish, javob qurish bilan cheklanadi
    - reCAPTCHA, CSRF (prod), `access_token` cookie (`httponly`, `samesite=strict`, `max_age=3600`, `secure` prod'da), rate-limit `5/minute` router'da qoladi; service exception'larini mavjud `HTTPException(status, detail)` ga tarjima qilish
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 6.5, 6.6, 6.7, 6.8_
  - [ ] 9.2 `routers/profile.py` ni thin qilish
    - To'g'ridan-to'g'ri SQLAlchemy chaqiruvlarini `profile_service` ga ko'chirish; response model'lar `app/schemas/` dan; service domen exception'larini mavjud HTTP status/detail ga tarjima qilish
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  - [ ] 9.3 `routers/admin_courses.py` va `main.py` admin block'ini thin qilish
    - `admin_courses.py` va `main.py::/api/admin/users` dagi SQLAlchemy chaqiruvlarini `course_service` ga ko'chirish; admin guard sifatida `deps.get_current_admin` ishlatish
    - Barcha endpoint path/metod/status'lar (jumladan `/api/admin/courses/api/admin/users` 410 Gone) erishiladigan va o'zgarmas holatda qolishini ta'minlash
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 9.5_
  - [ ]* 9.4 API kontrakt saqlanishi contract testi (TestClient)
    - **Property 8: API kontrakt saqlanishi (javob tuzilmasi va status)**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - auth/profile/course-management endpointlari uchun muvaffaqiyatli va xato javoblarda HTTP status hamda JSON maydon nomlari/nesting'ni 1.3 dagi golden snapshot bilan solishtirish (deterministik bo'lmagan qiymatlar e'tiborga olinmaydi)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.3_
  - [ ]* 9.5 Auth cookie atributlari property testi
    - **Property 9: Auth cookie atributlari invariantligi**
    - **Validates: Requirements 6.5**
    - Cookie o'rnatadigan endpointlar (register, login, reset-password, google callback) uchun `access_token`, `httponly`, `samesite=strict`, `max_age=3600`, `secure == (ENVIRONMENT=="production")` ekanini tekshirish
  - [ ]* 9.6 Rate-limit / CSRF / reCAPTCHA / security headers example testlari (PBT emas)
    - Login >5/minute → bir xil 429; `ENVIRONMENT=production` da CSRF/reCAPTCHA fail → bir xil rad javobi; vakil so'rovlar uchun bir xil security headerlar
    - _Requirements: 6.6, 6.7, 6.8, 6.9_

- [ ] 10. Qadam 7 — Yakuniy verifikatsiya testlari
  - [ ]* 10.1 Route reachability testi
    - **Property 10: Route reachability (kutilmagan 404 yo'qligi)**
    - **Validates: Requirements 9.5**
    - 1.3 dagi `(path, method)` inventory'ning har bir juftligi refaktoringdan keyingi `app.routes` jadvalida mavjudligini tekshirish
  - [ ]* 10.2 Import/startup smoke testi (PBT emas)
    - `import app.main` `ImportError`/`ModuleNotFoundError` chiqarmasligini; `TestClient` bilan ilova startup'i handle qilinmagan exception'siz ko'tarilishini; alembic `env.py` model resolve'ini tekshirish
    - _Requirements: 9.1, 9.3, 9.6_
  - [ ]* 10.3 Alembic autogenerate-zero-ops automated testi (PBT emas)
    - `alembic revision --autogenerate` (yoki dasturiy `compare_metadata`) nol schema-change operatsiyasi hosil qilishini tekshiruvchi avtomatik test yozish; `app/alembic/versions/` o'zgarmaganligini tasdiqlash
    - _Requirements: 9.2, 9.8_

- [ ] 11. Yakuniy checkpoint — to'liq verifikatsiya
  - Ensure all tests pass, ask the user if questions arise. (`backend/` dan yagona `pytest` buyrug'i barcha unit + repository + contract + property + smoke + integration testlarni bitta chaqiruvda bajaradi; route reachability va autogenerate-zero-ops yakuniy tasdiqlanadi.)

## Notes

- `*` bilan belgilangan sub-tasklar ixtiyoriy (test-related) va tezroq MVP uchun o'tkazib yuborilishi mumkin; biroq no-regression kafolati ular bilan ta'minlanadi.
- Har bir task aniq fayl yo'llari va ko'chiriladigan mantiqqa havola qiladi; har biri traceability uchun aniq requirement raqamlariga bog'langan.
- Checkpoint'lar har qadamdan keyin import + autogenerate-zero-ops + endpoint-reachability tekshiruvini ta'minlaydi (Migration Strategy I+A+E).
- `app/models/` va `app/alembic/` tegilmaydi; DB schema o'zgarmaydi.
- Property testlari universal domen/regressiya invariantlarini, unit/example testlari aniq holatlar va edge case'larni tekshiradi.
- Yagona test buyrug'i: `backend/` katalogidan `pytest`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["4.5", "5.1"] },
    { "id": 5, "tasks": ["5.2"] },
    { "id": 6, "tasks": ["5.3", "7.1", "7.4", "7.7"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.5", "7.6", "7.8"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 9, "tasks": ["9.4", "9.5", "9.6", "10.1", "10.2", "10.3"] }
  ]
}
```
