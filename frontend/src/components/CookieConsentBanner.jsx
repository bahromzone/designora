import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const COOKIE_CONSENT_KEY = "designora_cookie_consent";

export default function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsOpen(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <aside aria-label="Cookie sozlamalari">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 mx-auto max-w-4xl z-50 bg-[#171727] text-white p-4 sm:p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 font-sans"
          >
            <div className="flex items-center gap-3.5 text-slate-200 text-sm sm:text-[14.5px] leading-relaxed">
              <span
                className="text-2xl select-none shrink-0"
                aria-hidden="true"
              >
                🍪
              </span>
              <p>
                Saytimizdan samarali foydalanishingiz uchun cookie fayllaridan
                foydalanamiz. Batafsil:{" "}
                <Link
                  to="/maxfiylik"
                  className="text-white font-semibold underline underline-offset-4 hover:text-purple-300 transition-colors"
                >
                  Maxfiylik siyosati
                </Link>
                .
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-slate-200 hover:text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                Rad etish
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-[#6342ff] hover:bg-[#512be6] text-white shadow-[0_4px_16px_rgba(99,66,255,0.45)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Qabul qilish
              </button>
            </div>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
}
