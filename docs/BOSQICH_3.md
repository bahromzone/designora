# 🎓 BOSQICH 3 — O'rganish sifatini oshirish

> Maqsad: shunchaki video emas, haqiqiy ta'lim natijasi.

Ushbu bosqich Designora'ga to'liq “o'rganish natijasi” qatlamini qo'shadi:
testlar, topshiriqlar, sertifikatlar, gamifikatsiya, savol-javob va eslatmalar.

## ✅ Bajarilgan ishlar

| # | Vazifa | Holat |
|---|--------|-------|
| 1 | Quiz/Test dvijkasi (single/multiple/boolean + avtomatik baholash) | ✅ |
| 2 | Amaliy topshiriqlar (talaba yuboradi, instruktor baholaydi) | ✅ |
| 3 | Sertifikatlar (avtomatik PDF + verifikatsiya havolasi) | ✅ |
| 4 | Gamifikatsiya (badge/nishon, leaderboard, ball/daraja) | ✅ |
| 5 | Progress sertifikat sharti (100% + quizlardan o'tish) | ✅ |
| 6 | Savol-javob (Q&A) — har dars ostida | ✅ |
| 7 | Izohlar/eslatmalar (video vaqtida shaxsiy eslatma) | ✅ |

## 🗄️ Yangi modellar

- `Quiz`, `QuizQuestion`, `QuizAttempt` — test dvijkasi
- `LessonQuestion`, `LessonAnswer` — dars ostidagi Q&A
- `LessonNote` — video vaqtidagi eslatmalar
- `Badge`, `UserBadge` — gamifikatsiya nishonlari
- `AssignmentSubmission` — topshiriq javoblari + baholash
- Kengaytirildi: `Assignment` (lesson_id, description, max_score), `Certificate` (serial, verification_code, pdf_url, grade)

## 🔌 Yangi API'lar

### Quiz — `/api/quiz`
- `POST /courses/{course_id}/quizzes` — quiz yaratish (instruktor)
- `PATCH /quizzes/{id}` · `DELETE /quizzes/{id}` · `GET /quizzes/{id}/manage`
- `POST /quizzes/{id}/questions` · `PATCH /questions/{id}` · `DELETE /questions/{id}`
- `GET /quizzes/{id}/results` — barcha urinishlar (instruktor)
- `GET /courses/{course_id}/quizzes` — kurs quizlari (talaba)
- `GET /quizzes/{id}` — quizni yechish uchun (to'g'ri javoblarsiz)
- `POST /quizzes/{id}/submit` — javob yuborish + avtomatik baholash
- `GET /quizzes/{id}/my-attempts`

### Assignments — `/api/assignments`
- `POST /courses/{course_id}` — topshiriq yaratish (instruktor)
- `GET /{id}/submissions` · `POST /submissions/{id}/grade` (instruktor)
- `GET /courses/{course_id}` — topshiriqlar + o'z javobim
- `POST /{id}/submit` · `GET /{id}/my-submission`

### Certificates — `/api/certificates`
- `POST /courses/{course_id}/issue` — sertifikat berish (100% + quizlardan o'tilgan bo'lsa)
- `GET /my` · `GET /{id}/download`
- `GET /verify/{code}` — **ommaviy** tekshirish (autentifikatsiyasiz)

### Q&A — `/api/qa`
- `GET|POST /lessons/{id}/questions` · `POST /questions/{id}/answers`
- `PATCH /questions/{id}/resolve` · `DELETE /questions/{id}` · `DELETE /answers/{id}`

### Notes — `/api/notes`
- `GET /lessons/{id}` · `GET /my` · `POST /lessons/{id}` · `PATCH /{id}` · `DELETE /{id}`

### Gamification — `/api/gamification`
- `GET /leaderboard` · `GET /me` · `GET /badges`

## 🎮 Gamifikatsiya qoidalari

- Har **100 ball = 1 daraja**.
- Nishonlar avtomatik beriladi: quizdan o'tish, 100% ball, kursni tugatish, sertifikat olish, streaklar.
- Nishon o'z balliga ega — berilганда foydalanuvchi balliga qo'shiladi.

## 📜 Sertifikat sharti

Sertifikat **faqat** quyidagi shartlar bajarilganda beriladi:
1. Kurs progressi **100%** (barcha darslar tugatilgan)
2. Kursning **barcha faol testlaridan** o'tilgan

Baho o'rtacha quiz natijasidan hisoblanadi: A'lo (≥90%), Yaxshi (≥75%), Qoniqarli (≥60%).

## 🗃️ Migratsiya

```bash
cd backend
alembic upgrade head   # f3a9c1b2d4e6
```

> Eslatma: `Base.metadata.create_all` yangi jadvallarni ishga tushirishda ham
> avtomatik yaratadi. Migratsiya production/nazorat ostidagi muhitlar uchun.

## 🧪 Testlar

```bash
cd backend
pytest tests/test_quiz_grading.py tests/test_gamification.py -v
```
