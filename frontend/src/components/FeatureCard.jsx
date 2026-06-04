import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FeatureCard({ icon, title, description, eyebrow, index = 0 }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.65, ease: "power3.out",
          delay: index * 0.1,
          scrollTrigger: { trigger: card, start: "top 88%", once: true },
        }
      );
    });

    return () => ctx.revert();
  }, [index]);

  return (
    <article
      ref={cardRef}
      className="card-white group rounded-2xl p-6 opacity-0 hover:-translate-y-1 transition-transform duration-300"
    >
      {/* Icon */}
      <div
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--ink)",
        }}
      >
        {icon}
      </div>

      {/* Eyebrow */}
      <p className="label mb-2">{eyebrow}</p>

      {/* Title */}
      <h3 className="font-serif text-2xl font-semibold text-ink leading-tight mb-3">
        {title}
      </h3>

      {/* Desc */}
      <p className="text-sm leading-7" style={{ color: "var(--ink-60)" }}>
        {description}
      </p>
    </article>
  );
}