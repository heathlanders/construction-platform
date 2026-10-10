'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { STATUS_DOT, type StatusKey } from '@/lib/status';

type ToastTone = 'success' | 'danger' | 'info' | 'warning' | 'neutral';

interface Toast {
  id: number;
  tone: ToastTone;
  message: ReactNode;
}

interface ToastApi {
  toast: (message: ReactNode, tone?: ToastTone) => void;
  success: (m: ReactNode) => void;
  error: (m: ReactNode) => void;
  info: (m: ReactNode) => void;
  warning: (m: ReactNode) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: ReactNode, tone: ToastTone = 'neutral') => {
      const id = ++seq.current;
      setToasts((t) => [...t, { id, tone, message }]);
      window.setTimeout(() => remove(id), DURATION);
    },
    [remove],
  );

  const api: ToastApi = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'danger'),
    info: (m) => toast(m, 'info'),
    warning: (m) => toast(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-ink shadow-lg"
              >
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[t.tone as StatusKey]}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">{t.message}</div>
                <button
                  onClick={() => remove(t.id)}
                  aria-label="Dismiss"
                  className="shrink-0 text-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
