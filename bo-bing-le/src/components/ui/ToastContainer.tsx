import { useState, useEffect, useCallback, type ReactNode } from 'react';

interface Toast {
  id: number;
  msg: string;
  type: 'info' | 'success' | 'error';
}

let toastId = 0;
const listeners = new Set<(t: Toast) => void>();

export function showToast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  const toast: Toast = { id: toastId++, msg, type };
  listeners.forEach(fn => fn(toast));
}

const TOAST_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  info:    { bg: 'from-accent-gold/95 to-faction-hybrid/90', border: 'border-accent-gold/40',   icon: '💡' },
  success: { bg: 'from-accent-green/95 to-emerald-600/90',    border: 'border-accent-green/40',  icon: '✅' },
  error:   { bg: 'from-faction-red/95 to-red-700/90',         border: 'border-faction-red/40',   icon: '❌' },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts(prev => [...prev, t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3200);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => {
        const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div key={t.id}
            className={`px-5 py-3 rounded-xl font-bold text-sm text-white border shadow-2xl backdrop-blur
              bg-gradient-to-r ${style.bg} ${style.border}
              animate-[fadeInOut_3.2s_ease_forwards]`}
          >
            <span className="mr-2">{style.icon}</span>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
