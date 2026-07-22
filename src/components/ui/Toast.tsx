import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { subscribeToasts, type ToastPayload } from './toastBus';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
interface ToastItem extends ToastPayload {
  id: number;
}

// ──────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<
  ToastPayload['type'],
  { icon: typeof CheckCircle2; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className:
      'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  },
  error: {
    icon: XCircle,
    className:
      'bg-red-50 text-red-800 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
  },
  warning: {
    icon: AlertCircle,
    className:
      'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  },
  info: {
    icon: Info,
    className:
      'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
  },
};

// ──────────────────────────────────────────────────────────
// ToastContainer — mount một lần trong App.tsx
// ──────────────────────────────────────────────────────────
let nextId = 0;
const AUTO_DISMISS_MS = 4000;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return subscribeToasts((t) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { ...t, id }]);

      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    });
  }, []);

  const dismiss = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      role="region"
      aria-label="Thông báo"
      className="fixed bottom-5 right-4 z-[9999] flex flex-col gap-3 sm:right-6"
    >
      {toasts.map((t) => {
        const { icon: Icon, className } = TOAST_CONFIG[t.type];
        return (
          <div
            key={t.id}
            className={`flex min-w-72 max-w-sm items-start gap-3 rounded-2xl p-4 text-sm font-semibold shadow-xl ring-1 animate-in slide-in-from-right-4 duration-300 ${className}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1 leading-5">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-0.5 opacity-60 transition hover:opacity-100"
              aria-label="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
