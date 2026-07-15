import React, { useEffect, useRef, useState } from "react";

/* ── CSS Animations ── */
const engagementStyles = `
@keyframes marquee-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes marquee-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}
@keyframes bubble-float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-15px) translateX(10px); }
}
@keyframes bubble-float-alt {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-15px) translateX(-10px); }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in-right {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.marquee-left { animation: marquee-left 30s linear infinite; }
.marquee-right { animation: marquee-right 35s linear infinite; }
.bubble-float { animation: bubble-float 4s ease-in-out infinite; }
.bubble-float-alt { animation: bubble-float-alt 5s ease-in-out infinite; }
.bubble-float-slow { animation: bubble-float 6s ease-in-out infinite; animation-delay: 1s; }
.eng-reveal { opacity: 0; }
.eng-reveal.eng-visible { animation: fade-in-up 0.6s ease-out forwards; }
.eng-reveal-right { opacity: 0; }
.eng-reveal-right.eng-visible { animation: fade-in-right 0.6s ease-out 0.2s forwards; }
.eng-reveal-scale { opacity: 0; }
.eng-reveal-scale.eng-visible { animation: scale-in 0.7s ease-out forwards; }
.eng-story-1 { opacity: 0; }
.eng-story-1.eng-visible { animation: fade-in-up 0.5s ease-out forwards; }
.eng-story-2 { opacity: 0; }
.eng-story-2.eng-visible { animation: fade-in-up 0.5s ease-out 0.2s forwards; }
`;

// --- DUMMY DATA (UZBEK) ---
const REVIEWS = [
  {
    name: "Azizbek R.",
    role: "UI/UX Dizayner",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80",
    text: "Designora orqali dizaynni noldan o\u2019rgandim. Hozirda xalqaro kompaniyada ishlayapman! Muhit va mentorlar shunchaki ajoyib.",
  },
  {
    name: "Malika T.",
    role: "Frontend Dasturchi",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    text: "Amaliy loyihalar va portfolioga yo\u2019naltirilgan ta\u2019lim tizimi yoqdi. Platformaning vizual ko\u2019rinishi o\u2019rganishga ilhom beradi.",
  },
  {
    name: "Jamshid B.",
    role: "Art Direktor",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    text: "Kurslar sifati va tushuntirish darajasi MasterClass darajasida. Har bir dizayner uchun kerakli bo\u2019lgan baza bor bu yerda.",
  },
  {
    name: "Nigina M.",
    role: "Product Designer",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",
    text: "O\u2019quv jarayoni juda qiziqarli tuzilgan. Qotib qolgan nazariya emas, faqat bugungi kun trendlari va real keyslar.",
  },
  {
    name: "Sardor Q.",
    role: "Grafik Dizayner",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    text: "Hamjamiyat juda faol. O\u2019z savollarimga doim tezkor javob olaman. Karyeramni o\u2019zgartirishdagi eng to\u2019g\u2019ri tanlovim.",
  },
];

const SUCCESS_STORIES = [
  {
    name: "Zarina X.",
    before: "Boshlang\u2019ich",
    after: "Senior Product Designer",
    salary: "+150%",
    company: "EPAM Systems",
  },
  {
    name: "Diyor A.",
    before: "Sotuvchi",
    after: "UI/UX Dizayner",
    salary: "+200%",
    company: "Uzumbank",
  },
];

const BUBBLES = [
  "Zo\u2019r platforma! \uD83D\uDD25",
  "Mentorlar juda kuchli! \uD83C\uDF93",
  "10/10 Tavsiya qilaman \uD83C\uDF1F",
];

// --- ICONS ---
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.9)" />
    <path d="M19 15l14 9-14 9V15z" fill="#4f46e5" />
  </svg>
);

// --- Animated Counter via IntersectionObserver ---
function AnimatedNumber({ value, suffix = "", duration = 2000 }) {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * value);
            el.textContent = current.toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, suffix, duration, hasAnimated]);

  return <span ref={ref} className="text-3xl md:text-4xl font-bold text-slate-900">0{suffix}</span>;
}

// --- Scroll reveal hook ---
function useEngReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("eng-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );
    const targets = el.querySelectorAll(
      ".eng-reveal, .eng-reveal-right, .eng-reveal-scale, .eng-story-1, .eng-story-2"
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
  return ref;
}

// --- MAIN COMPONENT ---
export default function EngagementSection() {
  const sectionRef = useEngReveal();

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: engagementStyles }} />

      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* HEADER & STATS */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div className="eng-reveal max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-500 mb-3 block">
              Muvaffaqiyatlarimiz
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              Bizning natijalarimiz &mdash;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                talabalarimiz yutug\u2019i.
              </span>
            </h2>
          </div>

          <div className="eng-reveal-right flex flex-wrap gap-8">
            {[
              { label: "Faol talabalar", value: 10000, suffix: "+" },
              { label: "Premium kurslar", value: 120, suffix: "+" },
              { label: "Ishga joylashish", value: 95, suffix: "%" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIAL MARQUEE */}
        <div className="relative mb-16">
          {/* Fade overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Row 1 */}
          <div className="overflow-hidden mb-6">
            <div className="flex gap-6 w-max marquee-left">
              {[...REVIEWS, ...REVIEWS].map((review, i) => (
                <div key={i} className="w-[350px] flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={review.image} alt={review.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{review.name}</p>
                      <p className="text-xs text-gray-500">{review.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, j) => <StarIcon key={j} />)}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 */}
          <div className="overflow-hidden">
            <div className="flex gap-6 w-max marquee-right">
              {[...REVIEWS, ...REVIEWS].reverse().map((review, i) => (
                <div key={i} className="w-[350px] flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={review.image} alt={review.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{review.name}</p>
                      <p className="text-xs text-gray-500">{review.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, j) => <StarIcon key={j} />)}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* SUCCESS STORIES */}
          <div className="lg:col-span-2 relative space-y-6">
            {/* Floating Bubbles */}
            {BUBBLES.map((bubble, i) => (
              <div
                key={i}
                className={`absolute px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-gray-100 text-xs font-bold text-slate-600 z-0
                  ${i === 0 ? "-top-10 left-10 bubble-float" : ""}
                  ${i === 1 ? "top-1/2 -right-5 bubble-float-alt" : ""}
                  ${i === 2 ? "-bottom-5 left-1/4 bubble-float-slow" : ""}
                `}
              >
                {bubble}
              </div>
            ))}

            <h3 className="text-xl font-bold text-slate-900 mb-4 relative z-10">
              Karyera o\u2019sishi
            </h3>

            {SUCCESS_STORIES.map((story, i) => (
              <div
                key={i}
                className={`eng-story-${i + 1} relative z-10 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-6 group hover:border-indigo-100 transition-colors`}
              >
                <div className="flex-1">
                  <p className="font-bold text-slate-800 mb-2">{story.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">{story.before}</span>
                    <span className="text-indigo-400">&rarr;</span>
                    <span className="font-semibold text-indigo-600">{story.after}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-500">{story.salary}</span>
                  <p className="text-xs text-gray-500">{story.company}</p>
                </div>
              </div>
            ))}
          </div>

          {/* VIDEO TESTIMONIAL */}
          <div className="eng-reveal-scale lg:col-span-3 relative h-[400px] lg:h-[500px] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-2xl shadow-indigo-500/10">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80"
              alt="Video testimonial"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                <PlayIcon />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8">
              <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
                Muvaffaqiyat Hikoyasi
              </span>
              <h3 className="text-white text-xl font-bold mt-2">
                &ldquo;Oddiy qiziqishdan, xalqaro darajadagi mutaxassisgacha&rdquo;
              </h3>
              <p className="text-gray-300 text-sm mt-2 max-w-md">
                Designora platformasida ta\u2019lim olgan Jasurning shaxsiy
                hikoyasini tomosha qiling va o\u2019z karyerangizni boshlash uchun
                ilhom oling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
