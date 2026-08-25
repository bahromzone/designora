import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function TopAnnouncementBanner() {
  const [visible, setVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("designora_promo_dismissed");
    if (isDismissed) {
      setVisible(false);
    }
  }, []);

  // Admin sahifalarida ko'rsatmaslik
  if (!visible || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <aside
      aria-label="Aksiya xabari"
      className="relative z-50 bg-[#171727] text-white border-b border-white/10 px-4 py-2 text-sm font-sans"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 md:gap-4 flex-wrap text-center">
        <span className="inline-flex items-center justify-center bg-[#f59e0b] text-[#0f172a] text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full select-none">
          AKSIYA
        </span>
        <p className="text-white text-[13px] sm:text-[14px] font-medium tracking-tight">
          Yozgi chegirma: barcha kurslarga{" "}
          <span className="text-[#fed7aa] font-bold">20% gacha</span> chegirma!{" "}
          <span className="opacity-80 font-normal text-xs sm:text-sm">
            (31-avgustgacha)
          </span>
        </p>
        <Link
          to="/kurslar"
          className="inline-flex items-center gap-1 bg-white text-[#0f172a] hover:bg-[#f59e0b] hover:text-black text-[12px] sm:text-[13px] font-semibold px-3.5 py-1 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <span>Chegirmani olish</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </aside>
  );
}
