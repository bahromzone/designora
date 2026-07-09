import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

// Backend bazasi (Google OAuth to'g'ridan backendga boradi, /api emas).
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;

const links = [
  { label: "Bosh sahifa", to: "/" },
  { label: "Kurslar", to: "/kurslar" },
  { label: "Blog", to: "/blog" },
  { label: "Forum", to: "/forum" },
];

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.3 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.4c-.5-1.5-.8-3-.8-4.4s.3-3 .8-4.4l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.5 10.5l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.6l-7.3-5.7c-2 1.4-4.7 2.3-8.2 2.3-6.4 0-11.8-3.8-13.6-9.4l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup" | "forgot"
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Rejim almashganda / modal ochilganda xabarlarni tozalash
  useEffect(() => {
    setError("");
    setNotice("");
  }, [mode, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        setForm({ name: "", email: "", password: "" });
        onClose();
      } else if (mode === "signup") {
        await register({
          username: form.name,
          email: form.email,
          password: form.password,
          recaptcha_token: "",
        });
        setForm({ name: "", email: "", password: "" });
        onClose();
      } else {
        // forgot: parolni tiklash havolasini so'rash
        const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.detail || "So'rovni bajarib bo'lmadi.");
        }
        setNotice(
          data?.message ||
            "Agar email tizimda mavjud bo'lsa, parolni tiklash havolasi yuborildi."
        );
      }
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const heading =
    mode === "login"
      ? "Salom!"
      : mode === "signup"
        ? "Hisob yarating"
        : "Parolni tiklash";
  const sub =
    mode === "login"
      ? "Hisobingizga kiring"
      : mode === "signup"
        ? "Bugun Designora'ga qo'shiling"
        : "Emailingizni kiriting, tiklash havolasini yuboramiz";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-gray-800">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="relative z-10 w-full max-w-[860px] min-h-[520px] rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-[0_20px_60px_-15px_rgba(90,50,230,0.3)] bg-white md:bg-transparent"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Yopish"
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/5 hover:bg-black/10 md:bg-white/10 md:hover:bg-white/20 text-[#1E2335] md:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Desktop gradient background + wave */}
            <div className="hidden md:block absolute inset-0 z-0 bg-gradient-to-br from-[#A238FF] via-[#6525EA] to-[#255EE5]">
              <svg
                className={`absolute inset-0 w-full h-full text-white drop-shadow-2xl transition-transform duration-700 ease-in-out ${mode === "signup" ? "-scale-x-100" : ""}`}
                viewBox="0 0 1000 600"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M 0,0 L 0,600 L 320,600 C 420,600 440,530 540,540 C 640,550 670,600 770,550 C 870,500 840,420 900,350 C 960,280 920,200 840,150 C 760,100 770,50 670,30 C 570,10 520,80 420,50 C 370,35 370,0 320,0 Z" />
              </svg>
            </div>

            {/* Mobile background */}
            <div className="md:hidden absolute inset-0 z-0 flex flex-col">
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-gradient-to-br from-[#A238FF] via-[#6525EA] to-[#255EE5]" />
            </div>

            {/* LEFT COLUMN: Form */}
            <div
              className={`relative z-10 w-full md:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 transition-all duration-500 ${mode === "signup" ? "md:order-last" : ""}`}
            >
              <div className="w-full max-w-[320px] flex flex-col items-center">
                <h1 className="text-[2rem] font-extrabold text-[#1E2335] tracking-tight mb-1">
                  {heading}
                </h1>
                <p className="text-[14px] text-[#868D9C] mb-6 text-center">
                  {sub}
                </p>

                {/* Google (login/signup rejimlarda) */}
                {mode !== "forgot" && (
                  <>
                    <a
                      href={GOOGLE_AUTH_URL}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-[#E4E7EC] rounded-full py-3 text-[14px] font-semibold text-[#1E2335] hover:bg-[#F8F9FA] hover:border-[#D1D6E2] transition-colors"
                    >
                      <GoogleMark />
                      Google orqali davom etish
                    </a>
                    <div className="flex items-center gap-3 w-full my-5 text-[11px] font-semibold uppercase tracking-wider text-[#A0A6B5]">
                      <span className="flex-1 h-px bg-[#E4E7EC]" />
                      yoki
                      <span className="flex-1 h-px bg-[#E4E7EC]" />
                    </div>
                  </>
                )}

                <form className="w-full space-y-4" onSubmit={handleSubmit}>
                  {/* Name (signup only) */}
                  <AnimatePresence mode="popLayout">
                    {mode === "signup" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                        animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full"
                      >
                        <input
                          type="text"
                          placeholder="Ism va familiya"
                          value={form.name}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, name: e.target.value }))
                          }
                          minLength={3}
                          maxLength={50}
                          required={mode === "signup"}
                          className="w-full bg-[#F8F9FA] md:bg-white rounded-full py-3.5 px-5 text-[14px] text-gray-700 placeholder-[#A0A6B5] outline-none border border-transparent focus:border-violet-200 transition-all"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email (all modes) */}
                  <input
                    type="email"
                    placeholder="E-pochta"
                    autoFocus
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                    className="w-full bg-[#F8F9FA] md:bg-white rounded-full py-3.5 px-5 text-[14px] text-gray-700 placeholder-[#A0A6B5] outline-none border border-transparent focus:border-violet-200 transition-all"
                  />

                  {/* Password (login/signup) */}
                  {mode !== "forgot" && (
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Parol"
                        value={form.password}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, password: e.target.value }))
                        }
                        minLength={8}
                        maxLength={128}
                        required={mode !== "forgot"}
                        className="w-full bg-[#F8F9FA] md:bg-white rounded-full py-3.5 pl-5 pr-[3.2rem] text-[14px] text-gray-700 placeholder-[#A0A6B5] outline-none border border-transparent focus:border-violet-200 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#813BFF] hover:text-[#5022b5] transition-colors outline-none"
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Options (login only) */}
                  {mode === "login" && (
                    <div className="flex justify-between items-center px-1 pt-1 text-[13px]">
                      <label className="flex items-center gap-2 cursor-pointer text-[#868D9C]">
                        <input type="checkbox" defaultChecked className="accent-[#6533FF]" />
                        Meni eslab qol
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[#6533FF] font-semibold hover:underline"
                      >
                        Parolni unutdingizmi?
                      </button>
                    </div>
                  )}

                  {/* Notice / Error */}
                  {notice && (
                    <p className="rounded-xl px-4 py-2.5 text-[13px] bg-emerald-50 text-emerald-700 text-center">
                      {notice}
                    </p>
                  )}
                  {error && (
                    <p className="rounded-xl px-4 py-2.5 text-[13px] bg-rose-50 text-rose-700 text-center">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full justify-center !py-3.5 disabled:opacity-60"
                  >
                    {submitting
                      ? "..."
                      : mode === "login"
                        ? "KIRISH"
                        : mode === "signup"
                          ? "RO'YXATDAN O'TISH"
                          : "HAVOLA YUBORISH"}
                  </button>
                </form>

                {/* Mode switch */}
                <p className="mt-5 text-[14px] text-[#868D9C] text-center">
                  {mode === "login" && (
                    <>
                      Hisobingiz yo'qmi?{" "}
                      <button
                        onClick={() => setMode("signup")}
                        className="text-[#6533FF] font-semibold hover:underline"
                      >
                        Yaratish
                      </button>
                    </>
                  )}
                  {mode === "signup" && (
                    <>
                      Hisobingiz bormi?{" "}
                      <button
                        onClick={() => setMode("login")}
                        className="text-[#6533FF] font-semibold hover:underline"
                      >
                        Kirish
                      </button>
                    </>
                  )}
                  {mode === "forgot" && (
                    <button
                      onClick={() => setMode("login")}
                      className="text-[#6533FF] font-semibold hover:underline"
                    >
                      ← Kirishga qaytish
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Visual text */}
            <div className="relative z-10 w-full md:w-1/2 hidden md:flex flex-col items-center justify-center p-12 text-white text-center">
              <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                {mode === "login"
                  ? "Qaytganingizdan xursandmiz!"
                  : mode === "signup"
                    ? "Designora oilasiga xush kelibsiz"
                    : "Xavotir olmang"}
              </h2>
              <p className="text-white/85 leading-relaxed max-w-xs">
                {mode === "login"
                  ? "Premium kurslar, mentorlik va shaxsiy tavsiyalar sizni kutmoqda. O'qishni qoldirgan joyingizdan davom ettiring."
                  : mode === "signup"
                    ? "Premium kurslar va mentorlikka ega bo'ling hamda kelajakni quruvchi kuchli dizaynerlar hamjamiyatiga qo'shiling."
                    : "Emailingizga parolni tiklash havolasini yuboramiz. Havola 15 daqiqa amal qiladi."}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openModal = (mode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled || isHovered
            ? "py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#nav_grad1)" />
              <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" fill="url(#nav_grad2)" opacity="0.9" />
              <defs>
                <linearGradient id="nav_grad1" x1="2" y1="9" x2="30" y2="9" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EC4899" />
                  <stop offset="1" stopColor="#6366F1" />
                </linearGradient>
                <linearGradient id="nav_grad2" x1="16" y1="30" x2="16" y2="9" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A855F7" />
                  <stop offset="1" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Designora
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? "text-slate-900 font-bold" : "text-slate-500 hover:text-slate-900"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink
                to="/kurslarim"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? "text-slate-900 font-bold" : "text-slate-500 hover:text-slate-900"}`
                }
              >
                Mening kurslarim
              </NavLink>
            )}
          </div>

          {/* Auth CTA */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link to="/profil" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                  {user?.name}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Chiqish
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openModal("login")}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Kirish
                </button>
                <button
                  onClick={() => openModal("signup")}
                  className="px-5 py-2.5 rounded-full text-sm font-bold bg-slate-900 text-white hover:scale-105 hover:shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition-all"
                >
                  Hisob yaratish
                </button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mount Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
}
