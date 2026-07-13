# 🔧 Designora Frontend — Kamchiliklarni Yopish Rejasi

> **Maqsad:** FRONTEND_YOL_XARITASI.md da belgilangan barcha ishlar mukammal
> darajada bajarilishi uchun qolgan kamchiliklarni to'liq yopish.
> **Yaratilgan sana:** 2026-yil 13-iyul
> **Repozitoriya:** `bahromzone/designora` — `frontend/`

---

## 📋 MUAMMO XULASASI

| # | Muammo | Jiddiyligi | Status |
|---|--------|-----------|--------|
| 1 | Tavsiya etilgan kutubxonalar o'rnatilmagan | 🔴 Yuqori | Ochiq |
| 2 | PWA service worker yo'q | 🔴 Yuqori | Ochiq |
| 3 | Test coverage juda past (~20%) | 🟡 O'rta | Ochiq |
| 4 | Stillar izchil emas (CSS + Tailwind aralash) | 🟡 O'rta | Ochiq |
| 5 | api.js da kesh/retry/loading state management yo'q | 🔴 Yuqori | Ochiq |
| 6 | Forma validatsiyasi primitiv | 🟡 O'rta | Ochiq |
| 7 | Grafiklar real kutubxonada emas | 🟡 O'rta | Ochiq |

---

## 🟥 BOSQICH 1 — Kutubxonalar o'rnatish va integratsiya (2-3 kun)

### 1.1 TanStack Query (React Query) o'rnatish

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Qilinadigan ishlar:**
- [ ] `main.jsx` da `QueryClientProvider` qo'shish
- [ ] `lib/apiCore.js` dagi barcha fetch chaqiruvlarini `useQuery` / `useMutation` hooklar bilan almashtirish
- [ ] Har bir API modul uchun custom hook yozish:
  - [ ] `hooks/useAuth.js` — login, register, refresh
  - [ ] `hooks/useCourses.js` — courses list, detail, search
  - [ ] `hooks/useLearning.js` — progress, lessons
  - [ ] `hooks/useQuiz.js` — quiz, submit, results
  - [ ] `hooks/usePayments.js` — checkout, status
  - [ ] `hooks/useForum.js` — threads, replies
  - [ ] `hooks/useBlog.js` — posts, single post
  - [ ] `hooks/useNotifications.js` — list, mark read
  - [ ] `hooks/useGamification.js` — stats, leaderboard
  - [ ] `hooks/useAdmin.js` — dashboard, moderation
  - [ ] `hooks/useInstructor.js` — analytics, courses CRUD
- [ ] Optimistik yangilanish (optimistic updates) qo'shish: sharh yozish, quiz yuborish, forum javob
- [ ] Stale time va cache time sozlash (kurslar 5min, profil 10min, notifications 30s)
- [ ] Error boundary + retry logic (3x, exponential backoff)
- [ ] React Query Devtools faqat dev muhitda yoqish

### 1.2 React Hook Form + Zod o'rnatish

```bash
npm install react-hook-form zod @hookform/resolvers
```

**Qilinadigan ishlar:**
- [ ] Login formani React Hook Form ga o'tkazish + Zod schema
- [ ] Register formani o'tkazish (email, password strength, confirm)
- [ ] Instructor Apply formani o'tkazish (ko'p maydonli)
- [ ] Checkout formani o'tkazish (kupon, to'lov turi)
- [ ] Profile tahrirlash formani o'tkazish
- [ ] Forum yangi mavzu/javob formalarini o'tkazish
- [ ] Instructor Course Edit formani o'tkazish (eng murakkab)
- [ ] Umumiy `FormField` wrapper komponent yaratish (label + error display)
- [ ] Zod schemalarini `lib/schemas/` papkasiga alohida chiqarish

### 1.3 Recharts o'rnatish

```bash
npm install recharts
```

**Qilinadigan ishlar:**
- [ ] `InstructorAnalyticsPage.jsx` — real LineChart (daromad) + BarChart (talabalar)
- [ ] `AdminDashboardPage.jsx` — AreaChart (KPI trend) + PieChart (kategoriyalar)
- [ ] `DashboardInsights.jsx` — ComposedChart (voronka)
- [ ] `StudentDashboard` — progress RadialBarChart
- [ ] Umumiy `ChartWrapper` komponent (loading/empty state bilan)
- [ ] Responsive container + dark mode ranglarni Tailwind tokenlarga ulash

### 1.4 Video.js o'rnatish

```bash
npm install video.js
```

**Qilinadigan ishlar:**
- [ ] `components/VideoPlayer.jsx` ni Video.js asosida qayta yozish
- [ ] Signed URL integratsiyasi (`/api/media/lessons/{id}/sign`)
- [ ] Playback speed sozlamalari (0.5x, 1x, 1.25x, 1.5x, 2x)
- [ ] Quality selector (auto, 360p, 720p, 1080p)
- [ ] Progress saqlash (oxirgi vaqtdan davom etish)
- [ ] Timestamp-ga bog'langan note olish (NotesSection bilan integratsiya)
- [ ] HLS/DASH stream qo'llab-quvvatlash
- [ ] Anti-piracy: right-click disable, screenshot blocker (asosiy)

### 1.5 Lucide React + Sonner o'rnatish

```bash
npm install lucide-react sonner
```

**Qilinadigan ishlar:**
- [ ] Barcha sahifalardagi qo'lda yozilgan SVG ikonlarni `lucide-react` ga almashtirish
- [ ] `ToastContext.jsx` ni `sonner` bilan almashtirish (yoki integratsiya)
- [ ] Toast turlari: success, error, warning, info, loading
- [ ] Toast pozitsiyasi: top-right (desktop), bottom-center (mobile)

---

## 🟥 BOSQICH 2 — PWA to'liq implementatsiya (1-2 kun)

### 2.1 Service Worker yaratish

**Qilinadigan ishlar:**
- [ ] `vite-plugin-pwa` o'rnatish:
  ```bash
  npm install -D vite-plugin-pwa
  ```
- [ ] `vite.config.js` da PWA plugin sozlash:
  - Runtime caching strategiyalari (NetworkFirst: API, CacheFirst: static)
  - Precaching: index.html, CSS, JS bundles
- [ ] `public/manifest.json` yaratish:
  - App nomi, ranglar, ikonlar (192x192, 512x512)
  - `display: standalone`
  - `start_url: /`
  - `theme_color` va `background_color`
- [ ] App ikonlarini dizayn qilish (PWA uchun)

### 2.2 Offline funksionallik

- [ ] `OfflineCenter.jsx` ni real service worker bilan ulash
- [ ] `offlineStore.js` da IndexedDB orqali saqlash:
  - O'tilgan darslar ro'yxati
  - Quiz natijalari (keyinroq sync)
  - Notes (offline yozish, online sync)
- [ ] `offlineSync.js` — Background Sync API bilan offline harakatlarni navbatga qo'yish
- [ ] Offline banner ko'rsatish (internet yo'qolsa)
- [ ] `navigator.onLine` eventlarini tinglash

### 2.3 Install prompt

- [ ] `beforeinstallprompt` eventni tutish
- [ ] "Telefonga o'rnatish" banner/button ko'rsatish
- [ ] O'rnatilganidan keyin bannerni yashirish

---

## 🟡 BOSQICH 3 — Test coverage 60%+ ga olib kelish (3-4 kun)

### 3.1 Unit testlar (lib/)

- [ ] `apiCore.js` — fetch wrapper, error handling, token refresh
- [ ] `checkoutApi.js` — to'lov oqimi
- [ ] `adminApi.js` — admin endpointlari
- [ ] `globalSearchApi.js` — qidiruv parametrlari
- [ ] `gamificationV2Api.js` — ball hisoblash
- [ ] `moderationApi.js` — kontentni boshqarish
- [ ] `portfolioApi.js` — portfolio CRUD
- [ ] `offlineStore.js` — IndexedDB operatsiyalari (mock)
- [ ] `offlineSync.js` — navbat logikasi
- [ ] `performance.js` — metrikalar

### 3.2 Komponent testlar (components/)

- [ ] `QuizSection.jsx` — savol ko'rsatish, javob tanlash, yuborish
- [ ] `ReviewsSection.jsx` — sharh yozish, reyting
- [ ] `QASection.jsx` — savol-javob, javob berish
- [ ] `NotesSection.jsx` — note qo'shish, tahrirlash, o'chirish
- [ ] `NotificationBell.jsx` — o'qilmagan hisoblagich, ro'yxat
- [ ] `GamificationSection.jsx` — ball ko'rsatish, nishonlar
- [ ] `ReferralSection.jsx` — kod nusxalash, statistika
- [ ] `CertificateSection.jsx` — yuklab olish, tekshirish
- [ ] `VideoPlayer.jsx` — play/pause, progress
- [ ] `OnboardingModal.jsx` — qadamlar, skip, finish
- [ ] `LanguageSwitcher.jsx` — til almashtirish
- [ ] UI komponentlar: Button, Modal, Tabs, Rating, Pagination

### 3.3 Sahifa testlar (pages/)

- [ ] `HomePage.jsx` — asosiy bloklar renderini tekshirish
- [ ] `CoursesPage.jsx` — filtr, qidiruv, sahifalash
- [ ] `CheckoutPage.jsx` — to'lov oqimi
- [ ] `ForumListPage.jsx` — mavzular ro'yxati, yaratish
- [ ] `BlogListPage.jsx` — maqolalar, sahifalash
- [ ] `AdminDashboardPage.jsx` — ma'lumotlar yuklanishi
- [ ] `InstructorDashboardPage.jsx` — statistika
- [ ] `GlobalSearchPage.jsx` — qidiruv natijalari
- [ ] `ProfilePage.jsx` — tahrirlash, saqlash
- [ ] `LoginPage` va `RegisterPage` (mavjud bo'lsa)

### 3.4 Integration testlar

- [ ] Auth oqimi: login → protected route → logout
- [ ] Kurs sotib olish: detail → checkout → success
- [ ] O'qish oqimi: dars → quiz → natija → sertifikat

### 3.5 CI coverage sozlash

- [ ] `vitest.config.js` da coverage thresholds qo'shish:
  ```js
  coverage: {
    statements: 60,
    branches: 50,
    functions: 55,
    lines: 60
  }
  ```
- [ ] CI pipeline'da coverage reportni artifact sifatida saqlash

---

## 🟡 BOSQICH 4 — Stillarni yagona tizimga keltirish (2 kun)

### 4.1 CSS fayllarni Tailwind'ga migratsiya qilish

Quyidagi `.css` fayllarni Tailwind utility classlariga o'tkazish:

- [ ] `AchievementsPage.css` → Tailwind
- [ ] `AdminDashboardPage.css` → Tailwind
- [ ] `CalendarPage.css` → Tailwind
- [ ] `CheckoutPage.css` → Tailwind
- [ ] `CourseCommunityPage.css` → Tailwind
- [ ] `DashboardInsights.css` → Tailwind
- [ ] `GlobalSearchPage.css` → Tailwind
- [ ] `InstructorAnalyticsPage.css` → Tailwind
- [ ] `InstructorCourseEditPage.css` → Tailwind
- [ ] `InstructorDashboardPage.css` → Tailwind
- [ ] `InstructorReviewPage.css` → Tailwind
- [ ] `LearningPathsPage.css` → Tailwind
- [ ] `ModerationPage.css` → Tailwind
- [ ] `Portfolio.css` → Tailwind
- [ ] `PricingPage.css` → Tailwind
- [ ] `StudentDashboard.css` → Tailwind
- [ ] `SupportConsolePage.css` → Tailwind

Komponent CSS fayllar:
- [ ] `Accessibility.css` → Tailwind
- [ ] `AssignmentSection.css` → Tailwind
- [ ] `GlobalSearchLauncher.css` → Tailwind
- [ ] `LessonSidebar.css` → Tailwind
- [ ] `NotesSection.css` → Tailwind
- [ ] `OfflineCenter.css` → Tailwind
- [ ] `OnboardingFlow.css` → Tailwind
- [ ] `ReminderSettings.css` → Tailwind
- [ ] `ResponsiveShell.css` → Tailwind (responsive utilities)
- [ ] `SearchShortcut.css` → Tailwind
- [ ] `VideoPlayer.css` → Tailwind

### 4.2 Tailwind dizayn tokenlari tekshirish

- [ ] `tailwind.config.js` da ranglar, shriftlar, soyalar yagona palette'da ekanini tasdiqlash
- [ ] Dark mode ranglari har bir token uchun belgilanganmi tekshirish
- [ ] `index.css` da faqat base layer va plugin importlar qolsin

---

## 🟡 BOSQICH 5 — API layer mukammallashtirish (1-2 kun)

### 5.1 Refresh token oqimi

- [ ] `apiCore.js` da 401 javob olsa avtomatik `/api/auth/refresh` chaqirish
- [ ] Bir vaqtning o'zida bir nechta so'rov 401 olsa, faqat bitta refresh so'rov yuborish (mutex)
- [ ] Refresh ham muvaffaqiyatsiz bo'lsa, logout + login sahifasiga yo'naltirish
- [ ] Refresh token cookie'da (httpOnly) saqlash

### 5.2 Request interceptor

- [ ] Har so'rovga Authorization header avtomatik qo'shish
- [ ] Request/response logging (dev muhitda)
- [ ] Network timeout sozlash (30s default, upload uchun 120s)
- [ ] Abort controller integratsiyasi (sahifa tark etilsa so'rovni bekor qilish)

### 5.3 Error handling yaxshilash

- [ ] API xatolarini standart formatga keltirish: `{ code, message, details }`
- [ ] Rate limiting (429) uchun retry-after bilan kutish
- [ ] 500 xatolar uchun foydalanuvchiga tushunarli xabar
- [ ] Network error (offline) uchun alohida holatni boshqarish

---

## 📅 TAXMINIY JADVAL

| Bosqich | Muddat | Natija |
|---------|--------|--------|
| Bosqich 1 | 13-15 iyul | Kutubxonalar o'rnatilgan, hooklar yozilgan |
| Bosqich 2 | 16-17 iyul | PWA to'liq ishlaydi, offline qo'llab-quvvatlash |
| Bosqich 3 | 18-21 iyul | 60%+ test coverage, CI'da enforced |
| Bosqich 4 | 22-23 iyul | Barcha CSS fayllar o'chirilgan, faqat Tailwind |
| Bosqich 5 | 24-25 iyul | API layer production-ready |

---

## ✅ TUGATISH MEZONLARI

Quyidagilar **barchasi** bajarilganda ish tugagan hisoblanadi:

1. `npm run build` — xatosiz, bundle hajmi < 500KB (gzipped)
2. `npm run test:run` — 60%+ coverage, 0 ta failing test
3. `npm run lint` — 0 ta xato
4. Lighthouse PWA audit — 100 ball
5. Lighthouse Performance — 90+ ball
6. `src/` da `.css` fayl soni: 0 (faqat index.css qoladi)
7. Offline rejimda asosiy sahifalar ochiladi
8. Barcha formalar validatsiya bilan ishlaydi
9. Grafiklar real API data bilan to'ldirilgan
10. Video player signed URL bilan ishlaydi

---

> 💡 Har bosqichdan keyin `npm run lint && npm run test:run && npm run build`
> yashil ekanini tasdiqlang. Katta PR emas, kichik, aniq PR'lar bilan oldinga yuring.
