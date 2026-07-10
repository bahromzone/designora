# Designora mahsulotini rivojlantirish rejasi

> Maqsad: mavjud kuchli backend imkoniyatlarini foydalanuvchi uchun sodda, izchil va natijaga yo‘naltirilgan ta’lim tajribasiga aylantirish.

**Holat:** tavsiya etilgan roadmap  
**Asosiy auditoriya:** talabalar, instruktorlar, administratorlar  
**Ustuvor tamoyil:** yangi funksiyalarni ko‘paytirishdan oldin mavjud imkoniyatlarni yagona foydalanuvchi oqimiga birlashtirish

---

## 1. Hozirgi holat bo‘yicha xulosa

Designora’da LMS uchun kerakli asosiy texnik poydevor mavjud:

- autentifikatsiya va Google OAuth;
- kurs katalogi, kurs tafsilotlari va enrollment;
- darslarni ko‘rish va progressni saqlash;
- topshiriqlar, quiz va baholash;
- sertifikatlar;
- to‘lovlar;
- instructor kabineti;
- sharhlar, savol-javob va forum;
- gamification, referral va notifications;
- analytics va admin boshqaruvi;
- blog, SEO, privacy va tizim monitoringi;
- backend testlari va CI.

Asosiy muammo funksiyalar yetishmasligi emas. Muammo shundaki, mavjud imkoniyatlar talaba uchun bitta aniq oqimga birlashtirilmagan. Foydalanuvchi platformaga kirganda quyidagi savollarga darhol javob olishi kerak:

1. Hozir nimani davom ettiraman?
2. Keyingi vazifam nima?
3. Qachongacha bajarishim kerak?
4. Qancha progress qildim?
5. Mentor feedback’i qayerda?
6. Sertifikat olish uchun yana nima qolgan?

---

## 2. Mahsulot tamoyillari

Barcha yangi ishlar quyidagi tamoyillarga mos bo‘lishi kerak:

- **Bitta asosiy keyingi qadam:** har sahifada foydalanuvchiga eng muhim keyingi harakat ko‘rsatiladi.
- **Progress ko‘rinadigan bo‘lsin:** kurs, modul, topshiriq va sertifikat progressi yashirin qolmasin.
- **Mobil birinchi:** asosiy ta’lim oqimlari telefonda to‘liq ishlashi kerak.
- **Tezlik:** foydalanuvchi 3 klikdan ortiq yurmasdan darsga qayta olishi kerak.
- **Real holatlar:** loading, empty, error, offline va permission holatlari dizaynda alohida ko‘riladi.
- **Accessibility:** klaviatura navigatsiyasi, focus state, kontrast, alt matn va subtitrlar majburiy.
- **O‘lchanadigan natija:** har katta funksiya KPI va event tracking bilan chiqariladi.

---

# 3. Ustuvor roadmap

## P0. Ishonchlilik va mavjud oqimlarni mustahkamlash

**Maqsad:** yangi funksiyalardan oldin asosiy student journey xatosiz ishlashini ta’minlash.

### 3.1. Asosiy foydalanuvchi oqimlari auditi

Tekshiriladigan oqimlar:

- ro‘yxatdan o‘tish → email tasdiqlash → onboarding;
- login → kurs topish → kursga yozilish;
- to‘lov → muvaffaqiyatli enrollment;
- darsni ochish → video ko‘rish → progressni saqlash;
- quiz topshirish → natijani ko‘rish;
- assignment yuborish → instructor feedback olish;
- kursni yakunlash → sertifikat olish va tekshirish;
- parolni tiklash;
- profilni o‘zgartirish va akkauntni o‘chirish.

**Acceptance criteria:**

- har bir oqim uchun end-to-end test mavjud;
- xatodan so‘ng foydalanuvchi nima qilishni tushunadi;
- muvaffaqiyatli amaldan keyin aniq confirmation ko‘rsatiladi;
- ikki marta bosish duplicate payment, enrollment yoki submission yaratmaydi;
- refresh’dan keyin progress yo‘qolmaydi.

### 3.2. Loading, empty va error holatlari

Har bir asosiy sahifada:

- skeleton loading;
- bo‘sh holat va foydali CTA;
- retry tugmasi bilan xato holati;
- internet uzilganda offline xabar;
- permission yo‘q bo‘lsa tushunarli izoh;
- mavjud bo‘lmagan kontent uchun yaxshi 404 holati.

### 3.3. Frontend test qamrovi

Qo‘shiladigan testlar:

- Navbar va autentifikatsiya holatlari;
- Student Dashboard;
- course filtering va search;
- LearnPage progress saqlashi;
- quiz va assignment oqimlari;
- checkout result;
- responsive navigatsiya;
- accessibility smoke testlari.

**KPI:** kritik student journey’larda 0 ta blocker bug; frontend kritik komponentlari uchun kamida 70% test qamrovi.

---

## P1. Student Dashboard

**Maqsad:** talabaga barcha muhim ishlarni bitta joyda ko‘rsatish.

### 3.4. Dashboard tarkibi

#### “Davom ettirish” bloki

- oxirgi ochilgan kurs va dars;
- kurs progressi;
- “Darsni davom ettirish” asosiy CTA;
- oxirgi faoliyat va keyingi dars nomi;
- taxminiy qolgan vaqt.

#### “Bugungi reja” bloki

- bugun ko‘riladigan darslar;
- topshiriladigan assignment va quizlar;
- foydalanuvchi belgilagan o‘qish vaqti;
- bajarilgan ishlarni belgilash;
- bajarilmagan vazifani boshqa kunga ko‘chirish.

#### Deadline va feedback

- yaqinlashayotgan deadline’lar;
- kechikkan topshiriqlar;
- yangi instructor feedback;
- qayta topshirish talab qilingan ishlar;
- notification’dan kerakli sahifaga deep-link.

#### Progress va sertifikat

- faol kurslar bo‘yicha progress;
- haftalik o‘rganish vaqti;
- streak va XP;
- sertifikat olish uchun qolgan talablar;
- yakunlangan kurslar va sertifikatlar.

#### Tavsiyalar

- foydalanuvchi maqsadiga mos keyingi kurs;
- davom ettirish ehtimoli yuqori kurslar;
- “Nega tavsiya qilindi?” izohi;
- qiziq emas deb belgilash imkoniyati.

### 3.5. Dashboard UX talablari

- desktop va mobile uchun alohida kompozitsiya;
- asosiy CTA yuqori qismda;
- dashboard 2 soniyadan tez usable holatga kelishi;
- yangi foydalanuvchi uchun first-run empty state;
- kursi yo‘q foydalanuvchiga katalog va onboarding CTA;
- barcha bloklardan to‘g‘ri deep-link;
- keyboard va screen-reader qo‘llab-quvvatlashi.

**KPI:** darsga qaytish vaqti < 10 soniya; weekly active learners +20%; course continuation rate +15%.

---

## P1. Shaxsiy onboarding va maqsadlar

### 3.6. Onboarding savollari

- tajriba darajasi;
- qiziqish yo‘nalishi;
- maqsad: ish topish, portfolio, freelance yoki hobbi;
- haftasiga ajratiladigan vaqt;
- afzal til;
- reminder vaqti.

### 3.7. Onboarding natijasi

- shaxsiy learning path;
- tavsiya etilgan boshlang‘ich kurs;
- haftalik reja;
- dashboard konfiguratsiyasi;
- onboardingni keyinroq profil orqali o‘zgartirish.

**Acceptance criteria:** onboardingni skip qilish mumkin; javoblar profilga saqlanadi; recommendation service ulardan foydalanadi.

**KPI:** onboarding completion > 65%; birinchi darsni boshlash konversiyasi +20%.

---

## P1. Assignment va portfolio oqimi

Design ta’lim platformasining haqiqiy qiymati video emas, amaliy ish va feedback. Shu sabab bu yo‘nalish juda yuqori prioritetga ega.

### 3.8. Assignment topshirish

- brief, talablar, deadline va rubric;
- bir nechta fayl yoki havola yuborish;
- draft saqlash;
- upload progress;
- format va fayl hajmi validatsiyasi;
- submission history;
- deadline’dan oldin almashtirish;
- qayta topshirish.

### 3.9. Instructor review

- rubric bo‘yicha ball;
- matnli feedback;
- rasm ustida annotation;
- vaqt kodi bilan video feedback;
- “qabul qilindi” yoki “qayta ishlash kerak” holati;
- feedback yuborilganda notification.

### 3.10. Portfolio

- kurs loyihasini portfolio’ga bir klikda qo‘shish;
- cover, tavsif, ishlatilgan vositalar va skills;
- public/private holat;
- public portfolio URL;
- loyiha tartibini o‘zgartirish;
- social share metadata;
- certificate bilan bog‘lash.

**KPI:** assignment submission rate +25%; feedback’dan keyin resubmission rate; kursni portfolio loyihasi bilan yakunlash ulushi.

---

## P1. Qidiruv va discovery

### 3.11. Global qidiruv

Qidiruv quyidagilarni topishi kerak:

- kurslar;
- darslar;
- instruktorlar;
- blog postlar;
- forum mavzulari.

Imkoniyatlar:

- typo tolerance;
- recent searches;
- popular searches;
- keyboard shortcut;
- natijalarni tur bo‘yicha guruhlash;
- no-result holatida tavsiyalar.

### 3.12. Kurs filtrlari

- kategoriya;
- daraja;
- davomiylik;
- narx;
- til;
- reyting;
- instructor;
- sertifikat mavjudligi;
- eng yangi, mashhur va reyting bo‘yicha sort.

### 3.13. Learning paths

Misollar:

- Grafik dizayn: boshlang‘ich → portfolio;
- Fashion design: asoslar → kolleksiya;
- UI/UX: research → prototip → case study;
- Freelance designer: skill → portfolio → mijoz bilan ishlash.

Har path’da prerequisites, progress va yakuniy loyiha bo‘lsin.

**KPI:** search-to-course-view conversion; course detail-to-enrollment conversion; no-result rate < 5%.

---

## P2. O‘quv kalendari va reminderlar

### 3.14. Calendar

- assignment deadline’lari;
- live session’lar;
- shaxsiy learning plan;
- instructor review sanalari;
- kun, hafta va oy ko‘rinishi;
- timezone’ni to‘g‘ri hisoblash.

### 3.15. Reminder sozlamalari

- email;
- in-app notification;
- browser push;
- dars va deadline reminderlari;
- quiet hours;
- frequency control;
- unsubscribe va granular preference.

**KPI:** reminder’dan qaytgan sessionlar; missed deadline rate kamayishi; notification opt-out rate.

---

## P2. LearnPage va video tajribasi

### 3.16. Video player

- playback speed;
- sifat tanlash;
- subtitrlar;
- keyboard shortcuts;
- picture-in-picture;
- full screen;
- oxirgi vaqt kodidan davom ettirish;
- progressni davriy saqlash;
- video xatosida retry va fallback.

### 3.17. Dars yon paneli

- modul va darslar ro‘yxati;
- completed/current/locked holatlari;
- keyingi va oldingi dars;
- dars davomiyligi;
- assignment yoki quiz mavjudligi;
- mobile bottom sheet ko‘rinishi.

### 3.18. Notes va bookmarks

- vaqt kodiga bog‘langan note;
- note qidiruvi;
- rich text emas, yengil va tez editor;
- bookmark qilingan darslar;
- notes export;
- dashboard’dan so‘nggi note’ga qaytish.

**KPI:** lesson completion rate; video abandonment nuqtalari; note ishlatuvchilar retention’i.

---

## P2. Instructor kabineti

### 3.19. Instructor Home

- tekshirilishi kerak bo‘lgan submissionlar;
- savollar va unanswered Q&A;
- kurslar bo‘yicha active students;
- completion va dropout;
- daromad;
- kontent sifati bo‘yicha ogohlantirishlar.

### 3.20. Kurs builder

- drag-and-drop module va lesson tartibi;
- autosave;
- draft/published holati;
- preview as student;
- prerequisite sozlamalari;
- bulk upload;
- video processing holati;
- publish checklist;
- version history.

### 3.21. Instructor analytics

- enrollment funnel;
- lesson completion;
- quiz difficulty;
- video drop-off;
- assignment submission;
- review sentiment;
- CSV export.

**KPI:** submission review time; course publish time; instructor weekly active rate.

---

## P2. To‘lov va monetizatsiya

### 3.22. Checkout UX

- narxning aniq tarkibi;
- promo code;
- to‘lov provider holatlari;
- duplicate click himoyasi;
- pending payment sahifasi;
- muvaffaqiyatsiz to‘lovni retry;
- invoice/receipt;
- refund holatini ko‘rsatish.

### 3.23. Biznes modellari

Bosqichma-bosqich tekshirish:

1. alohida kurs sotib olish;
2. course bundle;
3. monthly subscription;
4. team/company licenses;
5. scholarship yoki installment.

Subscription’ni birdan qo‘shish tavsiya etilmaydi. Avval kontent hajmi va retention isbotlanishi kerak.

**KPI:** checkout conversion; payment success rate; refund rate; revenue per paying user.

---

## P2. Community va engagement

### 3.24. Forumni kursga bog‘lash

- har kurs uchun community maydoni;
- darsga bog‘langan discussion;
- accepted answer;
- mention;
- report va moderation;
- instructor badge;
- relevant thread tavsiyasi.

### 3.25. Gamification’ni ma’noli qilish

- XP faqat foydali harakatlar uchun;
- streak freeze yoki yumshoq recovery;
- skill badge;
- course milestone;
- private/public leaderboard tanlovi;
- badge’dan portfolio’da foydalanish.

Gamification o‘qishni bosmasligi kerak. Confetti va ball yig‘ishdan ko‘ra real skill progress ustun.

**KPI:** weekly participation; unanswered questions kamayishi; spam report rate.

---

## P3. Mobil va offline tajriba

### 3.26. Responsive audit

Tekshiriladigan o‘lchamlar:

- 320px;
- 375px;
- 430px;
- tablet portrait/landscape;
- 1366px laptop;
- katta desktop.

### 3.27. PWA va offline

- install promptni majburlamaslik;
- shell offline ishlashi;
- saqlangan notes va lesson outline;
- reconnect bo‘lganda progress sync;
- conflict resolution;
- media download faqat huquq va storage strategiyasi aniqlangandan keyin.

**KPI:** mobile completion rate; install-to-return rate; offline sync error rate.

---

## P3. Accessibility, SEO va performance

### 3.28. Accessibility

- WCAG 2.2 AA kontrast;
- barcha formalar uchun label va error association;
- keyboard-only oqimlar;
- visible focus;
- modal focus trap;
- reduced motion;
- video subtitr va transcript;
- screen-reader announcement.

### 3.29. SEO

- course schema;
- breadcrumb schema;
- instructor profile metadata;
- canonical URL;
- sitemap;
- robots;
- Open Graph image;
- blog internal linking;
- public certificate verification index policy.

### 3.30. Performance

Maqsadlar:

- LCP < 2.5s;
- INP < 200ms;
- CLS < 0.1;
- route-level code splitting;
- image dimensions va modern formats;
- lazy loading;
- video CDN va adaptive streaming;
- API caching;
- bundle analysis;
- 1MB logolar va ortiqcha assetlarni optimallashtirish.

---

## P3. Admin va operatsion boshqaruv

### 3.31. Admin dashboard

- new users;
- active learners;
- enrollment va revenue;
- payment failures;
- completion;
- instructor review queue;
- reported content;
- system health;
- audit log.

### 3.32. Content moderation

- forum/review report queue;
- suspend/ban;
- reason va internal note;
- appeal holati;
- action audit trail;
- role-based permissions.

### 3.33. Support vositalari

- user timeline;
- payment va enrollment holati;
- impersonation o‘rniga safe “view as user”;
- certificate qayta yaratish;
- notification resend;
- support action audit.

---

# 4. Analytics va event tracking

Quyidagi eventlar standartlashtirilishi kerak:

- `signup_started`, `signup_completed`;
- `onboarding_started`, `onboarding_completed`;
- `search_performed`, `search_result_clicked`;
- `course_viewed`, `enrollment_started`, `enrollment_completed`;
- `checkout_started`, `payment_succeeded`, `payment_failed`;
- `lesson_started`, `lesson_completed`;
- `video_progress_25`, `50`, `75`, `100`;
- `quiz_started`, `quiz_submitted`, `quiz_passed`;
- `assignment_started`, `assignment_submitted`, `feedback_viewed`, `assignment_resubmitted`;
- `certificate_issued`, `certificate_downloaded`;
- `notification_clicked`;
- `portfolio_project_published`.

Har event’da zarur bo‘lsa `user_id`, `course_id`, `lesson_id`, `source`, `device`, `timestamp` va anonymous/session ID bo‘lsin. Maxfiy ma’lumot event payload’iga yuborilmasin.

### Asosiy funnel

1. Landing page view;
2. account creation;
3. onboarding completion;
4. course detail view;
5. enrollment/payment;
6. first lesson start;
7. first lesson completion;
8. first assignment submission;
9. course completion;
10. certificate/portfolio publication.

---

# 5. Tavsiya etilgan delivery bosqichlari

## Sprint 0: audit va foundation

- kritik user journey testlari;
- error/loading/empty holatlar;
- analytics event naming;
- design token va komponent auditi;
- mobil va accessibility baseline;
- eski, takroriy brand assetlarni tozalash.

## Sprint 1: Student Dashboard MVP

- davom ettirish;
- active courses;
- deadline va feedback;
- progress;
- empty/loading/error holatlar;
- responsive UI;
- event tracking.

## Sprint 2: Onboarding va learning plan

- maqsadlar;
- qiziqishlar;
- haftalik reja;
- recommendation integration;
- reminder preferences.

## Sprint 3: Assignment va feedback

- draft submission;
- upload progress;
- rubric;
- instructor queue;
- resubmission;
- notifications.

## Sprint 4: Portfolio

- course project’dan portfolio;
- public profile;
- share metadata;
- certificate linkage.

## Sprint 5: Search va learning paths

- global search;
- filters;
- recent/popular search;
- curated paths;
- search analytics.

Keyingi sprintlar KPI natijasiga qarab calendar/reminder, LearnPage upgrades, instructor builder, monetizatsiya va PWA yo‘nalishlariga ajratiladi.

---

# 6. Definition of Done

Har bir feature faqat quyidagilar bajarilganda tayyor hisoblanadi:

- acceptance criteria bajarilgan;
- desktop va mobile dizayn tayyor;
- loading, empty, error va permission holatlari mavjud;
- keyboard va accessibility tekshirilgan;
- backend validation va authorization mavjud;
- unit/integration testlar yozilgan;
- analytics eventlar qo‘shilgan;
- error logging mavjud;
- dokumentatsiya yangilangan;
- CI yashil;
- production rollback rejasi mavjud.

---

# 7. Eng muhim KPIlar

## Acquisition

- landing → signup conversion;
- signup → onboarding completion;
- organic course page traffic.

## Activation

- signup → first lesson start;
- first lesson completion;
- birinchi 24 soatda foydali action.

## Engagement

- DAU/WAU;
- weekly learning minutes;
- lesson completion;
- assignment submission;
- forum participation.

## Retention

- D1, D7, D30 retention;
- course continuation rate;
- inactive’dan qaytish rate.

## Revenue

- checkout conversion;
- payment success;
- ARPPU;
- refund rate.

## Learning outcomes

- quiz pass rate;
- assignment quality improvement;
- course completion;
- certificate issuance;
- portfolio publication.

---

# 8. Qilmaslik kerak bo‘lgan ishlar

- faqat “zamonaviy ko‘rinadi” deb random feature qo‘shish;
- backend’da bor funksiyani foydalanuvchi oqimisiz UIga chiqarish;
- dashboard’ni bir xil kartalar bilan to‘ldirish;
- notification’larni default juda ko‘p yuborish;
- leaderboard’ni majburiy qilish;
- subscription’ni kontent va retention tayyor bo‘lmasdan ishga tushirish;
- accessibility va mobile’ni “keyin”ga qoldirish;
- analytics eventlarsiz feature chiqarish;
- test va rollback’siz payment o‘zgarishi qilish.

---

# 9. Yakuniy tavsiya

Designora’ning eng katta imkoniyati yangi endpointlar sonida emas. Backend allaqachon boy. Endi platforma **student natijasini boshqaradigan mahsulot** bo‘lishi kerak.

Shuning uchun bajarish tartibi:

1. ishonchlilik va kritik oqimlar;
2. Student Dashboard;
3. onboarding va shaxsiy reja;
4. assignment, feedback va portfolio;
5. search va learning paths;
6. calendar/reminders va LearnPage;
7. instructor operatsiyalari;
8. monetizatsiya, community va offline.

Birinchi real deliverable sifatida **Student Dashboard MVP** tavsiya qilinadi. U mavjud backend imkoniyatlarini birlashtiradi, foydalanuvchiga darhol qiymat beradi va keyingi barcha funksiyalar uchun markaziy nuqta bo‘ladi.
