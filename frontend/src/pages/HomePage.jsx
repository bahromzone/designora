import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import EngagementSection from "../components/EngagementSection";
import RecommendationSection from "../components/RecommendationSection";
import VideoShowcase from "../components/VideoShowcase";
import { discoveryApi } from "../lib/api";

const premiumEasing = [0.16, 1, 0.3, 1];

const directions = [
  { label: "UI/UX", query: "ui ux" },
  { label: "Moda dizayni", query: "moda" },
  { label: "Brending", query: "brending" },
  { label: "Styling", query: "styling" },
  { label: "Grafik dizayn", query: "grafik dizayn" },
];

export default function HomePage() {
  return (
    <div className="home-reference-shell relative w-full bg-[oklch(98%_0.008_245)]">
      {/* Katta Hero banner (public/hero-banner.png) */}
      <section
        data-home-section="hero"
        aria-labelledby="home-hero-title"
        className="relative mx-auto min-h-[720px] w-full max-w-[1440px] overflow-hidden rounded-[28px] bg-sky-300 pt-24 sm:min-h-[780px] sm:pt-28 lg:min-h-[860px]"
      >
        <img
          data-testid="home-hero-image"
          src="/hero-banner.png"
          alt="Dizayn vositalari bilan ishlayotgan Designora talabalari"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Nafis va tabiiy gradient mask: matn orqasini nozik qorong'ilatib, pastki qahramonlarni toza ko'rsatadi */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/25 to-slate-950/15" />

        <motion.div
          data-testid="home-hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: premiumEasing }}
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-72 pt-10 text-center sm:px-8 sm:pb-80 sm:pt-14 lg:pb-96 lg:pt-16"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <span className="flex -space-x-1.5" aria-hidden="true">
              <span className="h-5 w-5 rounded-full border-2 border-white bg-amber-300" />
              <span className="h-5 w-5 rounded-full border-2 border-white bg-violet-300" />
              <span className="h-5 w-5 rounded-full border-2 border-white bg-emerald-300" />
            </span>
            1 000+ ijodkor Designora bilan o'rganmoqda
          </div>

          <h1
            id="home-hero-title"
            className="max-w-[850px] text-balance text-[clamp(2.65rem,6vw,5.4rem)] font-black leading-[0.94] tracking-[-0.055em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
          >
            Aqlliroq o'rganing. Tezroq o'sing. Istalgan joyda yarating.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base font-semibold leading-7 text-slate-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-lg">
            Amaliy kurslar, real loyihalar va mentor fikri bilan dizayn
            mahoratingizni portfolio darajasiga olib chiqing.
          </p>
          <Link
            to="/kurslar"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_16px_36px_rgba(0,0,0,0.3)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-0"
          >
            Kurslarni ko'rish
          </Link>
        </motion.div>
      </section>

      {/* Platformadagi yo'nalishlar (Katta rasmdan pastda) */}
      <section
        data-home-section="directions"
        data-testid="home-directions"
        aria-labelledby="directions-title"
        className="bg-[oklch(99%_0.006_245)] px-6 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl text-center">
          <p
            id="directions-title"
            className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500"
          >
            Platformadagi yo'nalishlar
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:gap-x-12 lg:gap-x-16">
            {directions.map((direction) => (
              <Link
                key={direction.label}
                to={`/kurslar?q=${encodeURIComponent(direction.query)}`}
                className="text-xl font-bold tracking-tight text-slate-800 transition duration-200 hover:-translate-y-0.5 hover:text-violet-700 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 sm:text-2xl"
              >
                {direction.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <VideoShowcase />
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
