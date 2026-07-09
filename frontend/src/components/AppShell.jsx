import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import LanguageSwitcher from "./LanguageSwitcher";
import OnboardingModal from "./OnboardingModal";
import { trackEvent } from "../lib/track";

const pageVariants = {
  initial: { opacity: 0, filter: "blur(10px)" },
  enter: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    filter: "blur(10px)",
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

// Skillshare uslubidagi 5 ustunli footer menyulari.
const FOOTER_COLUMNS = [
  {
    title: "Kompaniya",
    links: ["Biz haqimizda", "Karyera", "Matbuot", "Blog"],
  },
  {
    title: "Hamkorlik",
    links: ["Affiliate dastur", "Hamkorликlar"],
  },
  {
    title: "O'qituvchilar uchun",
    links: ["O'qituvchi bo'lish", "Yordam markazi", "Qoidalar va talablar"],
  },
  {
    title: "Do'kon",
    links: ["Sovg'a a'zoliklari", "Raqamli mahsulotlar", "1-on-1 sessiyalar"],
  },
];

const BOTTOM_LINKS = [
  "Yordam",
  "Maxfiylik",
  "Shartlar",
  "Maxfiylik tanlovlari",
];

export default function AppShell({ children }) {
  const location = useLocation();

  // Faqat joriy manzil "/" bo'lsa, rost (true) bo'ladi
  const isHomePage = location.pathname === "/";

  // Har sahifa almashganda page_view hodisasini yuboramiz (fire-and-forget).
  useEffect(() => {
    trackEvent("page_view", { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex flex-col selection:bg-purple-500/20 overflow-x-hidden">
      {/* Klaviatura foydalanuvchilari uchun — asosiy kontentga sakrash */}
      <a href="#asosiy-kontent" className="skip-link">
        Asosiy kontentga o'tish
      </a>

      {/* Yangi foydalanuvchi uchun onboarding (o'zi shartni tekshiradi) */}
      <OnboardingModal />

      <Navbar />

      <AnimatePresence mode="wait">
        <motion.main
          id="asosiy-kontent"
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          // Asosiy sahifada tepadagi bo'shliqni (pt-24) olib tashlaymiz
          className={`flex-grow flex flex-col relative z-10 ${isHomePage ? "" : "pt-24"}`}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* ── DARK FOOTER (Skillshare uslubi) ─────────────────────── */}
      <footer className="relative z-10 mt-24 bg-[#0e0e10] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Ustunlar: 4 ta menyu + Ilova tugmalari */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-base font-bold text-white mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Ilova ustuni — App Store + Google Play */}
            <div>
              <h4 className="text-base font-bold text-white mb-5">Ilova</h4>
              <div className="space-y-3">
                <a
                  href="#"
                  aria-label="App Store'dan yuklab olish"
                  className="flex items-center gap-3 w-full max-w-[190px] rounded-xl border border-white/20 px-4 py-2.5 hover:border-white/50 transition-colors"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.05 12.5c-.03-2.5 2.05-3.7 2.14-3.76-1.17-1.7-2.98-1.94-3.62-1.97-1.54-.16-3 .9-3.78.9-.78 0-1.98-.88-3.25-.86-1.67.03-3.21.97-4.07 2.46-1.74 3.02-.44 7.48 1.24 9.93.83 1.2 1.81 2.54 3.1 2.49 1.25-.05 1.72-.8 3.23-.8 1.5 0 1.93.8 3.25.78 1.34-.03 2.19-1.22 3.01-2.42.95-1.39 1.34-2.74 1.36-2.81-.03-.01-2.61-1-2.64-3.97zM14.6 4.7c.69-.83 1.15-1.99 1.02-3.15-.99.04-2.19.66-2.9 1.49-.64.73-1.2 1.91-1.05 3.04 1.1.09 2.24-.56 2.93-1.38z" />
                  </svg>
                  <span className="leading-tight text-left">
                    <span className="block text-[10px] text-white/60">
                      Yuklab olish
                    </span>
                    <span className="block text-sm font-semibold">
                      App Store
                    </span>
                  </span>
                </a>
                <a
                  href="#"
                  aria-label="Google Play'dan yuklab olish"
                  className="flex items-center gap-3 w-full max-w-[190px] rounded-xl border border-white/20 px-4 py-2.5 hover:border-white/50 transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 512 512"
                    aria-hidden="true"
                  >
                    <path
                      fill="#00D0FF"
                      d="M47 24c-5 3-8 8-8 15v434c0 7 3 12 8 15l246-232L47 24z"
                    />
                    <path
                      fill="#00F076"
                      d="M47 24l246 232 68-64L94 15c-18-10-38-4-47 9z"
                    />
                    <path
                      fill="#FFD500"
                      d="M361 192l-68 64 68 64 90-51c15-9 15-27 0-36l-90-41z"
                    />
                    <path
                      fill="#FF3A44"
                      d="M47 488l246-232 68 64L94 497c-18 10-38 4-47-9z"
                    />
                  </svg>
                  <span className="leading-tight text-left">
                    <span className="block text-[10px] text-white/60">
                      Oling
                    </span>
                    <span className="block text-sm font-semibold">
                      Google Play
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Ajratuvchi chiziq */}
          <div className="mt-14 border-t border-white/10" />

          {/* Markazlashgan copyright + inline havolalar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/60">
            <span>© 2026 Designora</span>
            {BOTTOM_LINKS.map((link) => (
              <span key={link} className="flex items-center gap-x-4">
                <span aria-hidden="true" className="text-white/25">
                  •
                </span>
                <a href="#" className="hover:text-white transition-colors">
                  {link}
                </a>
              </span>
            ))}
          </div>

          {/* Markazlashgan ijtimoiy tarmoqlar */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {["Instagram", "Telegram", "YouTube", "Twitter"].map((social) => (
              <button
                key={social}
                aria-label={social}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold text-white/70 hover:text-white hover:border-white/60 hover:-translate-y-0.5 transition-all duration-300"
              >
                <span aria-hidden="true">{social[0]}</span>
              </button>
            ))}
          </div>

          {/* Til tanlagich */}
          <div className="mt-8 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}
