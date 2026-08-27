import { useState } from "react";

export default function VideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative z-10 mb-16 px-6 py-6 sm:py-8">
      <div className="group relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 shadow-2xl">
        {!isPlaying ? (
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden p-6 text-white sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-sky-500/20 via-transparent to-blue-500/20 opacity-70" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label="Videoni tomosha qilish"
              className="group/btn relative z-10 flex h-16 w-16 transform items-center justify-center rounded-full border border-white/40 bg-white/20 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-sky-400/50 active:scale-95 sm:h-20 sm:w-20"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
              <svg
                className="relative z-10 h-7 w-7 translate-x-0.5 fill-white text-white sm:h-9 sm:w-9"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-black">
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              aria-label="Videoni yopish"
              className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/60 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/80"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <iframe
              className="h-full w-full"
              src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Designora Platforma Tanishuvi"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </section>
  );
}
