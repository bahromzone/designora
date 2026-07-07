/**
 * Sahifalash boshqaruvi. `page` (1-asosli), `pages` (jami), `onChange`.
 */
function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <nav className="flex items-center justify-center gap-3 py-6" aria-label="Sahifalash">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => canPrev && onChange(page - 1)}
        className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
      >
        ← Oldingi
      </button>
      <span className="text-sm text-muted">
        {page} / {pages}
      </span>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => canNext && onChange(page + 1)}
        className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
      >
        Keyingi →
      </button>
    </nav>
  );
}

export default Pagination;
