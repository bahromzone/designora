import { useState } from "react";
import { Play, X } from "lucide-react";

export default function VideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative z-10 -mt-6 mb-16 px-6 sm:-mt-10">
      <div className="group relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-2xl">
        {!isPlaying ? (
          <div className="relative flex aspect-video w-full flex-col justify-between overflow-hidden p-6 text-white sm:p-10 md:p-14">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-violet-600/30 via-transparent to-blue-600/30 opacity-70" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-purple-200 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Platforma bilan tanishuv
              </div>
            </div>

            <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label="Videoni tomosha qilish"
                className="group/btn relative flex h-20 w-20 transform items-center justify-center rounded-full border border-white/40 bg-white/20 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-purple-400/50 active:scale-95 sm:h-24 sm:w-24"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                <Play className="relative z-10 h-8 w-8 translate-x-0.5 fill-white text-white sm:h-10 sm:w-10" />
              </button>
              <h3 className="mt-6 max-w-2xl text-2xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-3xl md:text-4xl">
                Designora platformasi bilan 1 daqiqada tanishing
              </h3>
              <p className="mt-2 max-w-lg text-sm text-slate-300 sm:text-base">
                Darslar qanday o‘tiladi, mentorlik jarayoni va amaliy loyihalar
                ustida ishlash tartibi
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 backdrop-blur-md">
                <span>Davomiyligi:</span>
                <span className="font-semibold text-white">1:20 daqiqa</span>
              </div>
              <span className="hidden text-slate-400 sm:inline-block">
                Interaktiv darslar &bull; Real vaqtda mentorlik
              </span>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-black">
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              aria-label="Videoni yopish"
              className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/60 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/80"
            >
              <X className="h-5 w-5" />
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
