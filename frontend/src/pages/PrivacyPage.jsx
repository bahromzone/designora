const UPDATED_AT = "2026-yil 25-avgust";

const SECTIONS = [
  {
    id: "qamrov",
    title: "1. Siyosatning maqsadi va qo‘llanish doirasi",
    paragraphs: [
      "Ushbu Maxfiylik siyosati Designora veb-sayti, mobilga mos interfeysi, kurslari, to‘lov, portfolio, forum, test, topshiriq, sertifikat va boshqa xizmatlaridan foydalanilganda shaxsga doir ma’lumotlar qanday yig‘ilishi, ishlatilishi, saqlanishi va himoya qilinishini tushuntiradi.",
      "Siyosat O‘zbekiston Respublikasining “Shaxsga doir ma’lumotlar to‘g‘risida”gi Qonuni (O‘RQ-547, keyingi o‘zgartirishlar bilan), elektron tijorat, iste’molchilar huquqlarini himoya qilish va axborot xavfsizligiga oid majburiy talablarga muvofiq talqin qilinadi.",
    ],
  },
  {
    id: "operator",
    title: "2. Ma’lumotlar operatori",
    paragraphs: [
      "Designora platformasi foydalanuvchi ma’lumotlarini qayta ishlash maqsadi va vositalarini belgilovchi operator hisoblanadi. Ushbu siyosatda “Designora”, “biz” yoki “bizning” deyilganda platforma operatori nazarda tutiladi.",
      "Maxfiylik bo‘yicha so‘rovlar platformadagi aloqa kanallari orqali yuboriladi. So‘rovda hisobga bog‘langan elektron pochta manzili va talabning mazmuni ko‘rsatilishi kerak; xavfsizlik uchun shaxsni tasdiqlash so‘ralishi mumkin.",
    ],
  },
  {
    id: "yigiladigan-malumotlar",
    title: "3. Biz yig‘adigan ma’lumotlar",
    paragraphs: [
      "Siz taqdim etadigan ma’lumotlar: ism, familiya, elektron pochta, telefon raqami, profil rasmi, bio, parolning xeshlangan ko‘rinishi, til va bildirishnoma sozlamalari, instruktor arizasi, portfolio materiallari, forum yozuvlari, sharhlar, savollar, topshiriqlar va bizga yuborgan murojaatlar.",
      "Ta’lim faoliyati ma’lumotlari: ro‘yxatdan olingan va saqlangan kurslar, ko‘rilgan darslar, video progressi, test javoblari va natijalari, urinishlar, topshiriqlar, instruktor fikri, sertifikatlar, qaydlar, kalendar va o‘quv faolligi.",
      "Tranzaksiya ma’lumotlari: buyurtma, summa, valyuta, kupon, to‘lov holati, provayder identifikatori, qaytarish yoki bekor qilish holati. To‘liq bank karta rekvizitlari Designora serverlarida saqlanmaydi; ular vakolatli to‘lov provayderi tomonidan qayta ishlanishi mumkin.",
      "Texnik ma’lumotlar: IP-manzil, qurilma va brauzer turi, operatsion tizim, til, vaqt zonasi, cookie va sessiya identifikatorlari, tashrif va xatolik jurnallari, xavfsizlik hodisalari hamda xizmatdan foydalanish statistikasi.",
    ],
  },
  {
    id: "manbalar",
    title: "4. Ma’lumotlar manbalari",
    paragraphs: [
      "Ma’lumotlarni bevosita sizdan, platformadagi faoliyatingizdan avtomatik ravishda, Google kabi siz tanlagan autentifikatsiya xizmatidan, instruktor yoki tashkilotdan, shuningdek Payme, Click va boshqa to‘lov yoki texnik xizmat ko‘rsatuvchilardan olishimiz mumkin.",
      "Uchinchi tomon orqali kirishda biz faqat siz ruxsat bergan va xizmatni ko‘rsatish uchun zarur bo‘lgan profil ma’lumotlarini olamiz. Uchinchi tomonning o‘z maxfiylik qoidalari uning xizmatiga tatbiq etiladi.",
    ],
  },
  {
    id: "maqsadlar",
    title: "5. Qayta ishlash maqsadlari va huquqiy asoslar",
    paragraphs: [
      "Ma’lumotlar hisob ochish va autentifikatsiya qilish, kursga kirish berish, progressni saqlash, test va topshiriqlarni baholash, sertifikat yaratish, to‘lovni bajarish, qo‘llab-quvvatlash, xavfsizlikni ta’minlash, firibgarlikni oldini olish va xizmatni yaxshilash uchun qayta ishlanadi.",
      "Huquqiy asoslar: siz bilan tuzilgan shartnomani bajarish; qonuniy majburiyatlarni ado etish; hisob, foydalanuvchilar va platformani himoya qilish bo‘yicha qonuniy manfaat; qonun talab qilgan hollarda esa sizning aniq roziligingiz.",
      "Marketing xabarlari faqat tegishli huquqiy asos mavjud bo‘lganda yuboriladi. Siz bunday xabarlardan istalgan vaqtda voz kechishingiz mumkin; xizmatga oid zarur bildirishnomalar bundan mustasno.",
    ],
  },
  {
    id: "cookie",
    title: "6. Cookie va o‘xshash texnologiyalar",
    paragraphs: [
      "Zarur cookie fayllari login sessiyasi, CSRF himoyasi, til va xavfsizlik sozlamalari uchun ishlatiladi. Ularni o‘chirish platformaning ayrim funksiyalarini ishlamasligiga olib kelishi mumkin.",
      "Analitik yoki funksional texnologiyalar xizmatdan foydalanishni o‘lchash va tajribani yaxshilash uchun qo‘llanishi mumkin. Brauzer sozlamalari orqali cookie fayllarini boshqarishingiz mumkin. Designora reklama maqsadida shaxsga doir ma’lumotlarni sotmaydi.",
    ],
  },
  {
    id: "ulashish",
    title: "7. Ma’lumotlarni kimlar bilan ulashamiz",
    paragraphs: [
      "Ma’lumotlar faqat zarur hajmda hosting, ma’lumotlar bazasi, elektron pochta, fayl va video saqlash, analitika, autentifikatsiya, to‘lov va xavfsizlik xizmatlarini ko‘rsatuvchi tekshirilgan hamkorlarga berilishi mumkin. Ular ma’lumotdan faqat bizning topshirig‘imiz va shartnoma doirasida foydalanishi shart.",
      "Instruktorlar o‘z kursidagi talabalar progressi, topshiriqlari va o‘quv aloqa ma’lumotlarini ta’limni tashkil etish uchun ko‘rishi mumkin. Ochiq profil, portfolio, forum posti yoki sharh siz tanlagan ko‘rinish doirasida boshqalarga ko‘rinadi.",
      "Qonuniy talab, sud hujjati, vakolatli davlat organi so‘rovi, shaxslar xavfsizligi yoki huquqlarni himoya qilish zarur bo‘lsa ma’lumot oshkor qilinishi mumkin. Biznes qayta tashkil etilganda ma’lumotlar tegishli maxfiylik va qonuniy himoya shartlari bilan huquqiy vorisga o‘tishi mumkin.",
    ],
  },
  {
    id: "transchegaraviy",
    title: "8. Saqlash joyi va transchegaraviy uzatish",
    paragraphs: [
      "Texnik provayderlar O‘zbekistondan tashqarida joylashgan bo‘lishi mumkin. Bunday uzatish qonunda nazarda tutilgan asos, maqsadga muvofiqlik va yetarli himoya choralari mavjud bo‘lgandagina amalga oshiriladi.",
      "O‘zbekiston hududida saqlanishi majburiy bo‘lgan biometrik, genetik yoki telekommunikatsiya foydalanuvchisi ma’lumotlari kabi maxsus toifalar qayta ishlansa, amaldagi lokalizatsiya talablari bajariladi. Designora odatiy ta’lim xizmati uchun genetik ma’lumot yig‘maydi.",
    ],
  },
  {
    id: "saqlash-muddati",
    title: "9. Saqlash muddati",
    paragraphs: [
      "Ma’lumotlar xizmatni ko‘rsatish, hisob yuritish, nizolarni hal qilish, xavfsizlik va qonuniy majburiyatlar uchun zarur bo‘lgan muddatgacha saqlanadi. Hisob o‘chirilgach, faol tizimlardagi ma’lumotlar oqilona texnik muddatda o‘chiriladi yoki shaxssizlantiriladi.",
      "Moliyaviy va audit yozuvlari qonunda belgilangan muddat davomida; zaxira nusxalari esa avtomatik aylanish muddati tugaguncha saqlanishi mumkin. Ommaviy forum yoki kurs muhokamasidagi kontent suhbat yaxlitligini saqlash uchun shaxssizlantirilgan holda qolishi mumkin.",
    ],
  },
  {
    id: "xavfsizlik",
    title: "10. Axborot xavfsizligi",
    paragraphs: [
      "Biz uzatishda shifrlash, parollarni xavfsiz xeshlash, httpOnly cookie sessiyalari, kirishni rollar bo‘yicha cheklash, audit jurnallari, rate-limit, zaxira nusxalari va muntazam test kabi tashkiliy hamda texnik choralarni qo‘llaymiz.",
      "Hech bir tizim mutlaq xavfsiz emas. Ma’lumotlar buzilishi aniqlansa, zarar ko‘lamini cheklaymiz, hodisani tekshiramiz va qonun talab qilgan hollarda vakolatli organlar hamda ta’sirlangan foydalanuvchilarni xabardor qilamiz.",
    ],
  },
  {
    id: "huquqlar",
    title: "11. Sizning huquqlaringiz",
    paragraphs: [
      "Amaldagi qonunchilik doirasida siz ma’lumotlaringiz qayta ishlanayotgani haqida axborot olish, ularga kirish, nusxa so‘rash, noto‘g‘ri ma’lumotni tuzatish, qayta ishlashni cheklash yoki e’tiroz bildirish, rozilikni qaytarib olish, qonuniy asos bo‘lmasa o‘chirishni talab qilish huquqiga egasiz.",
      "Hisob sozlamalarida ayrim ma’lumotlarni mustaqil yangilashingiz mumkin. Boshqa so‘rovlar shaxsni tekshirgandan so‘ng qonunda belgilangan muddatlarda ko‘rib chiqiladi. Qonuniy saqlash majburiyati, boshqa shaxslar huquqlari yoki xavfsizlik sabablari tufayli ayrim talablar cheklanishi mumkin; bunday holatda sabab tushuntiriladi.",
      "Huquqlaringiz buzilgan deb hisoblasangiz, avval Designora’ga murojaat qilishingiz, shuningdek vakolatli davlat organiga yoki sudga shikoyat qilishingiz mumkin.",
    ],
  },
  {
    id: "bolalar",
    title: "12. Voyaga yetmaganlar",
    paragraphs: [
      "O‘n olti yoshga to‘lmagan shaxslar platformadan ota-ona yoki qonuniy vakil roziligi va nazorati bilan foydalanishi kerak. Yoshga doir noto‘g‘ri ma’lumot aniqlansa, hisobni cheklash va qonuniy vakildan tasdiq so‘rashimiz mumkin.",
      "Bolaning ma’lumoti roziliksiz yuborilgan deb hisoblagan qonuniy vakil bizga murojaat qilishi mumkin; tekshiruvdan so‘ng ma’lumot o‘chiriladi yoki tegishli himoya choralari qo‘llanadi.",
    ],
  },
  {
    id: "avtomatlashtirish",
    title: "13. Tavsiyalar va avtomatlashtirilgan ishlov",
    paragraphs: [
      "Kurs tavsiyalari, progress eslatmalari va o‘quv tahlili faoliyat ma’lumotlari asosida avtomatik shakllanishi mumkin. Bunday funksiyalar siz uchun huquqiy yoki shunga teng darajada jiddiy oqibat tug‘diruvchi yagona avtomatlashtirilgan qaror sifatida ishlatilmaydi.",
    ],
  },
  {
    id: "ozgarishlar",
    title: "14. Siyosatdagi o‘zgarishlar va aloqa",
    paragraphs: [
      "Siyosat xizmat, texnologiya yoki qonunchilikdagi o‘zgarishlarga mos ravishda yangilanishi mumkin. Muhim o‘zgarishlar kuchga kirishidan oldin platforma, hisob bildirishnomasi yoki elektron pochta orqali xabar beriladi. Yuqoridagi sana amaldagi tahrirni bildiradi.",
      "Savol, shikoyat yoki ma’lumotlar subyekti so‘rovini Designora platformasidagi rasmiy aloqa kanali orqali yuboring. To‘lov rekvizitlari yoki parolni murojaat matniga kiritmang.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="shell py-12 sm:py-16">
      <article className="mx-auto max-w-4xl">
        <p className="label mb-3">Huquqiy hujjat</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Maxfiylik siyosati
        </h1>
        <p className="mt-4 text-sm" style={{ color: "var(--ink-60)" }}>
          Kuchga kirgan va oxirgi yangilangan sana: {UPDATED_AT}
        </p>
        <p className="mt-6 text-lg leading-8" style={{ color: "var(--ink-60)" }}>
          Ushbu hujjat ma’lumotlaringiz ustidan nazoratni tushunarli qilish uchun
          yozilgan. Iltimos, platformadan foydalanishdan oldin uni diqqat bilan
          o‘qing.
        </p>

        <nav aria-label="Maxfiylik siyosati bo‘limlari" className="my-10 rounded-2xl border border-black/10 bg-black/[0.025] p-6">
          <h2 className="mb-4 font-semibold text-ink">Mundarija</h2>
          <ol className="grid gap-2 text-sm sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a className="text-purple-700 underline-offset-4 hover:underline" href={`#${section.id}`}>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section id={section.id} key={section.id} className="scroll-mt-28" aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`} className="font-serif text-2xl font-semibold text-ink">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-8" style={{ color: "var(--ink-60)" }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}
