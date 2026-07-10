const SECTIONS = [
  {
    title: "1. Umumiy shartlar",
    body: "Designora platformasidan foydalanish orqali siz ushbu foydalanish shartlariga rozilik bildirasiz. Shartlar vaqti-vaqti bilan yangilanishi mumkin.",
  },
  {
    title: "2. Hisob va foydalanuvchi",
    body: "Hisobingiz xavfsizligi uchun o'zingiz javobgarsiz. Bir hisobdan faqat uning egasi foydalanishi kerak. Parolingizni maxfiy saqlang.",
  },
  {
    title: "3. Kontent va intellektual mulk",
    body: "Platformadagi barcha kurslar, videolar va materiallar mualliflik huquqi bilan himoyalangan. Ularni ruxsatsiz nusxalash, tarqatish yoki qayta sotish taqiqlanadi.",
  },
  {
    title: "4. To'lov va qaytarish",
    body: "Pullik kurslar uchun to'lov shartlari xarid paytida ko'rsatiladi. Qaytarish siyosati har bir kurs uchun alohida belgilanadi.",
  },
  {
    title: "5. Xizmatni to'xtatish",
    body: "Ushbu shartlarni buzgan foydalanuvchilarning hisobi ogohlantirishsiz to'xtatilishi mumkin.",
  },
];

export default function TermsPage() {
  return (
    <section className="shell py-12 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <p className="label mb-3">Foydalanish shartlari</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink mb-4 leading-tight">
          Foydalanish shartlari
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--ink-60)" }}>
          Oxirgi yangilanish: 2026-yil
        </p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-serif text-xl font-semibold text-ink mb-2">
                {s.title}
              </h2>
              <p
                className="text-base leading-8"
                style={{ color: "var(--ink-60)" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
