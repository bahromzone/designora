import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    tag: "01-QADAM",
    duration: "1-2 hafta",
    title: "Darsni ko'ring va mohiyatni tushuning",
    text: "Ortiqcha nazariyasiz, sohadagi eng kerakli instrumentlar, gridlar, tipografika va rang uyg'unligini qisqa videodarslar orqali o'rganasiz.",
    chips: ["🎥 4K Darslar", "📂 Tayyor Figma manbalar", "⚡ Tezkor start"],
    badge: "01 / Dars Platformasi",
  },
  {
    number: "02",
    tag: "02-QADAM",
    duration: "3-4 hafta",
    title: "Amalda bajaring: real Figma loyihalar",
    text: "Har modul oxirida berilgan brif asosida o'z mustaqil dizayningizni yaratasiz. Shunchaki nusxa ko'chirish emas, balki muammoni yechuvchi dizayn qurasiz.",
    chips: ["🛠 Real keyslar", "📐 Design Systems", "📱 Prototip"],
    badge: "02 / Figma Amaliyoti",
  },
  {
    number: "03",
    tag: "03-QADAM",
    duration: "5-6 hafta",
    title: "Mentordan individual feedback oling",
    text: "Topshirig'ingiz tajribali mentor tomonidan to'liq tekshiriladi, qayerda xato borligi va uni qanday yaxshilash mumkinligi video va audio tahlil orqali ko'rsatiladi.",
    chips: [
      "🎙 Video & Audio sharh",
      "🎯 1:1 yo'naltirish",
      "📈 Qayta topshirish",
    ],
    badge: "03 / Mentor Feedback",
  },
  {
    number: "04",
    tag: "04-QADAM",
    duration: "7-8 hafta",
    title: "Kuchli portfolio bilan kursni yakunlang",
    text: "Kurs yakunida qo'lingizda ish beruvchi va mijozlarga bemalol taqdim eta oladigan 4 ta to'liq keys (Behance / Dribbble / PDF) tayyor bo'ladi.",
    chips: [
      "💼 4 ta to'liq portfolio",
      "🏆 Rasmiy Sertifikat",
      "🤝 Ishga tavsiya",
    ],
    badge: "04 / Tayyor Portfolio",
  },
];

function InteractiveStudioPreview({ activeStep }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-[#090d16] p-5 text-white shadow-2xl shadow-sky-500/10 sm:p-6">
      {/* Window Top HUD */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>
        <span className="rounded-full border border-sky-400/40 bg-sky-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">
          {LEARNING_STEPS[activeStep].badge}
        </span>
      </div>

      {/* Screen Area */}
      <div className="relative mt-4 h-[340px] w-full overflow-hidden rounded-2xl bg-slate-900 sm:h-[370px]">
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: premiumEasing }}
              className="absolute inset-0 flex flex-col justify-between p-5"
            >
              <div
                className="absolute inset-0 bg-cover bg-center brightness-[0.65]"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80')",
                }}
              />
              <div className="relative z-10">
                <span className="rounded-md border border-white/20 bg-slate-950/70 px-3 py-1 text-xs font-bold text-white">
                  📺 1-Modul: Kompozitsiya va Grid
                </span>
              </div>
              <div className="relative z-10 my-auto flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-sky-600 shadow-2xl shadow-sky-500/50">
                  <svg
                    className="ml-1 h-7 w-7 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="relative z-10 rounded-xl border border-white/20 bg-slate-950/80 p-3.5 backdrop-blur-md">
                <div className="flex justify-between text-xs font-bold">
                  <span>Grid va vizual ritm qonunlari</span>
                  <span className="text-sky-400">14:20 / 22:00</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[65%] rounded-full bg-sky-400" />
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: premiumEasing }}
              className="absolute inset-0 flex flex-col justify-between bg-zinc-900 p-5"
            >
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
                <span>🎨 Figma Canvas — Mobile Banking</span>
                <span className="text-emerald-400">● Realtime Sync</span>
              </div>

              {/* Artboard Frame */}
              <div className="relative my-auto flex h-[210px] w-full flex-col justify-between rounded-xl bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-900">
                    Dashboard Screen
                  </span>
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                    Auto-Layout
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 p-3 text-white">
                    <p className="text-[10px] opacity-80">Balans</p>
                    <p className="text-sm font-black">$12,450.00</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold text-slate-500">
                      O'tkazmalar
                    </p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-sky-400" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Variants: Dark/Light Mode Active
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Components & Tokens</span>
                <span className="font-bold text-emerald-400">
                  ✓ Topshiriq tayyor
                </span>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: premiumEasing }}
              className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-slate-950 to-indigo-950 p-5"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Mentor"
                  className="h-11 w-11 rounded-full border-2 border-sky-400 object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-white">Aziza Karimova</p>
                  <p className="text-xs text-sky-300">
                    Lead Product Designer (Mentor)
                  </p>
                </div>
              </div>

              {/* Audio Waveform UI */}
              <div className="flex h-14 items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4">
                {[16, 28, 38, 20, 32, 14, 28, 40, 24, 16].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1 rounded-full bg-sky-400"
                  />
                ))}
                <span className="ml-3 text-xs font-bold text-white">
                  Audio sharh: 02:45
                </span>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 text-xs text-slate-200">
                <span className="font-bold text-amber-300">
                  Mentor xulosasi:
                </span>{" "}
                Tipografika ierarxiyasi a'lo! Paddinglarni biroz kengaytirsangiz
                portfolio uchun mukammal bo'ladi.
              </div>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: premiumEasing }}
              className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 p-5 text-center"
            >
              <div className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
                🏆 Rasmiy Bitiruvchi Sertifikati
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="flex h-24 items-end rounded-xl border border-white/20 bg-cover bg-center p-2.5"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80')",
                  }}
                >
                  <span className="rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white">
                    Fintech App Case
                  </span>
                </div>
                <div
                  className="flex h-24 items-end rounded-xl border border-white/20 bg-cover bg-center p-2.5"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80')",
                  }}
                >
                  <span className="rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white">
                    Brand Identity
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3 text-xs font-bold text-sky-300">
                4 ta to'liq Behance/Dribbble portfolio ishi tayyor!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer step indicators */}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-xs font-bold text-slate-400">
          Bosqich {activeStep + 1} / 4
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((idx) => (
            <span
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeStep === idx ? "w-6 bg-sky-400" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EngagementSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative w-full overflow-hidden bg-[#F8F9FB] py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-full max-w-[960px] -translate-x-1/2 rounded-full bg-sky-200/40 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Yuqori 1-oqim sarlavha qismi */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: premiumEasing }}
          className="grid gap-10 border-b border-slate-200 pb-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-600">
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

        {/* 4 ta statistik raqamlar */}
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

        {/* Noldan tayyor portfoliogacha: Hover va Interaktiv Step almashishi */}
        <div className="pt-20">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-600">
              O'quv Metodikasi
            </p>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Noldan tayyor portfoliogacha
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-500">
              Sichqonchani o'ng tarafdagi qadamlar ustiga olib boring yoki
              bosing: chap tarafdagi interfeys avtomatik mos ravishda almashadi
            </p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_1.15fr] lg:items-center">
            {/* Chap taraf: Dynamic Studio Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: premiumEasing }}
              className="lg:sticky lg:top-28"
            >
              <InteractiveStudioPreview activeStep={activeStep} />
            </motion.div>

            {/* O'ng taraf: Hover qilinganda chap tarafni yangilovchi qadamlar */}
            <div className="flex flex-col gap-4">
              {LEARNING_STEPS.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <motion.div
                    key={step.number}
                    onMouseEnter={() => setActiveStep(idx)}
                    onClick={() => setActiveStep(idx)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: idx * 0.08,
                      ease: premiumEasing,
                    }}
                    className={`cursor-pointer rounded-2xl border p-6 transition-all duration-300 ${
                      isActive
                        ? "border-sky-300 bg-white shadow-xl shadow-sky-500/10 scale-[1.01]"
                        : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-black ${
                          isActive
                            ? "bg-sky-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {step.tag}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {step.duration}
                      </span>
                    </div>

                    <h4 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                      {step.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {step.text}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {step.chips.map((chip) => (
                        <span
                          key={chip}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            isActive
                              ? "bg-sky-50 text-sky-700 border border-sky-100"
                              : "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}

              <div className="pt-2">
                <Link
                  to="/?modal=signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Birinchi oqimga qo'shilish
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
