/**
 * Yulduzli reyting. `value` (0..5). `onChange` berilsa — interaktiv (tahrirlanadi).
 */
function Rating({ value = 0, onChange, size = "md", count }) {
  const rounded = Math.round(value);
  const interactive = typeof onChange === "function";
  const dim =
    size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-flex ${dim}`}
        role={interactive ? "radiogroup" : "img"}
        aria-label={`Reyting: ${value} / 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rounded;
          const cls = filled ? "text-amber-400" : "text-gray-300";
          if (!interactive) {
            return (
              <span key={star} className={cls} aria-hidden="true">
                ★
              </span>
            );
          }
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              aria-label={`${star} yulduz`}
              className={`${cls} transition-transform hover:scale-110`}
            >
              ★
            </button>
          );
        })}
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </span>
  );
}

export default Rating;
