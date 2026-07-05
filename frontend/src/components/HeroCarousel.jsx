import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { fashionImages } from "../data/fashionImages";

function HeroCarousel() {
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % fashionImages.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const nextIndex = (activeIndex + 1) % fashionImages.length;
    const image = new Image();
    image.src = fashionImages[nextIndex].url;
  }, [activeIndex]);

  const activeSlide = fashionImages[activeIndex];

  return (
    <section className="section-shell">
      <div className="relative min-h-[88vh] overflow-hidden rounded-[2rem] bg-brand-ink shadow-soft">
        <div className="absolute inset-0">
          {fashionImages.map((item, index) => (
            <div
              key={item.url}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${item.url})`,
                opacity: index === activeIndex ? 1 : 0,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,13,10,0.84)_0%,rgba(17,13,10,0.35)_42%,rgba(17,13,10,0.12)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,145,93,0.32),transparent_24%)]" />
        </div>

        <div className="relative z-10 flex min-h-[88vh] flex-col justify-end px-6 pb-10 pt-32 sm:px-10 lg:px-14 lg:pb-14">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm uppercase tracking-[0.36em] text-white/72">
              {activeSlide.eyebrow}
            </p>
            <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-[0.92] text-white sm:text-6xl lg:text-7xl">
              {activeSlide.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/76 sm:text-lg">
              {activeSlide.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={isAuthenticated ? "/kurslar" : "/royxatdan-otish"}
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-ink transition hover:-translate-y-0.5"
              >
                Boshlash
              </Link>
              <a
                href="#kurslar"
                className="inline-flex items-center justify-center rounded-full border border-white/24 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Kurslarni ko'rish
              </a>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
            <div className="glass-panel max-w-xl rounded-[1.75rem] px-6 py-5 text-white/88 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Tanlangan tajriba
              </p>
              <p className="mt-3 text-lg leading-8">
                Har bir modul real kolleksiya, styling va vizual sotuvga
                yo'naltirilgan.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {fashionImages.map((item, index) => (
                <button
                  key={item.url}
                  type="button"
                  aria-label={`${index + 1}-slayd`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-10 bg-white"
                      : "w-2.5 bg-white/45"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroCarousel;
