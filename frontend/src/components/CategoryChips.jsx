/**
 * Kategoriya chiplari (chips) — bir bosishda kategoriya bo'yicha filtrlash.
 *
 * Props:
 *   categories — [{ category, count }] (discoveryApi.categories natijasi)
 *   value      — joriy tanlangan kategoriya ("" = barchasi)
 *   onChange   — (category) => void  ("" yuborilsa filtrni tozalaydi)
 *
 * Aktiv chip toggle qilinadi: aktiv chipni qayta bosish filtrni tozalaydi.
 */
export default function CategoryChips({ categories = [], value, onChange }) {
  if (!categories.length) return null;

  const chip = (active) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
      active
        ? "border-violet-600 bg-violet-600 text-white"
        : "border-border bg-white text-ink hover:border-violet-300"
    }`;

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={chip(!value)}
      >
        Barchasi
      </button>
      {categories.map((c) => {
        const active = c.category === value;
        return (
          <button
            key={c.category}
            type="button"
            onClick={() => onChange(active ? "" : c.category)}
            className={chip(active)}
          >
            {c.category}
            <span className={active ? "opacity-80" : "text-muted"}>
              {" "}
              ({c.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
