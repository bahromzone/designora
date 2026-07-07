# 🎨 Designora — Mukammal Frontend Yo'l Xaritasi

> **Maqsad:** Backend'dagi barcha imkoniyatlarni (auth, learning, quiz, sertifikat,
> to'lov, qidiruv, community, analitika) chiroyli, tez va qulay React interfeysga
> aylantirish.
> **Tayyorlangan sana:** 2026-yil 7-iyul
> **Repozitoriya:** `bahromzone/designora` — `frontend/`

---

## 📊 1. HOZIRGI HOLAT

### ✅ Allaqachon bor
**Stack:** React 18 + Vite + Tailwind + React Router + Framer Motion/GSAP.

**Tayyor sahifalar (`src/pages`):** Home, Courses, CourseDetail, Learn (pleyer),
MyCourses, Login, Register, Profile, 404.

**Infratuzilma:** `lib/api.js` (fetch wrapper + xato o'qish), `AppShell` layout,
`ProtectedRoute`, `context/` (auth holati), Docker + nginx + CI (eslint/prettier/vitest/build).

### ⚠️ `lib/api.js`'da faqat 3 blok ulangan
Hozircha faqat **auth**, **courses**, **learning** API'lari ulangan. Backend'da
tayyor, lekin frontend'da ulanmagan: quiz, sertifikat, sharh, qidiruv, tavsiya,
forum, blog, bildirishnoma, referral, analitika, media (signed video), gamifikatsiya.

---

## 🎯 2. VIZYON: "mukammal frontend" nima?

1. **Tez** — skeleton loading, optimistik yangilanish, kod bo'linishi (lazy routes)
2. **Chiroyli va izchil** — yagona dizayn tizimi, bir xil komponentlar
3. **Qulay** — mobil-birinchi, klaviatura bilan ishlaydigan, a11y (WCAG)
4. **Tirik** — silliq animatsiyalar, real-time bildirishnomalar, dark mode
5. **To'liq** — backend'ning har bir imkoniyati UI'da aks etadi

---

## 🧱 3. BOSQICHMA-BOSQICH YO'L XARITASI

### 🔹 FBOSQICH 0 — Poydevor va dizayn tizimi (1 hafta)
*Maqsad: hamma sahifa uchun umumiy "lego" bo'laklari.*
- [ ] **Dizayn tokenlari** — Tailwind'da ranglar, shрифтlar, radius, soyalar (yagona palitra)
- [ ] **UI komponent kutubxonasi** — `Button`, `Input`, `Select`, `Card`, `Badge`,
      `Modal`, `Tabs`, `Toast`, `Avatar`, `Rating` (yulduzlar), `Pagination`
- [ ] **Skeleton komponentlari** — yuklanish paytida (kurs kartasi, ro'yxat, sahifa)
- [ ] **Bo'sh holatlar (empty states)** va xato holatlari uchun umumiy komponent
- [ ] **`api.js` to'liq kengaytirish** — barcha backend endpointlari uchun modullar
- [ ] **Dark mode** — `ThemeContext` + Tailwind `dark:` + localStorage
- [ ] **Toast/notification tizimi** — muvaffaqiyat/xato xabarlari uchun

### 🔹 FBOSQICH 1 — Kashfiyot va katalog (1 hafta)
*Maqsad: foydalanuvchi kursni oson topsin.*
- [ ] **Qidiruv + filtr sahifasi** — `/api/discovery/search` (kalit so'z, kategoriya,
      daraja, narx, reyting, saralash, sahifalash)
- [ ] **Kategoriya cheplari (chips)** — `/api/discovery/categories`
- [ ] **Tavsiyalar bloklari** — "ko'p sotilgan", "o'xshash kurslar" (bosh sahifa + detal)
- [ ] **Kurs kartasi** — reyting, narx, talabalar soni, daraja (dizayn tizimidan)

### 🔹 FBOSQICH 2 — O'quv tajribasi to'ldirish (1–2 hafta)
*Maqsad: Learn sahifasini haqiqiy LMS darajasiga chiqarish.*
- [ ] **Quiz yechish** — `/api/quiz` (savol turlari, yuborish, natija, urinishlar)
- [ ] **Sharh va reyting** — kurs detalida yozish/ko'rish (`/api/reviews`)
- [ ] **Q&A** — dars ostida savol-javob (`/api/qa`)
- [ ] **Eslatmalar** — video vaqtiga bog'langan (`/api/notes`)
- [ ] **Signed video** — pleyerda `/api/media/lessons/{id}/sign` orqali himoyalangan URL
- [ ] **Sertifikat** — tugatgandan keyin olish + ommaviy tekshirish sahifasi (`/verify/:code`)

### 🔹 FBOSQICH 3 — To'lov va monetizatsiya (1 hafta)
*Maqsad: kursni sotib olishni yo'lga qo'yish.*
- [ ] **Checkout oqimi** — Payme/Click'ga yo'naltirish (`/api/payments`)
- [ ] **Savatcha / kupon** — chegirma qo'llash UI
- [ ] **To'lov holati sahifalari** — muvaffaqiyat / bekor / kutilmoqda

### 🔹 FBOSQICH 4 — Community va o'sish (1 hafta)
*Maqsad: foydalanuvchini ushlab turish.*
- [ ] **Forum** — mavzular ro'yxati, mavzu + javoblar (`/api/forum`)
- [ ] **Blog** — ro'yxat + maqola sahifasi, SEO meta (`/api/blog`)
- [ ] **Bildirishnomalar** — header'da qo'ng'iroq + o'qilmagan hisoblagich (`/api/notifications`)
- [ ] **Referral** — kod ulashish + statistika (`/api/referrals`)
- [ ] **Instruktor profili** — ommaviy sahifa (`/api/instructors/{id}`)
- [ ] **Gamifikatsiya** — profilda ball/daraja/nishonlar + leaderboard (`/api/gamification`)

### 🔹 FBOSQICH 5 — Dashboardlar (1 hafta)
*Maqsad: instruktor va admin uchun boshqaruv.*
- [ ] **Instruktor dashboard** — daromad, talabalar, tugatish (`/api/analytics/instructor`)
- [ ] **Admin dashboard** — KPI, voronka, top kurslar (`/api/analytics/admin`)
- [ ] **Grafiklar** — chart kutubxonasi (Recharts yoki shu kabi)
- [ ] **Instruktor kontent boshqaruvi** — kurs/modul/dars/quiz CRUD UI (`/api/instructor`)
- [ ] **Event tracking** — sahifa ko'rish/klik hodisalarini `/api/analytics/track` ga yuborish

### 🔹 FBOSQICH 6 — Mukammallik (davomiy)
*Maqsad: professional daraja.*
- [ ] **Accessibility (a11y)** — WCAG, klaviatura navigatsiyasi, ARIA, screen reader
- [ ] **Onboarding** — yangi foydalanuvchi uchun qiziqishlarni tanlash
- [ ] **i18n** — `/api/i18n` katalogidan uz/ru/en almashtirish
- [ ] **PWA** — service worker, offline, "telefonga o'rnatish"
- [ ] **Performance** — lazy routes, image lazy-load, bundle tahlili
- [ ] **Refresh-token oqimi** — jim `/api/auth/refresh` bilan sessiyani uzaytirish

---

## 🛠️ 4. TAVSIYA ETILGAN KUTUBXONALAR

| Ehtiyoj | Tavsiya |
|---------|---------|
| Server holati / kesh | TanStack Query (React Query) |
| Grafiklar | Recharts |
| Formalar | React Hook Form + Zod |
| Video pleyer | Video.js yoki Mux Player |
| Ikonlar | lucide-react |
| Toast | sonner yoki react-hot-toast |
| Test | Vitest + React Testing Library (allaqachon bor) |

> Har bir yangi kutubxona `frontend/package.json` ga qo'shilib, `npm ci` CI'da
> tekshiriladi. Ortiqcha og'irlikdan qochish uchun kamroq, lekin kuchli tanlov.

---

## ⚖️ 5. ISHLASH TARTIBI (muhim)

Frontend backend'dan farqli — **vizual**. CI faqat lint/build/test'ni tekshiradi,
lekin sahifa chiroyli ko'rinishini tasdiqlay olmaydi. Shuning uchun:

1. **Kichik bo'laklar** — har PR bitta sahifa yoki komponent guruhi (katta emas).
2. **Brauzerda tekshirish** — har bo'lakni `npm run dev` da ko'z bilan ko'rib tasdiqlash.
3. **Avval `api.js` + dizayn tizimi**, keyin sahifalar — poydevor bir marta quriladi.
4. **Har PR:** `npm run lint && npm run format:check && npm run test:run && npm run build` yashil.

---

## 📅 6. TAXMINIY TARTIB

| Bosqich | Natija |
|---------|--------|
| FBosqich 0 | Dizayn tizimi + to'liq API klient + dark mode |
| FBosqich 1 | Qidiruv/filtr + tavsiyalar |
| FBosqich 2 | Quiz, sharh, Q&A, eslatma, sertifikat, himoyalangan video |
| FBosqich 3 | To'lov oqimi |
| FBosqich 4 | Forum, blog, bildirishnoma, referral, gamifikatsiya |
| FBosqich 5 | Instruktor/admin dashboardlar |
| FBosqich 6 | a11y, i18n, PWA, performance (davomiy) |

---

## ✅ 7. KEYINGI ANIQ QADAM

**FBosqich 0** dan boshlash mantiqiy: dizayn tizimi va to'liq `api.js` bir marta
quriladi, keyin har sahifa tez yig'iladi. Yoki tezroq ko'rinadigan natija uchun
**FBosqich 1 (qidiruv/filtr)** dan boshlash mumkin.

> 💡 Maslahat: backend'dagidek — bir bosqichni to'liq tugatib, brauzerda ko'rib,
> keyin oldinga yuramiz. "Ishlaydigan sodda > mukammal lekin tugallanmagan."
