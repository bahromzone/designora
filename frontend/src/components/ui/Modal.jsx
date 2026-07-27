import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function Modal({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = title ? "modal-title" : undefined;

  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll(FOCUSABLE);
    if (focusables && focusables.length > 0) focusables[0].focus();
    else panel?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = panel?.querySelectorAll(FOCUSABLE);
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label={titleId ? undefined : title}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => closeRef.current?.()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 my-4 flex w-full max-w-lg max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-mockup sm:my-8"
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 py-5">
            <h2 id={titleId} className="text-lg font-bold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => closeRef.current?.()}
              aria-label="Yopish"
              className="rounded-lg px-2 text-2xl leading-none text-muted hover:bg-surface hover:text-ink"
            >
              ×
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-black/5 bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
