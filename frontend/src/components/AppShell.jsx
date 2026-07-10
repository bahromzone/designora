import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
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

// Skillshare uslubidagi footer menyulari.
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

  // Har sahifa almashganda: yuqoriga scroll + page_view hodisasini yuboramiz.
  // Scroll reset — React Router eski scroll pozitsiyasini saqlab qolgani uchun
  // footer'dan (yoki istalgan pastki joydan) menyu bosilganda yangi sahifa ham
  // pastda ochilib qolardi. Har navigatsiyada tepaga qaytaramiz.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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

      {/* ── DARK FOOTER (Skillshare uslubi) ────────────────────────── */}
      <footer className="relative z-10 mt-24 bg-[#0e0e10] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Ustunlar: 4 ta menyu */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
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
        </div>
      </footer>
    </div>
  );
}
