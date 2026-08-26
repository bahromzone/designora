import { useEffect, useState } from "react";
import Hero from "../components/Hero";
import VideoShowcase from "../components/VideoShowcase";
import { getFeaturedCourses, getPopularCourses } from "../lib/api";

const TOPICS = [
  "UI/UX",
  "Moda dizayni",
  "Brending",
  "Styling",
  "Grafik dizayn",
  "Interyer dizayn",
  "Illyustratsiya",
  "Tipografika",
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featuredData, popularData] = await Promise.all([
          getFeaturedCourses(),
          getPopularCourses(),
        ]);
        setFeatured(featuredData);
        setPopular(popularData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-purple selection:text-white transition-colors duration-300">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Platform Intro Video Showcase */}
      <VideoShowcase />

      {/* 3. Infinite Logo / Topic Marquee */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">
            Platformadagi yo'nalishlar
          </p>
        </div>
        <div className="flex select-none gap-8 overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center justify-around gap-12 text-slate-700 dark:text-slate-200 font-serif text-2xl font-bold">
            {TOPICS.map((topic, i) => (
              <span
                key={i}
                className="hover:text-brand-purple dark:hover:text-brand-purple transition-colors cursor-pointer"
              >
                {topic}
              </span>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 animate-marquee items-center justify-around gap-12 text-slate-700 dark:text-slate-200 font-serif text-2xl font-bold"
          >
            {TOPICS.map((topic, i) => (
              <span
                key={`repeat-${i}`}
                className="hover:text-brand-purple dark:hover:text-brand-purple transition-colors cursor-pointer"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Kurslar va boshqa qismlar davom etadi... */}
    </div>
  );
}
