import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";

/* ── Dashboard Mockup (right side) ─────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="relative w-full max-w-[28rem] mx-auto"
      style={{ filter: "drop-shadow(0 32px 80px rgba(26,18,8,0.18))" }}
    >
      {/* Main card */}
      <motion.div
        className="card-white rounded-2xl p-5 overflow-hidden"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted">
              Kurslar
            </p>
            <p className="font-serif text-lg font-semibold text-ink mt-0.5">
              Har darajaga mos
            </p>
          </div>
          {/* Toggle pill */}
          <div className="flex h-8 w-16 items-center rounded-full bg-amber p-1">
            <div className="h-6 w-6 rounded-full bg-white shadow-sm ml-auto" />
          </div>
        </div>

        {/* Avatar row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2">
            {["#c4703a", "#2c4a3e", "#8b6f5e", "#4a7c6e", "#d4956e"].map(
              (c, i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-white"
                  style={{ background: c }}
                />
              )
            )}
            <div className="h-7 w-7 rounded-full border-2 border-white bg-surface flex items-center justify-center text-[9px] font-bold text-muted">
              +12
            </div>
          </div>
          <p className="text-xs text-muted ml-1">faol o'quvchilar</p>
        </div>

        {/* Budget bar */}
        <div className="rounded-xl bg-surface p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Haftalik progress</p>
            <p className="text-xs font-bold text-ink">
              $7,548 <span className="text-muted font-normal">/ $24,000</span>
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink/08 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber"
              initial={{ width: 0 }}
              animate={{ width: "32%" }}
              transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Alert pill */}
        <div className="flex items-center gap-2 rounded-full bg-amber/10 px-3 py-1.5 mb-4 w-fit">
          <div className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
          <p className="text-xs font-semibold text-amber">
            Baholash testlari — 99%
          </p>
        </div>

        {/* Weekly recommendations */}
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-ink">
              Haftalik tavsiyalar
            </p>
            <div className="h-5 w-5 rounded bg-amber flex items-center justify-center text-white text-[10px] font-bold">
              A
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Styling dars", pct: 72, color: "#c4703a" },
              { label: "Brand kit", pct: 45, color: "#2c4a3e" },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex items-center gap-3">
                <p className="text-xs text-muted w-20 shrink-0">{label}</p>
                <div className="flex-1 h-1.5 rounded-full bg-ink/06 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs font-semibold text-ink tabular-nums">
                  {pct}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Report a Bug / floating pill */}
      <motion.div
        className="absolute -bottom-5 left-6 flex items-center gap-2.5 card-white rounded-full px-4 py-2.5 shadow-card"
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      >
        <div className="h-7 w-7 rounded-full bg-ink flex items-center justify-center">
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M8 2a2 2 0 0 1 2 2v4a2 2 0 1 1-4 0V4a2 2 0 0 1 2-2Z" />
            <circle cx="8" cy="13" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-ink">
          Mentor bilan bog'laning
        </p>
      </motion.div>
    </div>
  );
}

const STATS = [
  { label: "Mentor sessiyalar", value: "24+", num: 24, suffix: "+" },
  { label: "Tayyor shablonlar", value: "80", num: 80, suffix: "" },
  { label: "O'quvchi bahosi", value: "4.9", num: 4.9, suffix: "" },
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
    const ctx = gsap.context(() => {
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

    return () => ctx.revert();
  }, []);

  const words = [
    { text: "Moodboarddan", gold: false },
    { text: "bozorga", gold: false },
    { text: "qadar", gold: false },
    { text: "dizayn.", gold: true },
  ];

  return (
    <section ref={rootRef} className="shell pt-12 pb-20 sm:pt-20 sm:pb-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
        {/* ── Left ── */}
        <div className="max-w-2xl">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold opacity-0"
            style={{
              background: "var(--amber-10)",
              border: "1px solid var(--amber-20)",
              color: "var(--amber)",
              letterSpacing: "0.06em",
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-amber opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-amber" />
            </span>
            Premium fashion platform
          </div>

          {/* Headline */}
          <h1
            ref={h1Ref}
            className="mt-6 font-serif font-semibold text-ink"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 5rem)",
              lineHeight: 0.94,
              letterSpacing: "-0.02em",
              perspective: "600px",
            }}
          >
            {words.map((w, wi) => (
              <span
                key={wi}
                className={`mr-[0.18em] inline-block ${wi === 2 ? "sketch-underline" : ""}`}
                style={{ overflow: "hidden", paddingBottom: "0.06em" }}
              >
                <span style={{ color: w.gold ? "var(--amber)" : "var(--ink)" }}>
                  {w.text.split("").map((ch, ci) => (
                    <span key={ci} className="char">
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
            className="mt-6 max-w-lg text-base leading-8 opacity-0"
            style={{ color: "var(--ink-60)" }}
          >
            Kapsula kolleksiya, styling va vizual sotuv jarayonlarini bir ritmda
            o'rgatadi. Interfeys yengil, tajriba premium — natija portfolioga
            tayyor.
          </p>

          {/* Buttons */}
          <div
            ref={btnsRef}
            className="mt-8 flex flex-wrap items-center gap-3 opacity-0"
          >
            <Link
              to={isAuthenticated ? "/kurslar" : "/royxatdan-otish"}
              className="btn-primary"
            >
              {isAuthenticated ? "Kurslarni ochish" : "Hozir boshlash"} ↗
            </Link>
            <a href="#kurslar" className="btn-outline">
              Kurslarni ko'rish
            </a>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="card rounded-2xl px-4 py-4 hover:-translate-y-0.5 transition-transform"
              >
                <p className="label">{s.label}</p>
                <p
                  ref={(el) => (countersRef.current[i] = el)}
                  className="mt-2 font-serif text-2xl font-semibold tabular-nums"
                  style={{ color: "var(--ink)" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: mockup ── */}
        <div ref={rightRef} className="hidden lg:block opacity-0 pb-8">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
