const UPDATED_AT = "2026-yil 25-avgust";

const SECTIONS = [
  {
    id: "rozilik",
    title: "1. Shartlarni qabul qilish",
    paragraphs: [
      "Ushbu Foydalanish shartlari Designora veb-sayti, kurslari, ilovalari va tegishli xizmatlaridan foydalanishingizni tartibga soladi. Hisob yaratish, “Qabul qilaman” tugmasini bosish, kurs xarid qilish yoki xizmatdan foydalanish orqali siz ushbu Shartlar va Maxfiylik siyosatiga rozilik bildirasiz.",
      "Agar tashkilot nomidan foydalansangiz, uni ushbu Shartlar bilan bog‘lash vakolatiga ega ekaningizni tasdiqlaysiz. Shartlarga rozi bo‘lmasangiz, xizmatdan foydalanmang.",
    ],
  },
  {
    id: "xizmat",
    title: "2. Designora xizmati",
    paragraphs: [
      "Designora dizayn va unga yaqin yo‘nalishlarda onlayn kurslar, video darslar, testlar, topshiriqlar, instruktor fikri, forumlar, portfolio, o‘quv yo‘llari va sertifikat funksiyalarini taqdim etadi. Ayrim kontent Designora, instruktor yoki hamkor tomonidan yaratiladi.",
      "Kurs tavsifi, davomiyligi, narxi, tili, instruktor va mavjud funksiyalar kurs sahifasida ko‘rsatiladi. Designora ta’lim tajribasini yaxshilash uchun kontent va funksiyalarni oqilona o‘zgartirishi mumkin, biroq xarid qilingan xizmatning asosiy qiymatini asossiz kamaytirmaydi.",
    ],
  },
  {
    id: "yosh",
    title: "3. Kim foydalanishi mumkin",
    paragraphs: [
      "Siz qonun bo‘yicha shartnoma tuzish layoqatiga ega bo‘lishingiz kerak. O‘n olti yoshga to‘lmagan foydalanuvchi faqat ota-ona yoki qonuniy vakil roziligi va nazorati ostida foydalanishi mumkin; vakil voyaga yetmagan shaxsning faoliyati uchun javob beradi.",
      "Sanksiyalar, sud qarori yoki qonuniy taqiq sabab xizmatdan foydalanish huquqiga ega bo‘lmagan shaxs platformadan foydalana olmaydi.",
    ],
  },
  {
    id: "hisob",
    title: "4. Hisob va xavfsizlik",
    paragraphs: [
      "Ro‘yxatdan o‘tishda to‘g‘ri, to‘liq va dolzarb ma’lumot bering. Bir shaxs bitta shaxsiy hisobdan foydalanadi; hisobni sotish, ijaraga berish, ulashish yoki boshqa shaxs nomidan topshiriq bajarish taqiqlanadi.",
      "Parol va qurilma xavfsizligi, hisobdagi harakatlar hamda ruxsatsiz kirish haqida darhol xabar berish uchun siz javobgarsiz. Designora shubhali faoliyatda qo‘shimcha tekshiruv, sessiyalarni yopish yoki vaqtincha cheklash choralarini ko‘rishi mumkin.",
    ],
  },
  {
    id: "litsenziya",
    title: "5. Sizga beriladigan foydalanish huquqi",
    paragraphs: [
      "Shartlarga rioya qilishingiz sharti bilan Designora sizga xizmat va qonuniy olingan kurs kontentidan shaxsiy, cheklangan, bekor qilinishi mumkin bo‘lgan, boshqalarga o‘tkazilmaydigan va notijorat maqsaddagi foydalanish huquqini beradi.",
      "Ruxsat etilgan yuklab olish funksiyasi bo‘lmasa kontentni ko‘chirib olish, ekran yoki oqimni ommaviy yozib olish, qayta nashr qilish, sotish, litsenziyalash, tarqatish, tarjima qilib tijoratlashtirish yoki texnik himoyani chetlab o‘tish mumkin emas.",
    ],
  },
  {
    id: "halollik",
    title: "6. Akademik halollik",
    paragraphs: [
      "Test, imtihon, topshiriq va portfolio ishlarini, hamkorlikka aniq ruxsat berilmagan bo‘lsa, mustaqil bajaring. Tayyor javobni ulashish yoki sotish, boshqa shaxs o‘rniga topshirish, plagiat, baholash tizimini aldash va sertifikat ma’lumotini soxtalashtirish taqiqlanadi.",
      "Sun’iy intellekt vositalaridan faqat kurs yoki instruktor ruxsat bergan doirada foydalaning va talab qilinsa foydalanishni oshkor qiling. Buzilish natijani bekor qilish, qayta topshirish, sertifikatni bekor qilish yoki hisobni cheklashga olib kelishi mumkin.",
    ],
  },
  {
    id: "maqbul-foydalanish",
    title: "7. Maqbul foydalanish qoidalari",
    paragraphs: [
      "Noqonuniy, tahdidli, haqoratli, kamsituvchi, pornografik, firibgar yoki boshqalarning huquqlarini buzuvchi material joylamang. Zararli kod, spam, fishing, ruxsatsiz reklama, shaxsga doir ma’lumotlarni noqonuniy yig‘ish, hisoblarni buzish va platforma yuklamasini sun’iy oshirish taqiqlanadi.",
      "Xizmatni reverse engineering qilish, zaiflikdan foydalanish, rate-limit yoki kirish nazoratini chetlab o‘tish, avtomatik scraping yoki botlardan yozma ruxsatsiz foydalanish mumkin emas. Xavfsizlik zaifligini topsangiz, uni ommaga tarqatishdan oldin Designora’ga mas’uliyat bilan xabar bering.",
    ],
  },
  {
    id: "foydalanuvchi-kontenti",
    title: "8. Siz joylagan kontent",
    paragraphs: [
      "Siz o‘z postingiz, sharhingiz, savolingiz, topshirig‘ingiz, portfolio va boshqa materiallaringizga egalikni saqlaysiz hamda ularni joylash uchun barcha huquqlarga ega ekaningizni tasdiqlaysiz.",
      "Xizmatni ishlatish uchun Designora’ga kontentingizni saqlash, qayta ishlash, formatlash, namoyish qilish va siz tanlagan auditoriyaga yetkazish bo‘yicha butun dunyoda amal qiluvchi, bepul va noeksklyuziv litsenziya berasiz. Bu litsenziya xizmatni ko‘rsatish va zaxira nusxalarini boshqarish uchun zarur doira bilan cheklanadi; kontent o‘chirilgach oqilona texnik muddatda tugaydi.",
      "Ommaviy joylangan kontentni boshqa foydalanuvchilar ko‘rishi mumkin. Maxfiy, bank yoki boshqa shaxsning ruxsatsiz ma’lumotini joylamang.",
    ],
  },
  {
    id: "instruktorlar",
    title: "9. Instruktorlar va hamkorlar",
    paragraphs: [
      "Instruktorlar taqdim etgan kontentning haqqoniyligi, qonuniyligi va uchinchi tomon huquqlarini buzmasligi uchun javob beradi. Instruktor maqomi alohida kelishuv, tekshiruv va platforma qoidalariga bo‘ysunishi mumkin.",
      "Instruktorning fikri ta’limiy tavsiya bo‘lib, Designora nomidan yuridik, moliyaviy yoki boshqa professional kafolat hisoblanmaydi. Hamkor kurslarida qo‘shimcha talablar ko‘rsatilishi mumkin; ziddiyat bo‘lsa, muayyan xizmat uchun aniq berilgan maxsus shart ustun turadi.",
    ],
  },
  {
    id: "intellektual-mulk",
    title: "10. Intellektual mulk",
    paragraphs: [
      "Designora nomi, logotipi, platforma kodi, dizayn tizimi, ma’lumotlar bazasi, original kurslar va materiallar Designora yoki tegishli huquq egasiga tegishli hamda mualliflik huquqi, tovar belgisi va boshqa qonunlar bilan himoyalangan.",
      "Huquqingiz buzilgan deb hisoblasangiz, asar yoki belgi, buzuvchi material manzili, huquqni tasdiqlovchi ma’lumot va aloqa ma’lumotlaringiz bilan rasmiy murojaat yuboring. Asosli murojaatda kontent cheklanadi yoki olib tashlanadi; bila turib yolg‘on da’vo yuborish uchun da’vogar javobgar bo‘lishi mumkin.",
    ],
  },
  {
    id: "tolov",
    title: "11. Narxlar, to‘lovlar va soliqlar",
    paragraphs: [
      "Amaldagi narx, valyuta, chegirma va xizmat tarkibi checkout sahifasida to‘lovni tasdiqlashdan oldin ko‘rsatiladi. Siz tanlangan to‘lov usuli orqali ko‘rsatilgan summani to‘lashga rozilik berasiz. To‘lov Payme, Click yoki boshqa vakolatli provayder orqali qayta ishlanishi mumkin.",
      "Qonunda boshqacha talab bo‘lmasa narxga kiritilgan soliqlar checkoutda ko‘rsatiladi. Kupon va aksiyalar muddati, auditoriyasi, bir hisobga qo‘llanishi va boshqa cheklovlarga ega bo‘lishi mumkin. To‘lovni asossiz qaytarib olish yoki chargeback orqali suiiste’mol qilish kursga kirishni to‘xtatishi mumkin.",
    ],
  },
  {
    id: "qaytarish",
    title: "12. Bekor qilish va pulni qaytarish",
    paragraphs: [
      "Pulni qaytarish huquqi checkoutda ko‘rsatilgan taklif shartlari va O‘zbekiston Respublikasining iste’molchilar huquqlarini himoya qilishga oid majburiy normalari asosida belgilanadi. Maxsus shart ko‘rsatilmagan bo‘lsa, so‘rov xarid sanasi, kontentdan foydalanish darajasi, sertifikat olingani va xizmatdagi nuqsonlar hisobga olinib ko‘rib chiqiladi.",
      "Qonunda kafolatlangan huquqlarni ushbu Shartlar cheklamaydi. Noto‘g‘ri yechib olingan summa, takroriy to‘lov yoki xizmatning jiddiy texnik nuqsoni bo‘yicha buyurtma identifikatori bilan murojaat qiling. Tasdiqlangan qaytarish odatda asl to‘lov usuliga provayderning ishlov muddatida yuboriladi.",
    ],
  },
  {
    id: "sertifikat",
    title: "13. Sertifikat va ta’lim natijalari",
    paragraphs: [
      "Sertifikat faqat belgilangan progress, test va boshqa talablar bajarilganda beriladi. U kursni tamomlaganingizni tasdiqlaydi, biroq davlat diplomi, akademik daraja, litsenziya, ishga joylashish yoki muayyan daromad kafolati emas, agar kurs sahifasida vakolatli organ tomonidan boshqacha aniq ko‘rsatilmagan bo‘lsa.",
      "Akademik halollik buzilishi, xato yoki firibgarlik aniqlansa sertifikat tekshiruvga olinishi yoki bekor qilinishi mumkin.",
    ],
  },
  {
    id: "uchinchi-tomon",
    title: "14. Uchinchi tomon xizmatlari",
    paragraphs: [
      "Platformada uchinchi tomon sayt, to‘lov, video, autentifikatsiya yoki ijtimoiy tarmoq xizmatlariga havolalar bo‘lishi mumkin. Ularning kontenti, mavjudligi va amaliyoti Designora nazoratida emas; ulardan foydalanish o‘sha tomonning shartlari va maxfiylik siyosatiga bo‘ysunadi.",
    ],
  },
  {
    id: "mavjudlik",
    title: "15. Xizmat mavjudligi va yangilanishlar",
    paragraphs: [
      "Biz barqaror xizmat ko‘rsatishga intilamiz, ammo texnik xizmat, xavfsizlik hodisasi, internet, provayder yoki fors-major sabab uzilish bo‘lishi mumkin. Rejali muhim ishlar haqida imkon qadar oldindan xabar beriladi.",
      "Xavfsizlik, qonuniy talab yoki mahsulot rivoji uchun dasturiy yangilanishlar avtomatik qo‘llanishi mumkin. Ayrim eski qurilma yoki brauzerlar keyinchalik qo‘llab-quvvatlanmasligi mumkin.",
    ],
  },
  {
    id: "tugatish",
    title: "16. Hisobni cheklash va tugatish",
    paragraphs: [
      "Siz hisobni sozlamalar orqali yoki rasmiy murojaat bilan yopishingiz mumkin. Designora Shartlar jiddiy yoki takroran buzilganda, xavfsizlikka tahdid, firibgarlik, qonuniy talab yoki to‘lov suiiste’moli bo‘lganda kontentni olib tashlashi, funksiyani cheklashi yoki hisobni vaqtincha yoxud doimiy yopishi mumkin.",
      "Holat imkon bersa, sabab va e’tiroz bildirish yo‘li haqida xabar beriladi. Tugatilgandan keyin ham intellektual mulk, javobgarlik, nizolar va tabiatiga ko‘ra davom etishi kerak bo‘lgan qoidalar amal qiladi.",
    ],
  },
  {
    id: "kafolat",
    title: "17. Kafolatlar va javobgarlik chegarasi",
    paragraphs: [
      "Xizmat amaldagi qonun ruxsat bergan darajada “mavjud holicha” taqdim etiladi. Biz muayyan kasbiy natija, uzluksiz ishlash yoki barcha kontent mutlaq xatosiz bo‘lishini va’da qilmaymiz, lekin xizmatni oqilona malaka va ehtiyotkorlik bilan ko‘rsatamiz.",
      "Qonun bilan cheklash mumkin bo‘lmagan iste’molchi huquqlari, qasddan zarar, firibgarlik yoki hayot va sog‘liqqa zarar uchun javobgarlik cheklanmaydi. Boshqa hollarda Designora oldindan oqilona kutilmaydigan bilvosita zarar, boy berilgan foyda yoki foydalanuvchining Shartlarni buzishidan kelgan zarar uchun qonun ruxsat bergan doirada javobgar emas.",
    ],
  },
  {
    id: "nizolar",
    title: "18. Qo‘llaniladigan huquq va nizolar",
    paragraphs: [
      "Ushbu Shartlarga O‘zbekiston Respublikasi qonunchiligi qo‘llaniladi. Nizo yuzaga kelsa, tomonlar avval yozma murojaat va muzokara orqali hal qilishga harakat qiladi.",
      "Kelishuvga erishilmasa, nizo O‘zbekiston Respublikasining vakolatli sudida qonunda belgilangan tartibda ko‘riladi. Iste’molchining o‘z yashash joyi bo‘yicha murojaat qilish yoki vakolatli organga shikoyat qilish kabi majburiy huquqlari saqlanadi.",
    ],
  },
  {
    id: "yakuniy",
    title: "19. O‘zgarishlar, ajraluvchanlik va aloqa",
    paragraphs: [
      "Shartlar qonunchilik, xizmat yoki xavfsizlikdagi o‘zgarishlar sabab yangilanishi mumkin. Muhim o‘zgarishlar kuchga kirishidan oldin platforma yoki hisob aloqa kanali orqali xabar qilinadi. O‘zgarishdan keyingi foydalanish yangi tahrirga rozilikni bildiradi, qonun alohida rozilikni talab qilgan holatlar bundan mustasno.",
      "Bir qoida haqiqiy emas deb topilsa, qolgan qoidalar amal qilishda davom etadi. Designora bir huquqni darhol qo‘llamasa, bu undan voz kechilganini anglatmaydi. Siz Designora roziligisiz Shartlar bo‘yicha huquq va majburiyatni boshqa shaxsga o‘tkaza olmaysiz.",
      "Savol, shikoyat, pulni qaytarish yoki huquqiy murojaatni Designora platformasidagi rasmiy aloqa kanali orqali yuboring. Murojaatda hisob elektron pochtasi va tegishli buyurtma yoki kurs ma’lumotini ko‘rsating, lekin parol yoki to‘liq karta ma’lumotini yubormang.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="shell py-12 sm:py-16">
      <article className="mx-auto max-w-4xl">
        <p className="label mb-3">Huquqiy hujjat</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Foydalanish shartlari
        </h1>
        <p className="mt-4 text-sm" style={{ color: "var(--ink-60)" }}>
          Kuchga kirgan va oxirgi yangilangan sana: {UPDATED_AT}
        </p>
        <p className="mt-6 text-lg leading-8" style={{ color: "var(--ink-60)" }}>
          Ushbu Shartlar siz va Designora o‘rtasidagi xizmatdan foydalanish
          qoidalarini belgilaydi. Xarid yoki ro‘yxatdan o‘tishdan oldin ularni
          diqqat bilan o‘qing.
        </p>

        <nav aria-label="Foydalanish shartlari bo‘limlari" className="my-10 rounded-2xl border border-black/10 bg-black/[0.025] p-6">
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
