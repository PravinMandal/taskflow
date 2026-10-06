import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const ToastContext = createContext(null);
let seq = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, kind = "info", ms = 3200) => {
      const id = seq++;
      setToasts((ts) => [...ts.slice(-2), { id, message, kind }]);
      timers.current.set(id, setTimeout(() => dismiss(id), ms));
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
      info: (m) => push(m, "info"),
    }),
    [push]
  );

  // Portal to body so the toasts are never positioned inside the
  // transformed App wrapper (same fixed-positioning bug as the dialogs).
  const toastLayer = createPortal(
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            className={`toast toast--${t.kind}`}
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.18 } }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="toast-dot" aria-hidden />
            <span>{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toastLayer}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
