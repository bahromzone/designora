# 🚀 Designora — FBosqich 7: Coursera darajasiga chiqish

> FBosqich 0–6 yakunlandi (dizayn tizimi, kashfiyot, o'quv tajribasi, to'lov,
> community, dashboardlar, refresh-token + performance + a11y + PWA + i18n +
> onboarding). Bu hujjat platformani "kurs sotadigan sayt"dan haqiqiy LMS'ga
> ko'taradigan keyingi ishlarni ta'sir bo'yicha tartiblaydi.

---

## ⭐ Muhim: backend tayyor, frontend yo'q

Quyidagilar backend'da tayyor, lekin UI'da ulanmagan — eng arzon qiymat:

- **Assignments** (`/api/assignments`): topshiriq yaratish, javob yuborish,
  baholash, ball berish. To'liq ishlaydi, faqat UI kerak.
- **i18n katalog** (`i18n_service`): backend katalogi bor; frontend hozircha
  o'z katalogidan foydalanadi. Keyin backendga ulash mumkin.

---

## 1-qatlam — O'quv yadrosi (eng katta ta'sir)

- [ ] **Baholanadigan topshiriqlar UI** — `/api/assignments` ga ulash:
  - Talaba: topshiriqni ko'rish, javob (matn/fayl) yuborish, baho + izohni ko'rish
  - Instruktor: topshiriq yaratish, javoblarni ko'rish, baholash
- [ ] **Peer-review** — talabalar bir-birini baholashi (backend ham kerak)
- [ ] **O'quv yo'llari / Specialization** — bir nechta kurs → yagona dastur +
      sertifikat yo'li (hozir faqat yakka kurslar)
- [ ] **Video tajribasi** — subtitr/transkript (qidiriladigan), tezlik nazorati,
      "qolgan joydan davom", video ichi interaktiv savollar

## 2-qatlam — Ishonch va sifat

- [ ] **Imtihon yaxlitligi** — vaqtli imtihon, savollar banki + randomizatsiya,
      urinishlar chegarasi, (ilg'or) proctoring
- [ ] **Forum moderatsiyasi** — report/flag, spam filtri, ban
- [ ] **Observability** — Sentry (xato kuzatuv), structured logging, uptime

## 3-qatlam — Monetizatsiya va o'sish

- [ ] **Obuna** (Coursera Plus kabi) + moliyaviy yordam + refund oqimi
      (hozir faqat bir martalik Payme/Click)
- [ ] **Kuchli qidiruv** — skill taksonomiyasi, typeahead, semantik/ML tavsiyalar
- [ ] **Email lifecycle** — deadline eslatma, re-engagement, haftalik digest
- [ ] **SEO** — kurs uchun structured data (schema.org Course), sitemap, OG teglar

## 4-qatlam — Korxona

- [ ] **B2B / jamoalar / SSO (SAML)** — seat litsenziya, org dashboard, hisobot
- [ ] **Kohorta / sessiyali kurslar** — deadline bilan (hozir hammasi self-paced)

---

## 🎯 Tavsiya etilgan tartib

1. **Assignments UI** — backend tayyor, tez g'alaba
2. **O'quv yo'llari** — platformaga struktura beradi
3. **Video tajribasi** — kundalik tajribani ko'taradi

> Shu uchtadan keyin Designora haqiqiy LMS bo'ladi.
