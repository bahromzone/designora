import { Link } from "react-router-dom";

const INTRO =
  "Designora — O'zbekistondagi dizaynerlar uchun premium onlayn ta'lim platformasi. Biz videodarslar bilan birga soha yetakchilaridan kinematik sifatdagi jonli masterklasslar, amaliy loyihalar va shaxsiy mentorlik taklif qilamiz.";

const MISSION =
  "Maqsadimiz — har bir o'quvchini moodboarddan tayyor mahsulotgacha bo'lgan yo'lda kuzatib borish va ularni haqiqiy bozorga tayyorlash. UI/UX, moda dizayni, brending va styling yo'nalishlarida amaliy bilim beramiz.";

export default function AboutPage() {
  return (
    <section className="shell py-12 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink mb-6 leading-tight">
          Designora — dizayn ta'limining yangi bosqichi
        </h1>
        <p
          className="text-lg leading-8 mb-6"
          style={{ color: "var(--ink-60)" }}
        >
          {INTRO}
        </p>
        <p
          className="text-base leading-8 mb-10"
          style={{ color: "var(--ink-60)" }}
        >
          {MISSION}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/kurslar" className="btn-dark py-3.5 px-7 justify-center">
            Kurslarni ko'rish
          </Link>
          <Link to="/blog" className="btn-outline py-3.5 px-7 justify-center">
            Blogni o'qish
          </Link>
        </div>
      </div>
    </section>
  );
}
