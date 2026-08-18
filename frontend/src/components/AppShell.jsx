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
    icon: "telegram",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/mydesignora",
    icon: "instagram",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@ourdesignora",
    icon: "youtube",
  },
];

function SocialIcon({ name }) {
  if (name === "telegram") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] fill-current"
      >
        <path d="M21.66 3.15a1.27 1.27 0 0 0-1.3-.19L2.94 9.68c-.72.28-1.16.7-1.2 1.16-.03.45.35.84 1.04 1.09l4.38 1.53 1.69 5.15c.2.61.52.94.94.99h.1c.38 0 .72-.25 1.03-.74l2.39-3.78 4.53 3.34c.42.31.84.4 1.22.25.45-.17.76-.62.88-1.27l2.43-12.93c.11-.59-.14-1.05-.71-1.32ZM9.72 13.05l7.75-4.88-6.35 6.19-.75 2.36-.65-3.67Z" />
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] fill-none stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.25" />
        <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[19px] w-[19px] fill-current"
    >
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.54 12 3.54 12 3.54s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  );
}

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
                  src="https://u308473473.p.clickup-attachments.com/u308473473/a583d09d-9759-464c-8cf7-7f72b854c0cd/designora-footer-logo-clean.png?view=open"
                  alt="Designora"
                  className="h-auto w-56 max-w-full object-contain object-left"
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
                    title={social.label}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white/75 transition duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
                  >
                    <SocialIcon name={social.icon} />
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
