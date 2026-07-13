import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* \u2500\u2500 CSS Keyframes (replaces framer-motion infinite loops) \u2500\u2500 */
const heroStyles = `
@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes hero-float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes bar-fill-32 {
  from { width: 0; }
  to { width: 32%; }
}
@keyframes bar-fill-72 {
  from { width: 0; }
  to { width: 72%; }
}
@keyframes bar-fill-45 {
  from { width: 0; }
  to { width: 45%; }
}
.hero-card-float {
  animation: hero-float 6s ease-in-out infinite;
}
.hero-pill-float {
  animation: hero-float-slow 5s ease-in-out infinite;
  animation-delay: 0.4s;
}
.bar-budget {
  animation: bar-fill-32 1.4s ease-out 0.5s both;
}
.bar-styling {
  animation: bar-fill-72 1.2s ease-out 0.8s both;
}
.bar-brand {
  animation: bar-fill-45 1.2s ease-out 0.8s both;
}
`;

/* \u2500\u2500 Dashboard Mockup (right side) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* Main card */}
      <div className="card-white rounded-2xl p-5 overflow-hidden hero-card-float">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Kurslar
            </h3>
            <p className="text-xs text-gray-500">Har darajaga mos</p>
          </div>
          {/* Toggle pill */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <span className="px-3 py-1 text-xs rounded-full bg-white shadow-sm font-medium">
              Barchasi
            </span>
            <span className="px-3 py-1 text-xs rounded-full text-gray-500">
              Yangi
            </span>
          </div>
        </div>

        {/* Avatar row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2">
            {["#c4703a", "#2c4a3e", "#8b6f5e", "#4a7c6e", "#d4956e"].map(
              (c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  style={{ background: c }}
                />
              )
            )}
          </div>
          <span className="text-xs font-medium text-gray-600">+12</span>
          <span className="text-xs text-gray-400 ml-auto">
            faol o\u2019quvchilar
          </span>
        </div>

        {/* Budget bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Haftalik progress</span>
            <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>
              $7,548 / $24,000
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-amber bar-budget" />
          </div>
        </div>

        {/* Alert pill */}
        <div className="flex items-center gap-2 mb-4 bg-green-50 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-green-700 font-medium">
            Baholash testlari \u2014 99%
          </span>
        </div>

        {/* Weekly recommendations */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-700">
              Haftalik tavsiyalar
            </span>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-semibold">
              A
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-600">Styling dars</span>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bar-styling"
                  style={{ background: "#c4703a" }}
                />
              </div>
              <span className="text-xs text-gray-500 mt-0.5">72%</span>
            </div>
            <div>
              <span className="text-xs text-gray-600">Brand kit</span>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bar-brand"
                  style={{ background: "#2c4a3e" }}
                />
              </div>
              <span className="text-xs text-gray-500 mt-0.5">45%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating pill */}
      <div className="absolute -bottom-5 left-6 flex items-center gap-2.5 card-white rounded-full px-4 py-2.5 shadow-card hero-pill-float">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="10" fill="#2c4a3e" />
          <path
            d="M7 10l2 2 4-4"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Mentor bilan bog\u2019laning
        </span>
      </div>
    </div>
  );
}

const STATS = [
  { label: "Mentor sessiyalar", value: "24+", num: 24, suffix: "+" },
  { label: "Tayyor shablonlar", value: "80", num: 80, suffix: "" },
  { label: "O\u2019quvchi bahosi", value: "4.9", num: 4.9, suffix: "" },
];

export default function Hero({ isAuthenticated }) {
  const rootRef = useRef(null);
  const badgeRef = useRef(null);
  const h1Ref = useRef(null);
  const subRef = useRef(null);
  const btnsRef = useRef(null);
  const statsRef = useRef(null);
  const rightRef = useRef(null);
  const countersRef = useRef([]);

  useEffect(() => {
    let ctx;
    import("gsap").then(({ default: gsap }) => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: 14, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5 }
        );

        const chars = h1Ref.current?.querySelectorAll(".char");
        if (chars?.length) {
          tl.fromTo(
            chars,
            { opacity: 0, y: "110%", rotateX: -45 },
            { opacity: 1, y: "0%", rotateX: 0, duration: 0.65, stagger: 0.014 },
            "-=0.25"
          );
        }

        tl.fromTo(
          subRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.35"
        );
        tl.fromTo(
          btnsRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.45 },
          "-=0.3"
        );
        tl.fromTo(
          statsRef.current?.children ?? [],
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 },
          "-=0.25"
        );
        tl.fromTo(
          rightRef.current,
          { opacity: 0, x: 50, scale: 0.94 },
          { opacity: 1, x: 0, scale: 1, duration: 0.85, ease: "power3.out" },
          0.2
        );

        // Counters
        countersRef.current.forEach((el, i) => {
          if (!el) return;
          const s = STATS[i];
          if (!s) return;
          const isFloat = !Number.isInteger(s.num);
          gsap.fromTo(
            el,
            { innerText: 0 },
            {
              innerText: s.num,
              duration: 1.8,
              delay: 0.7 + i * 0.1,
              ease: "power2.out",
              snap: isFloat ? { innerText: 0.1 } : { innerText: 1 },
              onUpdate() {
                const v = parseFloat(el.innerText);
                el.innerText =
                  (isFloat ? v.toFixed(1) : Math.round(v)) + s.suffix;
              },
            }
          );
        });
      }, rootRef);
    });

    return () => ctx?.revert();
  }, []);

  const words = [
    { text: "Moodboarddan", gold: false },
    { text: "bozorga", gold: false },
    { text: "qadar", gold: false },
    { text: "dizayn.", gold: true },
  ];

  return (
    <section
      ref={rootRef}
      className="relative flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-6 py-20 lg:py-32 max-w-7xl mx-auto overflow-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: heroStyles }} />

      {/* \u2500\u2500 Left \u2500\u2500 */}
      <div className="flex-1 max-w-2xl">
        {/* Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pink-100 bg-white/80 shadow-sm mb-6 opacity-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="8" fill="#ec4899" opacity="0.15" />
            <circle cx="8" cy="8" r="4" fill="#ec4899" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Premium fashion platform
          </span>
        </div>

        {/* Headline */}
        <h1
          ref={h1Ref}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          style={{ color: "var(--ink)" }}
        >
          {words.map((w, wi) => (
            <span key={wi} className="inline-block mr-3">
              <span
                className={`inline-block overflow-hidden ${
                  w.gold ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600" : ""
                }`}
              >
                {w.text.split("").map((ch, ci) => (
                  <span key={ci} className="char inline-block">
                    {ch}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h1>

        {/* Sub */}
        <p
          ref={subRef}
          className="text-lg text-gray-600 mb-8 max-w-lg opacity-0"
        >
          Kapsula kolleksiya, styling va vizual sotuv jarayonlarini bir ritmda
          o\u2019rgatadi. Interfeys yengil, tajriba premium \u2014 natija portfolioga
          tayyor.
        </p>

        {/* Buttons */}
        <div ref={btnsRef} className="flex flex-wrap gap-4 mb-10 opacity-0">
          <Link
            to={isAuthenticated ? "/kurslar" : "/register"}
            className="px-7 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            {isAuthenticated ? "Kurslarni ochish" : "Hozir boshlash"} \u2197
          </Link>
          <Link
            to="/kurslar"
            className="px-7 py-3 rounded-full border border-gray-200 bg-white font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Kurslarni ko\u2019rish
          </Link>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="flex gap-8 border-t border-gray-100 pt-6"
        >
          {STATS.map((s, i) => (
            <div key={s.label} className="opacity-0">
              <span className="text-xs uppercase tracking-wider text-gray-500">
                {s.label}
              </span>
              <span
                ref={(el) => (countersRef.current[i] = el)}
                className="mt-2 font-serif text-2xl font-semibold tabular-nums block"
                style={{ color: "var(--ink)" }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* \u2500\u2500 Right: mockup \u2500\u2500 */}
      <div ref={rightRef} className="flex-1 w-full max-w-lg opacity-0">
        <DashboardMockup />
      </div>
    </section>
  );
}
