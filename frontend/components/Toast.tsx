"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICON: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const STYLE: Record<ToastType, string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  warning: "bg-yellow-500 text-white",
  info: "bg-blue-600 text-white",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 3600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 min-w-[280px] max-w-sm ${
        STYLE[toast.type]
      } ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
    >
      <span className="text-lg font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/20">
        {ICON[toast.type]}
      </span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-white/70 hover:text-white text-lg font-bold flex-shrink-0 transition"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
