/**
 * Boshqariladigan (controlled) tab'lar.
 * tabs: [{ value, label }], value: joriy tab, onChange: (value) => void
 */
function Tabs({ tabs = [], value, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 border-b border-border ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.value)}
            className={`relative -mb-px px-4 py-2.5 text-sm font-semibold transition-colors ${
              active ? "text-violet-700" : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-violet-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
