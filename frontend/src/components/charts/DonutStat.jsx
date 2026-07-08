/**
 * DonutStat — SVG doiraviy progress ko'rsatkichi (kutubxonasiz).
 *
 * props:
 *   value: number   — 0..100 (foiz)
 *   label?: string
 *   size?: number   — px (default 120)
 */
export default function DonutStat({ value = 0, label, size = 120 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label ? label + ": " : ""}${v}%`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--surface)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="font-serif"
          style={{ fontSize: size * 0.22, fontWeight: 600, fill: "var(--ink)" }}
        >
          {v}%
        </text>
      </svg>
      {label && (
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {label}
        </p>
      )}
    </div>
  );
}
