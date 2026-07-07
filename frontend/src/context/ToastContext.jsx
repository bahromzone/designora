import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", ttl = 4000) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (ttl > 0) {
        setTimeout(() => dismiss(id), ttl);
      }
      return id;
    },
    [dismiss]
  );

  const toast = {
    info: (m, ttl) => push(m, "info", ttl),
    success: (m, ttl) => push(m, "success", ttl),
    error: (m, ttl) => push(m, "error", ttl),
    warning: (m, ttl) => push(m, "warning", ttl),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const TONE = {
  info: "bg-white text-ink border-border",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  error: "bg-rose-50 text-rose-800 border-rose-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
};

function ToastItem({ toast, onClose }) {
  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lift min-w-[240px] max-w-sm animate-[fadeIn_0.2s_ease] ${
        TONE[toast.type] ?? TONE.info
      }`}
    >
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Yopish"
        className="text-lg leading-none opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
  }
  return ctx;
}
