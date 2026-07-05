import React, { useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";

// --- DUMMY DATA (UZBEK) ---
const REVIEWS = [
  {
    name: "Azizbek R.",
    role: "UI/UX Dizayner",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80",
    text: "Designora orqali dizaynni noldan o'rgandim. Hozirda xalqaro kompaniyada ishlayapman! Muhit va mentorlar shunchaki ajoyib.",
  },
  {
    name: "Malika T.",
    role: "Frontend Dasturchi",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    text: "Amaliy loyihalar va portfolioga yo'naltirilgan ta'lim tizimi yoqdi. Platformaning vizual ko'rinishi o'rganishga ilhom beradi.",
  },
  {
    name: "Jamshid B.",
    role: "Art Direktor",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    text: "Kurslar sifati va tushuntirish darajasi MasterClass darajasida. Har bir dizayner uchun kerakli bo'lgan baza bor bu yerda.",
  },
  {
    name: "Nigina M.",
    role: "Product Designer",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",
    text: "O'quv jarayoni juda qiziqarli tuzilgan. Qotib qolgan nazariya emas, faqat bugungi kun trendlari va real keyslar.",
  },
  {
    name: "Sardor Q.",
    role: "Grafik Dizayner",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    text: "Hamjamiyat juda faol. O'z savollarimga doim tezkor javob olaman. Karyeramni o'zgartirishdagi eng to'g'ri tanlovim.",
  },
];

const SUCCESS_STORIES = [
  {
    name: "Zarina X.",
    before: "Boshlang'ich",
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
  "Zo’r platforma! 🔥",
  "Mentorlar juda kuchli! 🎓",
  "10/10 Tavsiya qilaman 🌟",
  "Karyeram o'zgardi 🚀",
  "Dizayn super 🎨",
];

// --- ICONS ---
const StarIcon = () => (
  <svg
    className="w-4 h-4 text-amber-400"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const PlayIcon = () => (
  <svg
    className="w-8 h-8 text-white ml-1"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

// --- COMPONENT: ANIMATED NUMBER ---
function AnimatedNumber({ value, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        ease: "easeOut",
        onUpdate(v) {
          if (ref.current) {
            ref.current.textContent = Math.floor(v).toLocaleString() + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [isInView, value, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
}

// --- MAIN COMPONENT ---
export default function EngagementSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#F8F9FB] py-24 sm:py-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-br from-pink-300/20 via-purple-300/20 to-indigo-300/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* HEADER & STATS */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-sm font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500 uppercase mb-4">
              Muvaffaqiyatlarimiz
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Bizning natijalarimiz — <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                talabalarimiz yutug'i.
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-8"
          >
            {[
              { label: "Faol talabalar", value: 10000, suffix: "+" },
              { label: "Premium kurslar", value: 120, suffix: "+" },
              { label: "Ishga joylashish", value: 95, suffix: "%" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tighter">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-sm text-slate-500 font-medium mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* TESTIMONIAL CAROUSEL (MARQUEE) */}
      <div className="relative flex flex-col gap-6 w-full overflow-hidden pb-10">
        {/* Left/Right Fade Overlays */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#F8F9FB] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#F8F9FB] to-transparent z-10" />

        {/* First Row - Moving Left */}
        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          {[...REVIEWS, ...REVIEWS].map((review, i) => (
            <div
              key={`row1-${i}`}
              className="w-[380px] shrink-0 bg-white/70 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 group cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-5">
                <img
                  src={review.image}
                  alt={review.name}
                  className="w-14 h-14 rounded-full object-cover shadow-sm group-hover:ring-2 ring-purple-400 ring-offset-2 transition-all"
                />
                <div>
                  <h4 className="font-bold text-slate-900">{review.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {review.role}
                  </p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                "{review.text}"
              </p>
            </div>
          ))}
        </motion.div>

        {/* Second Row - Moving Right */}
        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 35 }}
        >
          {[...REVIEWS, ...REVIEWS].reverse().map((review, i) => (
            <div
              key={`row2-${i}`}
              className="w-[380px] shrink-0 bg-white/70 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 group cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-5">
                <img
                  src={review.image}
                  alt={review.name}
                  className="w-14 h-14 rounded-full object-cover shadow-sm group-hover:ring-2 ring-indigo-400 ring-offset-2 transition-all"
                />
                <div>
                  <h4 className="font-bold text-slate-900">{review.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {review.role}
                  </p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                "{review.text}"
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-20">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* SUCCESS STORIES (Left: 2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6 relative">
            {/* Floating Bubbles Background Effect */}
            {BUBBLES.map((bubble, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -15, 0],
                  x: [0, i % 2 === 0 ? 10 : -10, 0],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
                className={`absolute px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-gray-100 text-xs font-bold text-slate-600 z-0
                  ${i === 0 ? "-top-10 left-10" : ""}
                  ${i === 1 ? "top-1/2 -right-5" : ""}
                  ${i === 2 ? "-bottom-5 left-1/4" : ""}
                  ${i > 2 ? "hidden" : ""}
                `}
              >
                {bubble}
              </motion.div>
            ))}

            <h3 className="text-2xl font-bold text-slate-900 mb-2 relative z-10">
              Karyera o'sishi
            </h3>

            {SUCCESS_STORIES.map((story, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative z-10 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-6 group hover:border-indigo-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 mb-1">
                    {story.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-500 line-through decoration-slate-300">
                      {story.before}
                    </span>
                    <svg
                      className="w-4 h-4 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      ></path>
                    </svg>
                    <span className="text-sm font-bold text-slate-900">
                      {story.after}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                  <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      ></path>
                    </svg>
                    {story.salary}
                  </div>
                  <p className="text-xs font-bold text-slate-400">
                    {story.company}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* VIDEO TESTIMONIAL (Right: 3 Cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 relative h-[400px] lg:h-[500px] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-2xl shadow-indigo-500/10"
          >
            {/* Video Thumbnail */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80')`,
              }}
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

            {/* Play Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/30 group-hover:bg-white/30 transition-colors duration-300">
                <div className="absolute inset-0 rounded-full border border-white/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <PlayIcon />
              </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-widest uppercase mb-4">
                Muvaffaqiyat Hikoyasi
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                "Oddiy qiziqishdan, <br /> xalqaro darajadagi mutaxassisgacha"
              </h3>
              <p className="text-white/70 text-sm md:text-base max-w-lg">
                Designora platformasida ta'lim olgan Jasurning shaxsiy
                hikoyasini tomosha qiling va o'z karyerangizni boshlash uchun
                ilhom oling.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
