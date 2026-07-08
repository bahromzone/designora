/**
 * BarList — kutubxonasiz yengil gorizontal bar chart (sof CSS).
 *
 * Recharts o'rniga: yangi bog'liqlik yo'q, bundle og'irlashmaydi, CI yashil.
 * Kerak bo'lsa keyin bitta komponentni Recharts bilan almashtirish oson.
 *
 * props:
 *   data: [{ label: string, value: number }]
 *   formatValue?: (n) => string   — o'ng tomondagi qiymat ko'rinishi
 *   emptyText?: string
 */
export default function BarList({ data = [], formatValue, emptyText }) {
  const rows = Array.isArray(data) ? data : [];
  const max = rows.reduce((m, r) => Math.max(m, Number(r.value) || 0), 0);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
        {emptyText || "Ma'lumot yo'q"}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const value = Number(r.value) || 0;
        const pct = max > 0 ? Math.round((value / max) * 100) : 0;
        return (
          <li key={r.label ?? i}>
            <div
              className="mb-1 flex items-center justify-between text-sm"
              style={{ color: "var(--ink)" }}
            >
              <span className="truncate pr-3 font-medium">{r.label}</span>
              <span className="shrink-0" style={{ color: "var(--muted)" }}>
                {formatValue ? formatValue(value) : value}
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--surface)" }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={r.label}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundImage: "var(--gradient)" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
