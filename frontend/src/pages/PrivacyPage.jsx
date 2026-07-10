const SECTIONS = [
  {
    title: "1. Qanday ma'lumot yig'amiz",
    body: "Ro'yxatdan o'tishda ismingiz va elektron pochtangizni, kurslardan foydalanish jarayonida esa o'quv faoliyatingiz (ko'rilgan darslar, test natijalari, progress) haqidagi ma'lumotlarni yig'amiz.",
  },
  {
    title: "2. Ma'lumotdan qanday foydalanamiz",
    body: "Ma'lumotlaringiz faqat xizmatni taqdim etish, o'quv tajribangizni shaxsiylashtirish va platformani yaxshilash uchun ishlatiladi. Biz ularni uchinchi tomonlarga sotmaymiz.",
  },
  {
    title: "3. Ma'lumot xavfsizligi",
    body: "Parollaringiz shifrlangan holda saqlanadi va barcha ma'lumotlar himoyalangan kanallar orqali uzatiladi. Sessiyalar xavfsiz cookie va JWT tokenlar orqali boshqariladi.",
  },
  {
    title: "4. Sizning huquqlaringiz",
    body: "Istalgan vaqtda hisobingizni o'chirishingiz yoki ma'lumotlaringizni yangilashingiz mumkin. Savollar bo'lsa, biz bilan bog'laning.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="shell py-12 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <p className="label mb-3">Maxfiylik siyosati</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink mb-4 leading-tight">
          Maxfiylik siyosati
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
