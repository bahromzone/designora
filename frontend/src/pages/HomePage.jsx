import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import EngagementSection from "../components/EngagementSection";
import RecommendationSection from "../components/RecommendationSection";
import WaveAnimation from "../components/WaveAnimation";
import { discoveryApi } from "../lib/api";

const premiumEasing = [0.16, 1, 0.3, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: premiumEasing },
  },
};

const FIRST_COHORT_FACTS = [
  { value: "1-oqim", label: "Birinchi guruh" },
  { value: "30 ta joy", label: "Cheklangan qabul" },
  { value: "Portfolio", label: "4 loyiha bilan yakun" },
];

const HERO_COPY = [
  "Portfolio yarating.",
  "Ilhomingizga shakl bering.",
  "Har bir g‘oya ko‘rinishga loyiq.",
  "Natijani yarating.",
  "Kuchli loyiha sari yuring.",
  "Ijodingizga yangi makon oching.",
];

export default function HomePage() {
  const [copyIndex, setCopyIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCopyIndex((currentIndex) => (currentIndex + 1) % HERO_COPY.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="relative w-full bg-[var(--bg-light)]">
      <style>{`@keyframes stripe-float { 0%, 100% { transform: translate(0px, 0px) rotate(35deg); } 50% { transform: translate(45px, 40px) rotate(50deg); } } .animate-stripe { animation: stripe-float 20s ease-in-out infinite; }`}</style>

      <section className="relative flex min-h-[95vh] items-center justify-center overflow-hidden px-6 pt-36 sm:pt-40 md:pt-44">
        <div className="animate-stripe pointer-events-none absolute right-0 top-0 z-0 -mr-[30%] -mt-[25%] h-[120%] w-[120%] scale-110">
          <WaveAnimation />
        </div>
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute left-[-10%] top-[10%] z-0 h-[40rem] w-[40rem] rounded-full bg-pink-400/10 blur-[120px]"
        />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.h1
              variants={fadeUp}
              className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-7xl"
            >
              Dizaynni o'rganing. <br />
              <span
                className="inline-grid min-h-[2.2em] overflow-hidden pb-2 align-top text-violet-600"
                aria-live="polite"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copyIndex}
                    className="col-start-1 row-start-1 inline-block"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.45, ease: premiumEasing }}
                  >
                    {HERO_COPY[copyIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mx-auto mb-10 max-w-xl text-lg text-slate-600 md:text-xl lg:mx-0"
            >
              8 haftalik amaliy dastur, to'rtta portfolio loyihasi va har
              bosqichda mentor tekshiruvi. Birinchi oqim 30 ishtirokchi bilan
              boshlanadi.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link to="/?modal=signup">
                <motion.span
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 20px 40px -10px rgba(124,58,237,0.45)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative inline-block overflow-hidden rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-8 py-4 text-lg font-bold text-white"
                >
                  Birinchi oqimga qo'shilish
                </motion.span>
              </Link>
              <Link to="/kurslar">
                <motion.span
                  whileHover={{ scale: 1.03, backgroundColor: "#f8fafc" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="glass-panel inline-block rounded-full px-8 py-4 text-lg font-bold text-slate-900 transition-colors"
                >
                  Dasturlarni ko'rish
                </motion.span>
              </Link>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="mt-12 grid grid-cols-1 gap-0 border-y border-gray-200 text-left sm:grid-cols-3 sm:border-y-0 sm:border-t"
            >
              {FIRST_COHORT_FACTS.map((fact) => (
                <div
                  key={fact.value}
                  className="border-b border-gray-200 py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0"
                >
                  <p className="text-2xl font-bold text-slate-900">
                    {fact.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {fact.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-gray-200/60 bg-white/40 py-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1 }}
          className="mx-auto max-w-7xl px-6 text-center"
        >
          <p className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">
            Platformadagi yo'nalishlar
          </p>
          <div className="flex flex-wrap justify-center gap-10 font-serif text-2xl font-bold text-slate-800 opacity-40 grayscale md:gap-20 md:text-3xl">
            {[
              "UI/UX",
              "Moda dizayni",
              "Brending",
              "Styling",
              "Grafik dizayn",
            ].map((direction) => (
              <motion.span
                key={direction}
                whileHover={{ scale: 1.05, opacity: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {direction}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      <EngagementSection />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <RecommendationSection
          title="Birinchi oqim dasturlari"
          subtitle="Amaliy loyiha va mentor feedbackiga qurilgan yo'nalishlar"
          fetcher={() => discoveryApi.bestselling(6)}
          limit={3}
        />
      </section>
    </div>
  );
}
