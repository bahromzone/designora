import { createContext, useContext, useMemo } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';

const ToastContext = createContext(null);

const triggerToast = (message, options = {}) => {
  const { type = 'message', ...restOptions } = options;

  if (type === 'success') return sonnerToast.success(message, restOptions);
  if (type === 'error') return sonnerToast.error(message, restOptions);
  if (type === 'warning') return sonnerToast.warning(message, restOptions);
  if (type === 'info') return sonnerToast.info(message, restOptions);

  return sonnerToast(message, restOptions);
};

export function ToastProvider({ children }) {
  const value = useMemo(
    () => ({
      toast: triggerToast,
      addToast: triggerToast,
      showToast: triggerToast,
      success: (message, options) => sonnerToast.success(message, options),
      error: (message, options) => sonnerToast.error(message, options),
      warning: (message, options) => sonnerToast.warning(message, options),
      info: (message, options) => sonnerToast.info(message, options),
      dismiss: sonnerToast.dismiss,
      removeToast: sonnerToast.dismiss,
      toasts: [],
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    return {
      toast: triggerToast,
      addToast: triggerToast,
      showToast: triggerToast,
      success: (message, options) => sonnerToast.success(message, options),
      error: (message, options) => sonnerToast.error(message, options),
      warning: (message, options) => sonnerToast.warning(message, options),
      info: (message, options) => sonnerToast.info(message, options),
      dismiss: sonnerToast.dismiss,
      removeToast: sonnerToast.dismiss,
      toasts: [],
    };
  }

  return context;
}
