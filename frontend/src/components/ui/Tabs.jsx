import { useRef } from "react";

/** Controlled tabs with roving focus and complete keyboard navigation. */
function Tabs({ tabs = [], value, onChange, className = "", ariaLabel = "Bo‘limlar" }) {
  const refs = useRef([]);

  function moveFocus(index) {
    const next = (index + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange?.(tabs[next].value);
  }

  function onKeyDown(event, index) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(tabs.length - 1);
    }
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={className}>
      {tabs.map((tab, index) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(node) => (refs.current[index] = node)}
            id={`tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${tab.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(tab.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`relative -mb-px px-4 py-2.5 text-sm font-semibold transition-colors ${
              active ? "text-violet-700" : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {active && <span aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
