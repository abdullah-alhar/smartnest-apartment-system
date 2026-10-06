import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

const ICONS = {
  success: <CheckCircle2 size={20} className="text-green-500" />,
  error:   <XCircle size={20} className="text-red-500" />,
  info:    <Info size={20} className="text-blue-500" />,
};

let uid = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((message, type = "info", duration = 4000) => {
    const id = ++uid;
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (msg, duration) => push(msg, "success", duration),
    error:   (msg, duration) => push(msg, "error", duration),
    info:    (msg, duration) => push(msg, "info", duration),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none" role="status" aria-live="polite">
          {toasts.map(({ id, message, type }) => (
            <div key={id} className="animate-slide-in-right pointer-events-auto flex items-start gap-3 bg-white rounded-2xl shadow-[var(--shadow-elevated)] p-4 w-[min(360px,calc(100vw-3rem))] border border-grey-100">
              <div className="flex-shrink-0 mt-0.5">{ICONS[type] ?? ICONS.info}</div>
              <p className="flex-1 text-sm font-medium text-primary leading-snug">{message}</p>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(id)}
                className="flex-shrink-0 text-grey-300 hover:text-grey-500"><X size={16} /></button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
