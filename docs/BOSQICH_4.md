# 🌐 BOSQICH 4 — Kashfiyot, community va o'sish

> Maqsad: foydalanuvchilarni jalb qilish va ushlab turish.

## ✅ Bajarilgan vazifalar (8/8)

| # | Vazifa | Holat |
|---|--------|-------|
| 1 | Qidiruv va filtr (kategoriya, daraja, narx, reyting, til) + saralash | ✅ |
| 2 | Tavsiyalar ("ko'p sotilgan", "o'xshash kurslar") | ✅ |
| 3 | Sharhlar va reytinglar (5-yulduz + matn, avtomatik agregatsiya) | ✅ |
| 4 | Instruktor profillari (ommaviy sahifa, portfolio, statistika) | ✅ |
| 5 | Bildirishnomalar (platforma ichida, o'qilgan/o'qilmagan) | ✅ |
| 6 | Referral / Affiliate dasturi (kod + mukofot ball) | ✅ |
| 7 | Blog / SEO kontenti (slug, meta teglar, chop etish) | ✅ |
| 8 | Community forum (mavzular + javoblar) | ✅ |

## 🗄️ Yangi modellar

- `Review` — kurs sharhi + reyting (user×course noyob)
- `BlogPost` — blog / SEO maqola
- `ForumThread`, `ForumPost` — community forum
- `Referral` — referral / affiliate yozuvi
- Kengaytirildi: `User` (+`referral_code`, `referred_by_id`)

## 🔌 Yangi API'lar

### Discovery — `/api/discovery`
- `GET /search` — q, category, level, language, min/max_price, min_rating, sort, sahifalash
- `GET /categories` — kategoriyalar + kurslar soni
- `GET /recommendations/bestselling`
- `GET /recommendations/similar/{course_id}`

### Reviews — `/api/reviews`
- `GET /courses/{id}` · `GET /courses/{id}/summary` · `GET /courses/{id}/my`
- `POST /courses/{id}` — sharh qoldirish/yangilash (yozilgan bo'lish shart)
- `DELETE /{review_id}`

### Instructors — `/api/instructors`
- `GET /{id}` — ommaviy profil + statistika + kurslar
- `GET /{id}/courses`

### Notifications — `/api/notifications`
- `GET /` · `GET /unread-count` · `POST /{id}/read` · `POST /read-all` · `DELETE /{id}`

### Referrals — `/api/referrals`
- `GET /my-code` — kod + statistika
- `POST /apply` — kodni qo'llash (bir marta)
- `GET /my-referrals`

### Blog — `/api/blog`
- `GET /` · `GET /{slug}` (ommaviy)
- `POST /` · `PATCH /{id}` · `POST /{id}/publish` · `DELETE /{id}` (muallif/admin)

### Forum — `/api/forum`
- `GET /threads` · `GET /threads/{id}` (ommaviy)
- `POST /threads` · `POST /threads/{id}/posts` (auth)
- `DELETE /threads/{id}` · `DELETE /posts/{id}` (egasi/admin)

## 🧩 Servislar

- `review_service` — reyting agregatsiyasi (sof) + Course.rating qayta hisoblash
- `recommendation_service` — bestselling / similar (sof funksiyalar)
- `notification_service` — bildirishnoma yaratish yordamchisi

## 💸 Referral qoidalari

- Har bir foydalanuvchi noyob 8 belgili kodga ega (`GET /my-code` da yaratiladi).
- Yangi foydalanuvchi kodni bir marta qo'llaydi; taklif qilgan foydalanuvchi
  **+50 ball** va bildirishnoma oladi.
- O'z kodini qo'llab bo'lmaydi; ikki marta qo'llab bo'lmaydi.

## 🗃️ Migratsiya

```bash
cd backend
alembic upgrade head   # g5b1c2d3e4f7
```

## 🧪 Testlar

```bash
cd backend
pytest tests/test_review_service.py tests/test_recommendation_service.py \
       tests/test_reviews_api.py tests/test_discovery_api.py \
       tests/test_community_api.py tests/test_blog_api.py -v
```
