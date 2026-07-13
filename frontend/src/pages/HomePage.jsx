import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import EngagementSection from "../components/EngagementSection";
import RecommendationSection from "../components/RecommendationSection";
import { authApi, discoveryApi } from "../lib/api";

/* Deferred WaveAnimation: loads only after browser is idle */
function DeferredWaveAnimation() {
  const [Wave, setWave] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      import("../components/WaveAnimation").then((mod) => {
        if (!cancelled) setWave(() => mod.default);
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(load, { timeout: 2000 });
      return () => { cancelled = true; window.cancelIdleCallback(id); };
    } else {
      const t = setTimeout(load, 1500);
      return () => { cancelled = true; clearTimeout(t); };
    }
  }, []);
  if (!Wave) return null;
  return <Wave />;
}

// Backend ishlamay qolsa ko'rsatiladigan zaxira kurslar
const FALLBACK_COURSES = [
  {
    id: "f1",
    title: "UI/UX dizayn tizimlari",
    subtitle: "Interfeys dizayni",
    level: "O'rta daraja",
    lessons: 24,
    image_url:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  },
  {
    id: "f2",
    title: "Moda kolleksiyasini yaratish",
    subtitle: "Libos dizayni",
    level: "Boshlang'ich",
    lessons: 18,
    image_url:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
  },
  {
    id: "f3",
    title: "Brending va vizual til",
    subtitle: "Brend dizayni",
    level: "Barcha darajalar",
    lessons: 20,
    image_url:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
];

const pageStyles = `
@keyframes stripe-float {
  0%, 100% { transform: translate(0px, 0px) rotate(35deg); }
  50% { transform: translate(45px, 40px) rotate(50deg); }
}
@keyframes blob-drift {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -30px); }
  50% { transform: translate(-20px, 20px); }
  75% { transform: translate(10px, -10px); }
}
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes cta-blob-drift {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-40px, 40px); }
  50% { transform: translate(40px, -40px); }
  75% { transform: translate(-20px, 20px); }
}
.animate-stripe { animation: stripe-float 20s ease-in-out infinite; }
.animate-blob-drift { animation: blob-drift 18s linear infinite; }
.animate-gradient-shift {
  animation: gradient-shift 8s linear infinite;
  background-size: 200% auto;
}
.animate-cta-blob { animation: cta-blob-drift 25s linear infinite; }
.reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
.reveal-small { opacity: 0; transform: translateY(20px); transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
.reveal.visible, .reveal-small.visible { opacity: 1; transform: translateY(0); }
.stagger-1 { transition-delay: 0.1s; }
.stagger-2 { transition-delay: 0.25s; }
.stagger-3 { transition-delay: 0.4s; }
.hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,0,0,0.06); }
.hover-scale { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.hover-scale:hover { transform: scale(1.03); box-shadow: 0 20px 40px -10px rgba(124,58,237,0.45); }
.hover-scale:active { transform: scale(0.98); }
.hover-scale-light { transition: transform 0.3s ease, background-color 0.3s ease; }
.hover-scale-light:hover { transform: scale(1.03); background-color: #f8fafc; }
.hover-scale-light:active { transform: scale(0.98); }
.trust-chip { transition: transform 0.2s ease, opacity 0.2s ease; }
.trust-chip:hover { transform: scale(1.05); opacity: 0.8; }
.cta-glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.4);
  box-shadow: 0 40px 100px rgba(79, 70, 229, 0.1);
}
`;

/* IntersectionObserver hook for scroll reveal */
function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );
    const revealEls = el.querySelectorAll(".reveal, .reveal-small");
    revealEls.forEach((child) => observer.observe(child));
    if (el.classList.contains("reveal") || el.classList.contains("reveal-small")) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function HomePage() {
  const [courses, setCourses] = useState(FALLBACK_COURSES);
  const revealRef = useReveal();

  useEffect(() => {
    authApi
      .courses()
      .then((list) => {
        if (Array.isArray(list) && list.length) setCourses(list.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <main ref={revealRef}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
        {/* Stripe-style Floating Gradient Wave Animation - deferred until idle */}
        <div className="absolute top-[-20%] right-[-15%] w-[70rem] h-[70rem] opacity-40 pointer-events-none z-0 animate-stripe">
          <DeferredWaveAnimation />
        </div>

        {/* Subtle background blob */}
        <div className="absolute top-[10%] left-[-10%] w-[40rem] h-[40rem] bg-pink-400/10 blur-[120px] rounded-full pointer-events-none z-0 animate-blob-drift" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="reveal">
            <div className="inline-block px-4 py-1.5 rounded-full border border-pink-100 bg-white shadow-sm mb-6">
              <span className="text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Ta'limning kelajagi
              </span>
            </div>
          </div>

          <h1 className="reveal stagger-1 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">
            Mahoratingizni yuksaltiring{" "}
            <span className="animate-gradient-shift text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 inline-block pb-2">
              Designora.
            </span>
          </h1>

          <p className="reveal stagger-2 text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto">
            Oddiy videodarslarni unuting. Soha yetakchilaridan kinematik
            sifatdagi jonli masterklasslar orqali amaliy bilim oling.
          </p>

          <div className="reveal stagger-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <span className="hover-scale relative inline-block px-8 py-4 rounded-full text-white font-bold text-lg overflow-hidden group bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                <span className="relative z-10">Hozir boshlash</span>
              </span>
            </Link>

            <Link to="/kurslar">
              <span className="hover-scale-light inline-block px-8 py-4 rounded-full glass-panel text-slate-900 font-bold text-lg">
                Kurslarni ko\u2019rish
              </span>
            </Link>
          </div>

          <div className="reveal stagger-3 mt-12 flex items-center justify-center gap-8 border-t border-gray-200 pt-8">
            <div>
              <span className="text-2xl font-bold text-slate-900">12,000+</span>
              <p className="text-sm text-slate-500">Faol o\u2019quvchilar</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900">4.9/5</span>
              <p className="text-sm text-slate-500">O\u2019rtacha baho</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST LOGOS */}
      <section className="py-16 border-t border-gray-100">
        <div className="reveal max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-8">
            Platformadagi yo\u2019nalishlar
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-xl font-semibold text-gray-300">
            {["UI/UX", "Moda dizayni", "Brending", "Styling", "Grafik dizayn"].map(
              (logo) => (
                <span key={logo} className="trust-chip cursor-pointer">
                  {logo}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* 3. FEATURED COURSES */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex justify-between items-end mb-16 gap-4">
          <div className="reveal-small">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Tanlangan dasturlar
            </h2>
            <p className="text-gray-500 text-lg">
              Kinematik ta'lim, amaliy natijalar.
            </p>
          </div>
          <Link to="/kurslar">
            <span className="reveal-small hover-scale-light inline-block px-6 py-3 rounded-full glass-panel text-slate-900 font-bold text-sm">
              Barcha kurslar
            </span>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, idx) => (
            <div
              key={course.id ?? course.title}
              className={`reveal-small stagger-${idx + 1} hover-lift bg-white rounded-3xl overflow-hidden border border-gray-100 group cursor-pointer shadow-sm`}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">
                  {course.subtitle ?? course.tags}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 mb-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {course.level ?? course.instructor}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-pink-600">
                    Bepul sinov
                  </span>
                  <span className="text-xs text-gray-400">
                    {course.lessons ?? 12} dars
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <EngagementSection />

      {/* Tavsiya: ko'p sotilgan kurslar */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <RecommendationSection
          title="Eng mashhur kurslar"
          fetchFn={() => discoveryApi.bestselling(6)}
          limit={3}
        />
      </section>

      {/* Cinematic Call to Action */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="reveal cta-glass rounded-[32px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-200/20 blur-[100px] rounded-full animate-cta-blob" />
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 relative z-10">
            Raqamli ta'limingizni yangi bosqichga olib chiqing.
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-10 relative z-10">
            Minglab mutaxassislar qatoriga qo\u2019shiling va yangi ko\u2019nikmalarni
            chuqur amaliyot orqali egallang.
          </p>
          <Link to="/register" className="relative z-10">
            <span className="hover-scale relative inline-block px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg group overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              <span className="relative z-10">To\u2019liq kirish olish</span>
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
