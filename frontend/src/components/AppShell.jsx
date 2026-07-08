import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
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

const FOOTER_LINKS = [
  {
    title: "Platforma",
    links: ["Kurslar", "Yo'nalishlar", "Narxlar", "Sertifikatlar"],
  },
  { title: "Kompaniya", links: ["Biz haqimizda", "Karyera", "Blog", "Aloqa"] },
  {
    title: "Yordam",
    links: [
      "Yordam markazi",
      "Savol-javob",
      "Foydalanish shartlari",
      "Maxfiylik siyosati",
    ],
  },
  { title: "Resurslar", links: ["Hamjamiyat", "Darsliklar", "Qo'llanmalar"] },
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

      {/* RICH MULTI-COLUMN FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 lg:gap-8">
            {/* Left Section: Branding & Socials */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 group cursor-pointer w-max">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="group-hover:scale-110 transition-transform duration-300"
                  aria-hidden="true"
                >
                  <path
                    d="M16 2L2 9L16 16L30 9L16 2Z"
                    fill="url(#footer_grad1)"
                  />
                  <path
                    d="M2 23L16 30L30 23V9L16 16L2 9V23Z"
                    fill="url(#footer_grad2)"
                    opacity="0.9"
                  />
                  <defs>
                    <linearGradient
                      id="footer_grad1"
                      x1="2"
                      y1="9"
                      x2="30"
                      y2="9"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#EC4899" />
                      <stop offset="1" stopColor="#6366F1" />
                    </linearGradient>
                    <linearGradient
                      id="footer_grad2"
                      x1="16"
                      y1="30"
                      x2="16"
                      y2="9"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#A855F7" />
                      <stop offset="1" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-indigo-500 transition-all">
                  Designora
                </span>
              </div>
              <p className="mt-5 text-sm text-slate-500 max-w-xs leading-relaxed">
                Zamonaviy dizayn va moda ta'limi platformasi. Premium, kinematik
                ta'lim tajribasi orqali bilimingizni yangi darajaga olib
                chiqamiz.
              </p>

              {/* Social Icons */}
              <div className="flex gap-4 mt-8">
                {["Instagram", "Telegram", "YouTube", "Twitter"].map(
                  (social) => (
                    <button
                      key={social}
                      aria-label={social}
                      className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-gray-200 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                    >
                      <span className="text-xs font-bold" aria-hidden="true">
                        {social[0]}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Right Section: Multi-column Menus */}
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
              {FOOTER_LINKS.map((col) => (
                <div key={col.title}>
                  <h4 className="font-bold text-slate-900 mb-6">{col.title}</h4>
                  <ul className="space-y-4">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-slate-500 hover:text-indigo-600 transition-colors duration-200"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2026 Designora. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
