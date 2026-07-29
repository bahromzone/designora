import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import EngagementSection from "../components/EngagementSection";
import RecommendationSection from "../components/RecommendationSection";
import WaveAnimation from "../components/WaveAnimation";
import { discoveryApi } from "../lib/api";

const premiumEasing = [0.16, 1, 0.3, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEasing } },
};

export default function HomePage() {
  return (
    <div className="w-full bg-[var(--bg-light)] relative">
      <style>{`@keyframes stripe-float { 0%, 100% { transform: translate(0px, 0px) rotate(35deg); } 50% { transform: translate(45px, 40px) rotate(50deg); } } .animate-stripe { animation: stripe-float 20s ease-in-out infinite; }`}</style>

      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute top-0 right-0 w-[120%] h-[120%] -mr-[30%] -mt-[25%] pointer-events-none z-0 scale-110 animate-stripe"><WaveAnimation /></div>
        <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute top-[10%] left-[-10%] w-[40rem] h-[40rem] bg-pink-400/10 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-center lg:text-left">
            <motion.div variants={fadeUp} className="inline-block px-4 py-1.5 rounded-full border border-pink-100 bg-white shadow-sm mb-6"><span className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">Ta'limning kelajagi</span></motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900">Mahoratingizni yuksaltiring <br /><motion.span animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="bg-[length:200%_auto] text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 inline-block pb-2">Designora.</motion.span></motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">Oddiy videodarslarni unuting. Soha yetakchilaridan kinematik sifatdagi jonli masterklasslar orqali amaliy bilim oling.</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/?modal=signup"><motion.span whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(124,58,237,0.45)" }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3, ease: "easeOut" }} className="relative inline-block px-8 py-4 rounded-full text-white font-bold text-lg overflow-hidden group bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"><span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" /><span className="relative z-10">Hozir boshlash</span></motion.span></Link>
              <Link to="/kurslar"><motion.span whileHover={{ scale: 1.03, backgroundColor: "#f8fafc" }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3, ease: "easeOut" }} className="inline-block px-8 py-4 rounded-full glass-panel text-slate-900 font-bold text-lg transition-colors">Kurslarni ko'rish</motion.span></Link>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 flex items-center justify-center lg:justify-start gap-8 border-t border-gray-200 pt-8"><div><p className="text-3xl font-bold text-slate-900">12,000+</p><p className="text-sm text-slate-500 font-medium">Faol o'quvchilar</p></div><div className="w-px h-10 bg-gray-200" /><div><p className="text-3xl font-bold text-slate-900">4.9/5</p><p className="text-sm text-slate-500 font-medium">O'rtacha baho</p></div></motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-gray-200/60 bg-white/40 py-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 1 }} className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6">Platformadagi yo'nalishlar</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-40 grayscale font-serif text-2xl md:text-3xl font-bold text-slate-800">{["UI/UX", "Moda dizayni", "Brending", "Styling", "Grafik dizayn"].map((logo) => <motion.span key={logo} whileHover={{ scale: 1.05, opacity: 0.8 }} transition={{ duration: 0.2 }} className="cursor-pointer">{logo}</motion.span>)}</div>
        </motion.div>
      </section>

      <EngagementSection />

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <RecommendationSection title="Ko'p sotilgan kurslar" subtitle="O'quvchilar eng ko'p tanlagan dasturlar" fetcher={() => discoveryApi.bestselling(6)} limit={3} />
      </section>

      <section className="py-32 px-6 max-w-7xl mx-auto relative">
        <style>{`.cta-glass { background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 40px 100px rgba(79, 70, 229, 0.1); }`}</style>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: premiumEasing }} className="cta-glass rounded-[32px] p-12 md:p-20 text-center relative overflow-hidden">
          <motion.div animate={{ x: [0, -40, 40, 0], y: [0, 40, -40, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-200/20 blur-[100px] rounded-full" />
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight max-w-2xl mx-auto relative z-10">Raqamli ta'limingizni <br /> yangi bosqichga olib chiqing.</h2>
          <p className="text-lg text-slate-600 mb-10 max-w-md mx-auto relative z-10">Minglab mutaxassislar qatoriga qo'shiling va yangi ko'nikmalarni chuqur amaliyot orqali egallang.</p>
          <Link to="/?modal=signup" className="relative z-10 inline-block"><motion.span whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(124,58,237,0.45)" }} whileTap={{ scale: 0.98 }} className="relative inline-block px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg group overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"><span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" /><span className="relative z-10">To'liq kirish olish</span></motion.span></Link>
        </motion.div>
      </section>
    </div>
  );
}
