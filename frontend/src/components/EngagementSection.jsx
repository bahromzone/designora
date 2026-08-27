import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const steps = [
  {
    step: "01-QADAM",
    duration: "1-2 hafta",
    title: "Darsni ko'ring va mohiyatni tushuning",
    desc: "Ortiqcha nazariyasiz, sohadagi eng kerakli instrumentlar, gridlar, tipografika va rang uyg'unligini qisqa videodarslar orqali o'rganasiz.",
    tags: ["4K Darslar", "Tayyor Figma manbalar", "Tezkor start"],
    badge: "01 / DARS PLATFORMASI",
    previewTitle: "1-Modul: Kompozitsiya va Grid",
    previewDesc:
      "Sohadagi eng kerakli instrumentlar va qisqa video qo'llanmalar",
    media:
      "https://images.unsplash.com/photo-1581291518655-9523c932deda?auto=format&fit=crop&w=1200&q=80",
  },
  {
    step: "02-QADAM",
    duration: "3-4 hafta",
    title: "Amalda bajaring: real Figma loyihalar",
    desc: "Har modul oxirida berilgan brif asosida o'z mustaqil dizayningizni yaratasiz. Shunchaki nusxa ko'chirish emas, balki muammoni yechuvchi dizayn qurasiz.",
    tags: ["Real keyslar", "Design Systems", "Prototip"],
    badge: "02 / FIGMA WORKSPACE",
    previewTitle: "2-Modul: Dizayn Tizimlari & Prototip",
    previewDesc: "Shunchaki nusxa ko'chirish emas, amaliy loyiha qurish",
    media:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    step: "03-QADAM",
    duration: "5-6 hafta",
    title: "Mentordan individual feedback oling",
    desc: "Topshirig'ingiz tajribali mentor tomonidan to'liq tekshiriladi, qayerda xato borligi va uni qanday yaxshilash mumkinligi video va audio tahlil orqali ko'rsatiladi.",
    tags: ["Video & Audio sharh", "1:1 yo'naltirish", "Qayta topshirish"],
    badge: "03 / MENTOR FEEDBACK",
    previewTitle: "3-Modul: Mentor Tahlili & Audio Sharh",
    previewDesc: "Tajribali mentor xatolarni ko'rsatib 1:1 yo'naltiradi",
    media:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    step: "04-QADAM",
    duration: "7-8 hafta",
    title: "Kuchli portfolio bilan kursni yakunlang",
    desc: "Kurs yakunida qo'lingizda ish beruvchi va mijozlarga bemalol taqdim eta oladigan 4 ta to'liq keys (Behance / Dribbble / PDF) tayyor bo'ladi.",
    tags: ["4 ta to'liq portfolio", "Rasmiy Sertifikat", "Ishga tavsiya"],
    badge: "04 / PORTFOLIO SHOWCASE",
    previewTitle: "4-Modul: Behance & Dribbble Portfolio",
    previewDesc: "Mijozlarga taqdim etiladigan professional keyslar",
    media:
      "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function EngagementSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState([0]);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-step-index"));
            setVisibleSteps((prev) =>
              prev.includes(index) ? prev : [...prev, index]
            );
            setActiveStep(index);
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: "-15% 0px -25% 0px",
      }
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const activeData = steps[activeStep] || steps[0];

  return (
    <section className="bg-white py-16 text-slate-900 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Bosqichma-bosqich o'rganish
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Noldan tayyor portfoliogacha
          </h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Har bir bosqich sizni mustaqil portfolio va real ish tajribasiga
            yetaklaydi.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950 p-3 shadow-2xl transition-all duration-300">
              <div className="mb-3 flex items-center justify-between border-b border-slate-800 px-3 pb-3">
                <div className="flex space-x-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                  {activeData.badge}
                </span>
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="relative h-full w-full"
                >
                  <img
                    src={activeData.media}
                    alt={activeData.previewTitle}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <span className="inline-block rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                      {activeData.step}
                    </span>
                    <h4 className="mt-2 text-lg font-bold">
                      {activeData.previewTitle}
                    </h4>
                    <p className="mt-1 text-xs text-slate-300">
                      {activeData.previewDesc}
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800 px-3 pt-3 text-xs text-slate-400">
                <span>Bosqich {activeStep + 1} / 4</span>
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeStep
                          ? "w-6 bg-blue-500"
                          : "w-2 bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-7 lg:gap-8">
            {steps.map((item, index) => {
              const isVisible = visibleSteps.includes(index);
              const isActive = activeStep === index;

              return (
                <div
                  key={item.step}
                  ref={(el) => (stepRefs.current[index] = el)}
                  data-step-index={index}
                  onMouseEnter={() => setActiveStep(index)}
                  onClick={() => setActiveStep(index)}
                  className={`cursor-pointer rounded-2xl border p-6 transition-all duration-500 sm:p-8 ${
                    isActive
                      ? "border-blue-500 bg-white shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  } ${
                    isVisible
                      ? "translate-y-0 opacity-100 blur-0"
                      : "translate-y-2 opacity-35 blur-[1.5px]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.step}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {item.duration}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-blue-200 bg-blue-50/50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
