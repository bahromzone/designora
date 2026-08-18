import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
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

const FOOTER_COLUMNS = [
  {
    title: "Kompaniya",
    links: [
      { label: "Biz haqimizda", to: "/biz-haqimizda" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Yordam",
    links: [
      { label: "Forum", to: "/forum" },
      { label: "O'qituvchi bo'lish", to: "/instruktor-boshlash" },
    ],
  },
  {
    title: "Huquqiy",
    links: [
      { label: "Maxfiylik", to: "/maxfiylik" },
      { label: "Shartlar", to: "/shartlar" },
    ],
  },
];

const BOTTOM_LINKS = [
  { label: "Maxfiylik", to: "/maxfiylik" },
  { label: "Shartlar", to: "/shartlar" },
];

const SOCIAL_LINKS = [
  {
    label: "Telegram",
    href: "https://t.me/mydesignora",
    icon: "✈",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/mydesignora",
    icon: "◎",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@ourdesignora",
    icon: "▶",
  },
];

export default function AppShell({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    trackEvent("page_view", { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden selection:bg-purple-500/20">
      <a href="#asosiy-kontent" className="skip-link">
        Asosiy kontentga o'tish
      </a>
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
          className={`relative z-10 flex flex-grow flex-col ${isHomePage ? "" : "pt-24"}`}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <footer className="relative z-10 mt-24 bg-[#0e0e10] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-[1.3fr_2fr]">
            <div>
              <Link
                to="/"
                aria-label="Designora bosh sahifasi"
                className="inline-flex items-center"
              >
                <img
                  src="/brand-logo-dark.svg"
                  alt=""
                  className="h-auto w-40 brightness-0 invert"
                />
              </Link>
              <div className="mt-7 flex items-center gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-sm font-semibold text-white/75 transition hover:-translate-y-0.5 hover:border-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3">
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title}>
                  <h4 className="mb-5 text-base font-bold text-white">
                    {col.title}
                  </h4>
                  <ul className="space-y-3">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          className="text-sm text-white/60 transition-colors duration-200 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 border-t border-white/10" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/60">
            <span>© 2026 Designora</span>
            {BOTTOM_LINKS.map((link) => (
              <span key={link.label} className="flex items-center gap-x-4">
                <span aria-hidden="true" className="text-white/25">
                  •
                </span>
                <Link
                  to={link.to}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
