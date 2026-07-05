import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CourseCard({ course, index = 0 }) {
  const cardRef = useRef(null);
  const imgRef  = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { opacity: 0, y: 48, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out",
          delay: index * 0.12,
          scrollTrigger: { trigger: card, start: "top 88%", once: true },
        }
      );

      const enter = () => gsap.to(imgRef.current, { scale: 1.06, duration: 0.6, ease: "power2.out" });
      const leave = () => gsap.to(imgRef.current, { scale: 1,    duration: 0.6, ease: "power2.out" });

      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
      return () => {
        card.removeEventListener("mouseenter", enter);
        card.removeEventListener("mouseleave", leave);
      };
    });

    return () => ctx.revert();
  }, [index]);

  return (
    <article
      ref={cardRef}
      className="card-white group overflow-hidden rounded-2xl opacity-0 hover:-translate-y-1 transition-transform duration-300"
      style={{ boxShadow: "0 4px 24px rgba(26,18,8,0.08)" }}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        <img
          ref={imgRef}
          src={course.image_url}
          alt={course.title}
          className="h-full w-full object-cover"
          style={{ willChange: "transform" }}
        />
        {/* Overlay badges */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          <span
            className="rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-widest"
            style={{ background: "rgba(250,248,244,0.88)", color: "var(--ink)", backdropFilter: "blur(8px)" }}
          >
            {course.level}
          </span>
          <span
            className="rounded-full px-3 py-1 text-[0.62rem] font-semibold"
            style={{ background: "var(--amber)", color: "#fff" }}
          >
            {course.duration}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <p className="label mb-1.5">Maxsus yo'nalish</p>
          <h3 className="font-serif text-2xl font-semibold text-ink leading-snug">
            {course.title}
          </h3>
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--amber)" }}>
            {course.subtitle}
          </p>
        </div>

        <p className="text-sm leading-7" style={{ color: "var(--ink-60)" }}>
          {course.description}
        </p>

        <div
          className="flex items-center justify-between border-t pt-4 text-xs font-medium uppercase tracking-widest"
          style={{ borderColor: "var(--border)" }}
        >
          <span style={{ color: "var(--muted)" }}>{course.lessons} dars</span>
          <span
            className="flex items-center gap-1 transition-colors"
            style={{ color: "var(--amber)" }}
          >
            Batafsil
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5h9M8 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}