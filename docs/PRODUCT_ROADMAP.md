# Designora mahsulot roadmap'i (v2)

> Bu hujjat repodagi **haqiqiy kod holatidan** kelib chiqib yozilgan.
> Oldingi versiya allaqachon yozilgan funksiyalarni "kelajakdagi ish" sifatida ko'rsatardi va shu sababli ustuvorlikni buzardi.

**Versiya:** v2
**Sana:** 2026-08-10
**Asos:** `main` @ saved courses + payment history API merge qilingandan keyin
**Bosh tamoyil:** yangi endpoint qo'shishdan oldin mavjud backend imkoniyatini foydalanuvchi ko'radigan oqimga ulash

---

## 1. Haqiqiy holat

### 1.1. Nima bor (koddan tasdiqlangan)

| Qatlam | Hajm | Izoh |
|--------|------|------|
| Backend routerlar | 46 ta | auth, learning, quiz, assignments, payments, media, portfolio, discovery, search, learning paths, calendar, forum, Q&A, gamification, referrals, notifications, instructor, admin, superadmin, moderation, blog, privacy, analytics |
| SQLAlchemy modellar | 35 ta | Alembic history to'liq |
| Backend testlar | ~70 fayl | SQLite va PostgreSQL'da alohida ishlaydi |
| Frontend sahifalar | 62 ta | student, instructor, admin va superadmin kabinetlari |
| Frontend komponentlar | ~48 ta | player, lesson sidebar, notes, quiz, assignment, onboarding |
| CI workflow | 4 ta | ci, e2e, backend-format, prettier-autofix |

Xulosa: **funksiya yetishmasligi muammo emas.** Backend LMS uchun kerakli deyarli hamma narsani qoplaydi.

### 1.2. Haqiqiy muammolar

**A. UI backend'dan orqada, ba'zi joyda esa oldinda ketib qolgan.**

`UserAccountMenu` da 6 ta havola bor, ulardan 4 tasi hech qayerga olib bormaydi:

| Havola | Holat |
|--------|-------|
| `/profil` | ishlaydi |
| `/kurslarim` | ishlaydi |
| `/profil#certificates` | anchor `ProfilePage`da yo'q |
| `/profil#saved` | anchor yo'q, API endi tayyor |
| `/profil#payments` | anchor yo'q, API endi tayyor |
| `/profil#settings` | anchor yo'q, UI umuman yozilmagan |

Menyu tavsifida "avatar, bio" deb yozilgan, lekin `ProfilePage`da tahrirlash formasi yo'q: faqat read-only ko'rinish.

**B. Frontend test qarzi.**

62 sahifa va ~48 komponentga atigi 7 ta test fayli to'g'ri keladi. Eng katta va eng xavfli fayllar umuman qoplanmagan: `Navbar.jsx` (28KB), `StudentDashboardPage.jsx` (23KB), `AssignmentSection.jsx` (13KB), `EngagementSection.jsx` (15KB). Bu fayllarni testsiz refactor qilish mumkin emas.

**C. Layout regressiyalari uchun gate yo'q.**

Bitta onboarding footer bug'i 8 ta PR oldi (#234 → #241). Har safar sabab taxmin qilinib tuzatildi. Hozirgi CI JS xatolarini tutadi, lekin "element ekranda ko'rinmayapti" turidagi buzilishni tutmaydi.

**D. E2E qamrovi tor.**

`frontend/e2e/` da bitta `critical-journey.spec.mjs` bor. To'lov, quiz, assignment feedback, sertifikat va parol tiklash oqimlari real brauzerda tekshirilmaydi.

**E. Pozitsiyalash hacklari.**

`UserAccountMenu` `fixed right-[8.5rem] top-4` bilan joylashtirilgan. Bu Navbar layout'iga bog'lanmagan sehrli qiymat: navbar o'zgarsa yoki zoom/mobil kengligi o'zgarsa siljiydi.

---

## 2. Ustuvorliklar

Tartib qat'iy. P0 tugamasdan P1 boshlanmaydi.

### P0 — o'lik havolalar va ishonchlilik

**Maqsad:** foydalanuvchi bosgan har bir tugma biror natija bersin.

#### P0.1. Profil sahifasini tab'larga bo'lish

`ProfilePage`ni 5 ta bo'limga ajratish va menyudagi anchorlarni real qilish:

- **Umumiy** — ism, avatar, bio tahrirlash (hozir yo'q, yozilishi kerak);
- **Sertifikatlar** — mavjud `CertificateSection`ni ulash;
- **Saqlangan** — `GET /api/saved-courses` (#243'da merge qilingan);
- **To'lovlar** — `GET /api/payments/history` (#243'da merge qilingan);
- **Sozlamalar** — parol o'zgartirish, email, til, reminder preferences, akkauntni o'chirish.

**Acceptance criteria:**

- menyudagi 6 ta havolaning hammasi to'g'ri bo'limni ochadi;
- deep-link (`/profil#payments`) to'g'ridan-to'g'ri ishlaydi, reload'dan keyin ham;
- har bo'limda loading, empty va error holati bor;
- kursi yoki to'lovi yo'q userga foydali CTA ko'rsatiladi;
- tab'lar klaviatura bilan boshqariladi (`role="tablist"`, arrow key);
- har bo'lim uchun kamida bitta test.

#### P0.2. Saqlangan kurslar oqimini yopish

API bor, lekin uni chaqiradigan tugma yo'q. `CourseCard` va `CourseDetailPage`ga saqlash tugmasi qo'shish, optimistic update va takroriy bosishdan himoya bilan.

#### P0.3. Layout regression gate

- Playwright'da kritik modallar va navigatsiya uchun ko'rinuvchanlik assertlari (`toBeInViewport`);
- 320px, 375px, 768px va 1366px kengliklarida smoke tekshiruv;
- CI'da PR uchun majburiy.

**Nega:** #234 → #241 takrorlanmasligi uchun.

#### P0.4. UserAccountMenu'ni Navbar layout'iga qaytarish

`fixed` + sehrli offset o'rniga navbar flex oqimida joylashtirish. Mobil va zoom holatlari test bilan qoplanadi.

**P0 KPI:** o'lik havola = 0; kritik oqimlarda blocker bug = 0.

---

### P1 — test qarzini yopish

**Maqsad:** eng katta fayllarni xavfsiz o'zgartirish mumkin bo'lsin.

Tartib (hajm va risk bo'yicha):

1. `Navbar.jsx` — auth holatlari, rol bo'yicha ko'rinadigan elementlar, mobil menyu;
2. `StudentDashboardPage.jsx` — davom ettirish bloki, deadline, empty state;
3. `AssignmentSection.jsx` — draft, upload validatsiya, resubmission;
4. `QuizSection.jsx` — topshirish va natija;
5. `VideoPlayer.jsx` — progress saqlash, xato holati;
6. `CheckoutPage` / `CheckoutResultPage` — duplicate click va pending holat.

**Acceptance criteria:** kritik komponentlar uchun kamida 70% qamrov; har bug-fix PR'i regression test bilan keladi.

#### P1.2. E2E oqimlarini kengaytirish

Yangi speclar: to'lov (sandbox), quiz topshirish, assignment yuborish va feedback ko'rish, sertifikat olish, parol tiklash.

---

### P2 — mavjud funksiyalarni oqimga ulash

Bu bosqichda **yangi backend yozilmaydi**, faqat bor narsa foydalanuvchiga chiqariladi.

- **Dashboard → hamma joyga deep-link:** notification, deadline va feedback bloklaridan to'g'ri sahifaga o'tish;
- **Assignment feedback ko'rinishi:** instructor feedback'i talabaga aniq ko'rinsin, resubmission tugmasi bilan;
- **Portfolio ulanishi:** baholangan topshiriqdan bir klikda portfolio loyihasi;
- **Global search:** keyboard shortcut, recent/popular, no-result tavsiyasi;
- **Learning paths:** prerequisites va progress ko'rsatkichi;
- **Calendar va reminderlar:** deadline'lar bitta joyda, quiet hours bilan.

---

### P3 — sifat va o'sish

- **Performance:** LCP < 2.5s, INP < 200ms, CLS < 0.1; bundle analysis; video CDN;
- **Accessibility:** WCAG 2.2 AA, focus trap, subtitr, reduced motion;
- **SEO:** course/breadcrumb schema, sitemap, OG image, sertifikat verifikatsiya sahifasi;
- **Analytics:** quyidagi eventlar standartlashtiriladi va har feature ular bilan chiqadi;
- **Instructor operatsiyalari:** review queue, course builder autosave, version history;
- **Monetizatsiya:** avval alohida kurs va bundle; subscription faqat retention isbotlangach;
- **Mobil va PWA:** offline shell, progress sync.

---

## 3. Analytics eventlari

`signup_started`, `signup_completed`, `onboarding_completed`, `search_performed`, `course_viewed`, `course_saved`, `enrollment_completed`, `checkout_started`, `payment_succeeded`, `payment_failed`, `payment_history_viewed`, `lesson_started`, `lesson_completed`, `video_progress_25|50|75|100`, `quiz_submitted`, `assignment_submitted`, `feedback_viewed`, `assignment_resubmitted`, `certificate_issued`, `portfolio_project_published`.

Har eventda kerak bo'lsa `user_id`, `course_id`, `lesson_id`, `source`, `device`, `timestamp`. Maxfiy ma'lumot payload'ga yuborilmaydi.

---

## 4. Delivery bosqichlari

| Sprint | Mazmun | Natija |
|--------|--------|--------|
| Sprint 1 | P0.1 + P0.2 | Profil tab'lari, saqlangan va to'lovlar UI'i ishlaydi |
| Sprint 2 | P0.3 + P0.4 | Layout gate CI'da, menyu pozitsiyasi tuzatilgan |
| Sprint 3 | P1.1 (1-3 fayl) | Navbar, Dashboard, Assignment testlar bilan qoplangan |
| Sprint 4 | P1.1 (4-6) + P1.2 | Qolgan komponentlar va yangi E2E speclar |
| Sprint 5 | P2 | Mavjud funksiyalar bitta oqimga ulangan |

Keyingi sprintlar KPI natijasiga qarab belgilanadi.

---

## 5. Definition of Done

Feature faqat quyidagilar bajarilganda tayyor:

- acceptance criteria bajarilgan;
- desktop va mobil ko'rinish tekshirilgan;
- loading, empty, error va permission holatlari mavjud;
- klaviatura navigatsiyasi ishlaydi;
- backend validation va authorization mavjud;
- unit yoki integration test yozilgan;
- bug-fix bo'lsa, regression test majburiy;
- analytics event qo'shilgan;
- CI yashil;
- rollback rejasi aniq.

---

## 6. Asosiy KPI

- **Activation:** signup → birinchi darsni boshlash; birinchi 24 soatda foydali action;
- **Engagement:** haftalik o'qish daqiqalari; lesson completion; assignment submission;
- **Retention:** D1/D7/D30; kursni davom ettirish darajasi;
- **Revenue:** checkout conversion; payment success; refund rate;
- **Sifat:** frontend test qamrovi; layout regression soni; o'rtacha bug-fix PR soni (bitta bugga 8 ta PR takrorlanmasin).

---

## 7. Qilinmaydigan ishlar

- backend'da bor funksiyani foydalanuvchi oqimisiz UIga chiqarish;
- UI'ni API tayyor bo'lmasdan turib merge qilish (menyu havolalari shu tarzda o'lik qoldi);
- layout bug'ini regression testsiz "ko'zga qarab" tuzatish;
- test yozmasdan katta fayllarni refactor qilish;
- subscription'ni kontent va retention tayyor bo'lmasdan ishga tushirish;
- accessibility va mobil ko'rinishni "keyin"ga qoldirish;
- analytics eventsiz feature chiqarish.

---

## 8. Yakuniy tavsiya

Designora'ning kuchli tomoni: boy backend va jiddiy CI intizomi. Zaif tomoni: shu boylik foydalanuvchiga to'liq yetib bormayapti va frontend test qarzi har o'zgarishni qimmatga aylantiryapti.

Shuning uchun birinchi deliverable **yangi feature emas**: profil bo'limlarini yopish, saqlangan va to'lovlar UI'ini chiqarish, keyin layout gate va test qarzini yopish. Shundan keyingina P2 va P3 mantiqiy bo'ladi.
