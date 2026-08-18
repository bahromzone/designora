import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const premiumEasing = [0.16, 1, 0.3, 1];

const COHORT_DETAILS = [
  {
    value: "1-oqim",
    label: "Designora bilan birinchi bo'lib boshlang",
  },
  {
    value: "30 ta joy",
    label: "Mentor e'tibori uchun ataylab cheklangan",
  },
  {
    value: "8 hafta",
    label: "Nazariya emas, izchil amaliy dastur",
  },
  {
    value: "4 loyiha",
    label: "Portfolio uchun yakunlangan real ishlar",
  },
];

const LEARNING_STEPS = [
  {
    number: "01",
    title: "Darsni ko'ring",
    text: "Qisqa va aniq videodars bilan mavzuning asosini tushuning.",
  },
  {
    number: "02",
    title: "Amalda bajaring",
    text: "Har modulni portfolio uchun ishlatiladigan loyiha bilan mustahkamlang.",
  },
  {
    number: "03",
    title: "Mentordan fikr oling",
    text: "Ishingizni topshiring, aniq feedback oling va yaxshilab qayta yuboring.",
  },
  {
    number: "04",
    title: "Portfolio bilan yakunlang",
    text: "Kurs oxirida ko'rsatishga tayyor to'rtta loyiha siz bilan qoladi.",
  },
];

function LessonPreview() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-indigo-500/10 sm:p-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
            Dars interfeysi
          </p>
          <h3 className="mt-2 text-xl font-bold">Brand identika asoslari</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
          2-modul
        </span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-[1.45fr_0.75fr]">
        <div>
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700">
            <div className="flex h-14 w-14 translate-x-0.5 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg">
              <svg
                aria-hidden="true"
                className="ml-1 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-white/60">
            <span>Logotipdan vizual tizimgacha</span>
            <span>18 daqiqa</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.07] p-4">
          <p className="text-sm font-bold">Modul rejasi</p>
          <ol className="mt-4 space-y-3 text-sm text-white/65">
            <li className="flex gap-3">
              <span className="font-bold text-violet-300">01</span>
              Brend strategiyasi
            </li>
            <li className="flex gap-3 text-white">
              <span className="font-bold text-violet-300">02</span>
              Vizual identika
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-violet-300">03</span>
              Brand guide
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-violet-300">04</span>
              Portfolio taqdimoti
            </li>
          </ol>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.07] px-4 py-3">
        <div>
          <p className="text-xs text-white/50">Keyingi amaliy vazifa</p>
          <p className="mt-1 text-sm font-semibold">Shaxsiy brand moodboardi</p>
        </div>
        <span className="rounded-full bg-violet-400 px-4 py-2 text-xs font-bold text-slate-950">
          Mentor tekshiradi
        </span>
      </div>
    </div>
  );
}

export default function EngagementSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#F8F9FB] py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-full max-w-[960px] -translate-x-1/2 rounded-full bg-violet-200/30 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: premiumEasing }}
          className="grid gap-10 border-b border-slate-200 pb-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">
              Birinchi oqim ochildi
            </p>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Natijani hali va'da qilmaymiz. Jarayonni kuchli quramiz.
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-8 text-slate-600 lg:justify-self-end">
            Designora endi ishga tushmoqda. Shuning uchun soxta reytinglar emas,
            nimani va qanday o'rganishingizni ochiq ko'rsatamiz.
          </p>
        </motion.div>

        <div className="grid border-b border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {COHORT_DETAILS.map((detail, index) => (
            <motion.div
              key={detail.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.55,
                delay: index * 0.08,
                ease: premiumEasing,
              }}
              className="border-slate-200 py-8 sm:px-7 sm:[&:nth-child(odd)]:border-r lg:border-r lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <p className="text-3xl font-extrabold tracking-tight text-slate-950">
                {detail.value}
              </p>
              <p className="mt-2 max-w-[15rem] text-sm leading-6 text-slate-500">
                {detail.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-12 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: premiumEasing }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">
              O'quv jarayoni
            </p>
            <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Har dars portfolioga olib boradi
            </h3>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {LEARNING_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="grid grid-cols-[2.5rem_1fr] gap-4 py-5"
                >
                  <span className="pt-1 text-xs font-bold tracking-widest text-violet-600">
                    {step.number}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-950">{step.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/?modal=signup"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
            >
              Birinchi oqimga qo'shilish
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: premiumEasing }}
          >
            <LessonPreview />
          </motion.div>
        </div>

        <div className="flex flex-col gap-5 rounded-[2rem] bg-violet-100 px-7 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
              Shaffof va halol start
            </p>
            <p className="mt-2 max-w-2xl text-lg font-semibold leading-7 text-slate-950">
              Birinchi bitiruvchilar chiqqach, aynan ularning tasdiqlangan
              ishlari va fikrlarini shu yerda ko'rsatamiz.
            </p>
          </div>
          <Link
            to="/kurslar"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-violet-300 bg-white px-6 py-3 text-sm font-bold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5"
          >
            Dasturlarni ko'rish
          </Link>
        </div>
      </div>
    </section>
  );
}
