import { useEffect, useRef, useState } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Yengil, mustaqil video pleyer (tashqi kutubxonasiz).
 * - Tezlikni boshqarish (0.75x–2x)
 * - "Davom ettirish" — ko'rilgan joyni localStorage'da saqlaydi
 * - Tugagach onEnded orqali darsni avtomatik belgilash imkoni
 */
export default function VideoPlayer({ src, storageKey, onEnded, poster }) {
  const videoRef = useRef(null);
  const [speed, setSpeed] = useState(1);

  // Ko'rilgan joyni tiklash
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !storageKey) return;

    const saved = Number(localStorage.getItem(storageKey));
    const onLoaded = () => {
      if (saved && saved < video.duration - 5) {
        video.currentTime = saved;
      }
    };
    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [src, storageKey]);

  // Vaqtni saqlash
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !storageKey) return;

    const onTime = () => {
      if (video.currentTime > 0) {
        localStorage.setItem(storageKey, String(Math.floor(video.currentTime)));
      }
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [storageKey]);

  function changeSpeed(next) {
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  }

  if (!src) {
    return (
      <div
        className="flex aspect-video w-full items-center justify-center rounded-2xl text-sm"
        style={{ background: "#0f172a", color: "rgba(255,255,255,0.6)" }}
      >
        Bu dars qulflangan — ko'rish uchun kursga yoziling.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        onEnded={onEnded}
        className="aspect-video w-full bg-black"
      />
      <div className="flex items-center justify-between gap-2 bg-black/90 px-4 py-2">
        <span className="text-xs font-medium text-white/60">Tezlik</span>
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                speed === s
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
