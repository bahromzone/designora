import { useEffect, useRef } from "react";

// Modal ichida fokus oladigan elementlar selektori.
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Oddiy modal oynasi. `open` va `onClose` bilan boshqariladi.
 * A11y: fokus tuzog'i (focus trap), ochilganda birinchi elementga fokus,
 * yopilganda fokusni oldingi elementga qaytarish, Escape bilan yopish.
 */
function Modal({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  const titleId = title ? "modal-title" : undefined;

  useEffect(() => {
    if (!open) return undefined;

    // Modal ochilishidan oldingi fokusni eslab qolamiz (yopilganda tiklash uchun).
    const previouslyFocused = document.activeElement;

    // Ochilganda modal ichidagi birinchi fokuslanadigan elementga o'tamiz.
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll(FOCUSABLE);
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    } else {
      panel?.focus();
    }

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      // Fokus tuzog'i: Tab modal ichida aylanadi, tashqariga chiqmaydi.
      if (e.key === "Tab") {
        const items = panel?.querySelectorAll(FOCUSABLE);
        if (!items || items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Yopilganda fokusni oldingi elementga qaytaramiz.
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label={titleId ? undefined : title}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-mockup"
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-bold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Yopish"
              className="text-2xl leading-none text-muted hover:text-ink"
            >
              ×
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
