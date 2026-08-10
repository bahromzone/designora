import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import OnboardingModal from "./OnboardingModal";
import UserAccountMenu from "./UserAccountMenu";
import { trackEvent } from "../lib/track";

const pageVariants = {
  initial: { opacity: 0, filter: "blur(10px)" },
  enter: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, filter: "blur(10px)", transition: { duration: 0.3, ease: "easeIn" } },
};

const FOOTER_COLUMNS = [
  { title: "Kompaniya", links: [{ label: "Biz haqimizda", to: "/biz-haqimizda" }, { label: "Blog", to: "/blog" }] },
  { title: "Yordam", links: [{ label: "Forum", to: "/forum" }, { label: "O'qituvchi bo'lish", to: "/instruktor-boshlash" }] },
  { title: "Huquqiy", links: [{ label: "Maxfiylik", to: "/maxfiylik" }, { label: "Shartlar", to: "/shartlar" }] },
];
const BOTTOM_LINKS = [{ label: "Maxfiylik", to: "/maxfiylik" }, { label: "Shartlar", to: "/shartlar" }];
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/mydesignora", icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05.9-.19 1.38-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-.9-.04-1.38-.19-1.71-.32-.43-.17-.74-.37-1.06-.69-.32-.32-.52-.63-.69-1.06-.13-.33-.28-.81-.32-1.71-.06-1.24-.07-1.61-.07-4.75s.01-3.51.07-4.75c.04-.9.19-1.38.32-1.71.17-.43.37-.74.69-1.06.32-.32.63-.52 1.06-.69.33-.13.81-.28 1.71-.32 1.24-.06 1.61-.07 4.75-.07zm0 1.44c-3.14 0-3.51.01-4.75.07-.9.04-1.38.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.33-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.04.9.19 1.38.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.33.13.81.28 1.71.32 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.9-.04 1.38-.19 1.71-.32.43-.17.74-.37 1.06-.69 0 0 .52-.63.69-1.06.13-.33.28-.81.32-1.71.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.9-.19-1.38-.32-1.71-.17-.43-.37-.74-.69-1.06-.32-.32-.63-.52-1.06-.69-.33-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.75-.07zm0 2.45a5.95 5.95 0 1 1 0 11.9 5.95 5.95 0 0 1 0-11.9zm0 9.81a3.86 3.86 0 1 0 0-7.72 3.86 3.86 0 0 0 0 7.72zm7.58-10.05a1.39 1.39 0 1 1-2.78 0 1.39 1.39 0 0 1 2.78 0z" /></svg> },
  { label: "YouTube", href: "https://www.youtube.com/@ourdesignora", icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.6 15.6V8.4l6.24 3.6L9.6 15.6z" /></svg> },
  { label: "Telegram", href: "https://t.me/mydesignora", icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M21.94 4.9 18.9 19.2c-.23 1.02-.83 1.27-1.68.79l-4.65-3.43-2.24 2.16c-.25.25-.46.46-.93.46l.33-4.73L18.34 6.7c.37-.33-.08-.51-.58-.18L6.11 13.6l-4.6-1.44c-1-.31-1.02-1-.21-1.48L20.65 3.4c.83-.31 1.56.2 1.29 1.5z" /></svg> },
  { label: "GitHub", href: "https://github.com/bahromzone", icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" /></svg> },
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
      <a href="#asosiy-kontent" className="skip-link">Asosiy kontentga o'tish</a>
      <OnboardingModal />
      <Navbar />
      <UserAccountMenu />
      <AnimatePresence mode="wait">
        <motion.main id="asosiy-kontent" key={location.pathname} variants={pageVariants} initial="initial" animate="enter" exit="exit" className={`relative z-10 flex flex-grow flex-col ${isHomePage ? "" : "pt-24"}`}>
          {children}
        </motion.main>
      </AnimatePresence>
      <footer className="relative z-10 mt-24 bg-[#0e0e10] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => <div key={col.title}><h4 className="mb-5 text-base font-bold text-white">{col.title}</h4><ul className="space-y-3">{col.links.map((link) => <li key={link.label}><Link to={link.to} className="text-sm text-white/60 transition-colors duration-200 hover:text-white">{link.label}</Link></li>)}</ul></div>)}
          </div>
          <div className="mt-14 border-t border-white/10" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/60"><span>© 2026 Designora</span>{BOTTOM_LINKS.map((link) => <span key={link.label} className="flex items-center gap-x-4"><span aria-hidden="true" className="text-white/25">•</span><Link to={link.to} className="transition-colors hover:text-white">{link.label}</Link></span>)}</div>
          <div className="mt-6 flex items-center justify-center gap-4">{SOCIAL_LINKS.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:text-white">{social.icon}</a>)}</div>
        </div>
      </footer>
    </div>
  );
}
