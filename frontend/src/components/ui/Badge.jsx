const TONES = {
  brand: "bg-violet-100 text-violet-700",
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
};

function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        TONES[tone] ?? TONES.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
