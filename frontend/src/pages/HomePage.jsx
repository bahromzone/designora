import { motion } from "framer-motion";
import EngagementSection from "../components/EngagementSection";
import WaveAnimation from "../components/WaveAnimation";

const COURSES = [
  { title: "Advanced UI/UX Systems", instructor: "Elena R.", rating: 4.9, tags: "Design", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80" },
  { title: "Full-Stack Next.js Pro", instructor: "David C.", rating: 4.8, tags: "Code", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80" },
  { title: "Growth Marketing 101", instructor: "Sarah J.", rating: 5.0, tags: "Business", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" }
];

// Premium Apple-style easing curve for smooth animations
const premiumEasing = [0.16, 1, 0.3, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: premiumEasing }
  }
};

const fadeUpSmall = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: premiumEasing }
  }
};

export default function HomePage() {
  return (
    <div className="w-full bg-[var(--bg-light)] relative">

      {/* STRIPE-STYLE FLOATING MOTION ANIMATION KEYFRAMES */}
      <style>{`
        @keyframes stripe-float {
          0%, 100% {
            transform: translate(0px, 0px) rotate(35deg);
          }
          50% {
            transform: translate(45px, 40px) rotate(50deg);
          }
        }
        .animate-stripe {
          animation: stripe-float 20s ease-in-out infinite;
        }
      `}</style>

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden px-6 pt-20">

        {/* Stripe-style Floating Gradient Wave Animation */}
        {/* Positioning: top right, scaled up, rotated, with negative margin to overflow */}
        <div className="absolute top-0 right-0 w-[120%] h-[120%] -mr-[30%] -mt-[25%] pointer-events-none z-0 scale-110 animate-stripe">
          <WaveAnimation />
        </div>

        {/* Subtle background blob (apple style) */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[-10%] w-[40rem] h-[40rem] bg-pink-400/10 blur-[120px] rounded-full pointer-events-none z-0"
        />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeUp} className="inline-block px-4 py-1.5 rounded-full border border-pink-100 bg-white shadow-sm mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">
                The Future of Education
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">
              Master your craft with <br/>
              {/* Flowing animated gradient text (stripe like) */}
              <motion.span
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="bg-[length:200%_auto] text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 inline-block pb-2"
              >
                Designora.
              </motion.span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
              Stop watching generic tutorials. Learn from industry leaders who have built unicorn startups through immersive, cinematic masterclasses.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* Premium Apple-style Hover Button */}
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(15,23,42,0.3)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative px-8 py-4 rounded-full bg-slate-900 text-white font-bold text-lg overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">Start Learning Now</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "#f8fafc" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="px-8 py-4 rounded-full glass-panel text-slate-900 font-bold text-lg transition-colors"
              >
                Explore Curriculum
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 flex items-center justify-center lg:justify-start gap-8 border-t border-gray-200 pt-8">
              <div>
                <p className="text-3xl font-bold text-slate-900">12,000+</p>
                <p className="text-sm text-slate-500 font-medium">Active Students</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-3xl font-bold text-slate-900">4.9/5</p>
                <p className="text-sm text-slate-500 font-medium">Average Rating</p>
              </div>
            </motion.div>
          </motion.div>


        </div>
      </section>

      {/* 2. TRUST LOGOS */}
      <section className="border-y border-gray-200/60 bg-white/40 py-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1 }}
          className="max-w-7xl mx-auto px-6 text-center"
        >
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6">Our students work at</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-40 grayscale font-serif text-2xl md:text-3xl font-bold text-slate-800">
            {["Stripe", "Spotify", "Vercel", "Linear", "Airbnb"].map((logo, i) => (
              <motion.span
                key={logo}
                whileHover={{ scale: 1.05, opacity: 0.8 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer"
              >
                {logo}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 3. FEATURED COURSES */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="flex justify-between items-end mb-16 gap-4"
        >
          <motion.div variants={fadeUpSmall}>
            <p className="text-sm font-bold uppercase tracking-widest text-pink-600 mb-2">Featured Programs</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 max-w-lg leading-tight">
              Cinematic learning, <br/> practical results.
            </h2>
          </motion.div>
          <motion.button
            variants={fadeUpSmall}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-full glass-panel text-slate-900 font-bold text-sm"
          >
            View All Courses
          </motion.button>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {COURSES.map((course) => (
            <motion.div
              key={course.title}
              variants={fadeUpSmall}
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 group cursor-pointer shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-400"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
              </div>
              <div className="p-6">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{course.tags}</span>
                <h3 className="font-bold text-slate-900 text-lg mt-2 mb-1 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{course.instructor}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <p className="text-slate-900 font-bold">Free Trial</p>
                  <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1 rounded-full text-yellow-600">
                    <span className="text-sm font-bold">{course.rating.toFixed(1)}</span>
                    <span className="text-xs">⭐</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <EngagementSection />

      {/* Cinematic Call to Action */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative">
         <style>{`
            .cta-glass {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.4);
                box-shadow: 0 40px 100px rgba(79, 70, 229, 0.1);
            }
        `}</style>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: premiumEasing }}
          className="cta-glass rounded-[32px] p-12 md:p-20 text-center relative overflow-hidden"
        >
           <motion.div
              animate={{ x: [0, -40, 40, 0], y: [0, 40, -40, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-200/20 blur-[100px] rounded-full"
            />
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight max-w-2xl mx-auto relative z-10">
            Elevate your digital education <br/> with a cinematic experience.
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-md mx-auto relative z-10">
            Join thousands of professionals mastering new skills through immersive learning.
          </p>
          <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(15,23,42,0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="relative px-8 py-4 rounded-full bg-slate-900 text-white font-bold text-lg relative z-10 shadow-lg group overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <span className="relative z-10">Get Full Access</span>
          </motion.button>
        </motion.div>
      </section>

    </div>
  );
}