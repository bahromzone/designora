import { useLanguage } from "../context/LanguageContext";

const LABELS = { uz: "O'z", ru: "Ру", en: "EN" };

export default function LanguageSwitcher({ className = "" }) {
  const { lang, setLang, supported } = useLanguage();
  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role="group"
      aria-label="Til tanlash"
    >
      {supported.map((code) => {
        const active = code === lang;
        const tone = active
          ? "bg-violet-100 text-violet-700"
          : "text-slate-400 hover:text-slate-700";
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${tone}`}
          >
            {LABELS[code] ?? code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
