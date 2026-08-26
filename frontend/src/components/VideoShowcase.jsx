import { useState } from "react";
import { Play, X } from "lucide-react";

export default function VideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-16">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 group">
        {!isPlaying ? (
          <div className="relative aspect-video w-full flex flex-col justify-between p-6 sm:p-10 md:p-14 text-white overflow-hidden">
            {/* Background glowing gradients & decorative pattern */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/40 via-transparent to-blue-600/30 opacity-70 pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top header within video banner */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide uppercase text-purple-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Platforma bilan tanishuv
              </div>
            </div>

            {/* Middle Play Button */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label="Videoni tomosha qilish"
                className="group/btn relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-400/50"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <Play className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 text-white fill-white translate-x-0.5" />
              </button>
              <h3 className="mt-6 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white max-w-2xl drop-shadow-md">
                Designora platformasi bilan 1 daqiqada tanishing
              </h3>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-lg">
                Darslar qanday o‘tiladi, mentorlik jarayoni va amaliy loyihalar ustida ishlash tartibi
              </p>
            </div>

            {/* Bottom floating preview badge */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                <span>Davomiyligi:</span>
                <span className="font-semibold text-white">1:20 daqiqa</span>
              </div>
              <span className="hidden sm:inline-block text-slate-400">Interaktiv darslar &bull; Real vaqtda mentorlik</span>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-black">
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              aria-label="Videoni yopish"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              className="w-full h-full"
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
