# 📖 Designora — API yo'riqnomasi

> To'liq interaktiv hujjat: `http://localhost:8000/docs` (Swagger) · `/redoc`

Barcha JSON endpointlar `Content-Type: application/json` kutadi. Himoyalangan
endpointlar token talab qiladi (cookie yoki `Authorization: Bearer <token>`).

---

## Auth — `/api/auth`

### `POST /api/auth/register`
Yangi foydalanuvchi ro'yxatdan o'tkazadi.

**So'rov:**
```json
{
  "username": "aziz",
  "email": "aziz@example.com",
  "password": "Parol123",
  "recaptcha_token": "..."
}
```
Parol sharti: ≥ 8 belgi, kamida 1 katta harf va 1 raqam.

**Javob `200`:** `access_token`, `user`, `redirect`. httpOnly cookie o'rnatiladi.

### `POST /api/auth/login`
Kirish. Muvaffaqiyatli bo'lsa streak yangilanadi.

**So'rov:** `{ "email": "...", "password": "...", "recaptcha_token": "..." }`
**Javob `200`:** `{ "success": true, "redirect": "...", "access_token": "...", "user": {...} }`
**Xatolar:** `401` — login/parol xato.

### `POST /api/auth/forgot-password` · `POST /api/auth/reset-password`
Parolni tiklash (email orqali token).

---

## Profil — `/api/profile` 🔒

| Metod | Yo'l | Tavsif |
|-------|------|--------|
| `GET`  | `/api/profile/me` | Joriy foydalanuvchi ma'lumoti |
| `PUT`  | `/api/profile/update` | Profilni yangilash (bio, phone, location, website) |
| `POST` | `/api/profile/change-password` | Parolni o'zgartirish |
| `GET`  | `/api/profile/stats` | Statistika (points, level, streak) |
| `GET`  | `/api/profile/progress/{course_id}` | Kurs bo'yicha progress |

`GET /api/me` → `307` redirect → `/api/profile/me`.

---

## Kurslar (public) — `/api/courses`

### `GET /api/courses`
Faol kurslar ro'yxati.
```json
[
  { "id": 1, "title": "...", "price": 0, "description": "...",
    "category": "fashion", "thumbnail_url": "..." }
]
```

### `GET /api/courses/{course_id}`
Bitta kurs. `404` — topilmasa yoki nofaol bo'lsa.

---

## Admin — `/api/admin` 🔒 (faqat `admin` roli)

| Metod | Yo'l | Tavsif |
|-------|------|--------|
| `GET`    | `/api/admin/users` | Foydalanuvchilar ro'yxati |
| `GET`    | `/api/admin/courses` | Barcha kurslar (nofaol ham) |
| `POST`   | `/api/admin/courses` | Kurs yaratish (`201`) |
| `PATCH`  | `/api/admin/courses/{id}` | Kursni tahrirlash |
| `DELETE` | `/api/admin/courses/{id}` | Kursni o'chirish |
| `POST`   | `/api/admin/courses/{id}/toggle` | Faol/nofaol almashtirish |

**Ruxsat xatolari:** `401` — token yo'q · `403` — admin emas.

---

## Umumiy xato formati

FastAPI standarti:
```json
{ "detail": "Xato tavsifi" }
```
Validatsiya xatolarida `detail` massiv bo'ladi (`422`):
```json
{ "detail": [ { "loc": ["body", "password"], "msg": "...", "type": "..." } ] }
```
Frontend `src/lib/api.js` bu ikkala shaklni ham avtomatik qayta ishlaydi.
