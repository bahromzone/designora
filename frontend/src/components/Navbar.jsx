import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const links = [
  { label: "Bosh sahifa", to: "/" },
  { label: "Kurslar",     to: "/kurslar" },
];

function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ TUZATILDI: modal endi backend bilan ishlaydi
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Modal ochilganda/rejim almashganda forma va xatoni tozalash
  useEffect(() => {
    setError("");
  }, [mode, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          username: form.name,
          email: form.email,
          password: form.password,
          recaptcha_token: "",
        });
      }
      setForm({ name: "", email: "", password: "" });
      onClose();
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

          {/* Global SVG Definitions */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="icon-grad-modal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#813BFF" />
                <stop offset="100%" stopColor="#3A41FF" />
              </linearGradient>
            </defs>
          </svg>

          {/* Modal Container - KICHRAYTIRILGAN O'LCHAMLAR */}
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
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white md:text-[#1E2335] md:hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Desktop Background Layer */}
            <div className="hidden md:block absolute inset-0 z-0 bg-gradient-to-br from-[#A238FF] via-[#6525EA] to-[#255EE5]">
              <svg
                className={`absolute inset-0 w-full h-full text-white drop-shadow-2xl transition-transform duration-700 ease-in-out ${mode === 'signup' ? '-scale-x-100' : ''}`}
                viewBox="0 0 1000 600"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M 0,0 L 0,600 L 320,600 C 420,600 440,530 540,540 C 640,550 670,600 770,550 C 870,500 840,420 900,350 C 960,280 920,200 840,150 C 760,100 770,50 670,30 C 570,10 520,80 420,50 C 370,35 370,0 320,0 Z" />
              </svg>
            </div>

            {/* Mobile Background Layers */}
            <div className="md:hidden absolute inset-0 z-0 flex flex-col">
              <div className="flex-1 bg-white"></div>
              <div className="flex-1 bg-gradient-to-br from-[#A238FF] via-[#6525EA] to-[#255EE5]"></div>
            </div>

            {/* LEFT COLUMN: Form Section */}
            <div className={`relative z-10 w-full md:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 transition-all duration-500 ${mode === 'signup' ? 'md:order-last' : ''}`}>
              <div className="w-full max-w-[320px] flex flex-col items-center">

                <h1 className="text-[2rem] font-extrabold text-[#1E2335] tracking-tight mb-1">
                  {mode === 'login' ? 'Salom!' : 'Hisob yarating'}
                </h1>
                <p className="text-[14px] text-[#868D9C] mb-6">
                  {mode === 'login' ? 'Hisobingizga kiring' : "Bugun Designora'ga qo'shiling"}
                </p>

                <form className="w-full space-y-4" onSubmit={handleSubmit}>

                  {/* Name Input (Signup Only) */}
                  <AnimatePresence mode="popLayout">
                    {mode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full"
                      >
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="url(#icon-grad-modal)">
                             <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                           </svg>
                        </div>
                        <input
                          type="text"
<<<<<<< HEAD
                          placeholder="Full Name"
=======
                          placeholder="Ism va familiya"
>>>>>>> b8356c10f54b59b076137c6fcd4575261d88b988
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          minLength={3}
                          maxLength={50}
                          required={mode === "signup"}
                          className="w-full bg-[#F8F9FA] md:bg-white rounded-full py-3.5 pl-[3.2rem] pr-5 text-[14px] text-gray-700 placeholder-[#A0A6B5] outline-none shadow-[0_8px_30px_-5px_rgba(110,120,180,0.15)] focus:shadow-[0_8px_30px_-5px_rgba(129,59,255,0.25)] border border-transparent focus:border-violet-100 transition-all duration-300"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Input */}
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="url(#icon-grad-modal)">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="E-pochta"
                      autoFocus
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      required
                      className="w-full bg-[#F8F9FA] md:bg-white rounded-full py-3.5 pl-[3.2rem] pr-5 text-[14px] text-gray-700 placeholder-[#A0A6B5] outline-none shadow-[0_8px_30px_-5px_rgba(110,120,180,0.15)] focus:shadow-[0_8px_30px_-5px_rgba(129,59,255,0.25)] border border-transparent focus:border-violet-100 transition-all duration-300"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="url(#icon-grad-modal)">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
<<<<<<< HEAD
                      placeholder="Password"
=======
                      placeholder="Parol"
>>>>>>> b8356c10f54b59b076137c6fcd4575261d88b988
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      minLength={8}
                      maxLength={128}
                      required
                      className="w-full bg-[#F8F9FA] md:bg-white rounded-full py-3.5 pl-[3.2rem] pr-[3.2rem] text-[14px] text-gray-700 placeholder-[#A0A6B5] outline-none shadow-[0_8px_30px_-5px_rgba(110,120,180,0.15)] focus:shadow-[0_8px_30px_-5px_rgba(129,59,255,0.25)] border border-transparent focus:border-violet-100 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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

                  {/* Options Row (Login Only) */}
                  {mode === 'login' && (
                    <div className="flex justify-between items-center px-1 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-[16px] h-[16px] rounded-[4px] bg-[#F8F9FA] md:bg-white border-2 border-[#D1D6E2] group-hover:border-[#813BFF] transition-colors">
                          <input type="checkbox" className="peer sr-only" defaultChecked />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#813BFF] to-[#3A41FF] rounded-[2px] opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-[12px] font-medium text-[#A0A6B5] select-none">Meni eslab qol</span>
                      </label>

                      <a href="#" className="text-[12px] font-medium text-[#A0A6B5] hover:text-[#813BFF] transition-colors">
                        Parolni unutdingizmi?
                      </a>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <p className="text-center text-[13px] font-semibold text-red-500 px-2">
                      {error}
                    </p>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-center pt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-[180px] bg-gradient-to-r from-[#953DFF] via-[#6533FF] to-[#3055FF] text-white text-[14px] font-bold tracking-wide py-3 rounded-full shadow-[0_12px_24px_-8px_rgba(100,50,255,0.6)] hover:shadow-[0_15px_30px_-8px_rgba(100,50,255,0.7)] hover:-translate-y-[2px] transition-all duration-300 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
<<<<<<< HEAD
                      {submitting ? "..." : mode === 'login' ? 'SIGN IN' : 'SIGN UP'}
=======
                      {submitting ? "..." : mode === 'login' ? 'KIRISH' : "RO'YXATDAN O'TISH"}
>>>>>>> b8356c10f54b59b076137c6fcd4575261d88b988
                    </button>
                  </div>

                </form>

                <p className="mt-6 text-[13px] text-[#A0A6B5] font-medium">
                  {mode === 'login' ? "Hisobingiz yo'qmi? " : "Hisobingiz bormi? "}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[#6533FF] font-semibold hover:underline decoration-2 underline-offset-2 focus:outline-none"
                  >
                    {mode === 'login' ? 'Yaratish' : 'Kirish'}
                  </button>
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Visual & Text Section */}
            <div className={`relative z-10 w-full md:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 text-center transition-all duration-500 ${mode === 'signup' ? 'md:order-first' : ''}`}>
              <div className="max-w-[260px]">
                <h2 className="text-[1.75rem] font-extrabold text-white md:text-[#1E2335] mb-4 tracking-tight drop-shadow-sm md:drop-shadow-none">
                  {mode === 'login' ? 'Qaytganingizdan xursandmiz!' : "Designora oilasiga xush kelibsiz"}
                </h2>
                <p className="text-[13.5px] leading-[1.6] text-white/90 md:text-[#6C7281] font-medium">
                  {mode === 'login'
                    ? "Premium kurslar, mentorlik va shaxsiy tavsiyalar sizni kutmoqda. O'qishni qoldirgan joyingizdan davom ettiring."
                    : "Premium kurslar va mentorlikka ega bo'ling hamda kelajakni quruvchi kuchli dizaynerlar hamjamiyatiga qo'shiling."}
                </p>
              </div>
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
  const [isHovered, setIsHovered] = useState(false); // YANGI: Sichqoncha holati uchun state
  const location = useLocation();

  // Modal State
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
        onMouseEnter={() => setIsHovered(true)}   // YANGI: Sichqoncha ustiga kelganda
        onMouseLeave={() => setIsHovered(false)}  // YANGI: Sichqoncha ketganda
        // YANGI: scrolled YOKI isHovered holatida Navbar oq fonga kiradi (Stripe uslubi)
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled || isHovered ? "py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm" : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* Sleek Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="group-hover:scale-110 transition-transform duration-300">
               <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#logo_grad1)" />
               <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" fill="url(#logo_grad2)" opacity="0.9"/>
               <defs>
                 <linearGradient id="logo_grad1" x1="2" y1="9" x2="30" y2="9" gradientUnits="userSpaceOnUse">
                   <stop stopColor="#EC4899" />
                   <stop offset="1" stopColor="#6366F1" />
                 </linearGradient>
                 <linearGradient id="logo_grad2" x1="16" y1="30" x2="16" y2="9" gradientUnits="userSpaceOnUse">
                   <stop stopColor="#A855F7" />
                   <stop offset="1" stopColor="#4F46E5" />
                 </linearGradient>
               </defs>
            </svg>
            <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-indigo-500 transition-all">
              Designora
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth CTA */}
          <div className="hidden md:flex items-center gap-5">
            {isAuthenticated ? (
               <div className="flex items-center gap-4">
                 <Link to="/profil" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">{user?.full_name}</Link>
                 <button onClick={logout} className="text-sm font-medium px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors">Chiqish</button>
               </div>
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