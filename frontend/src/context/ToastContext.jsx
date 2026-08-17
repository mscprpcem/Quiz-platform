import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Sparkles } from 'lucide-react';

const ToastContext = createContext(null);

let globalToastHandler = null;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef([]);
  toastsRef.current = toasts;

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, options = {}) => {
    if (!message) return null;
    const id = options.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const duration = options.duration !== undefined ? options.duration : 4000;
    const type = options.type || 'info'; // 'success' | 'error' | 'warning' | 'info'
    const title = options.title || '';
    const action = options.action || null;

    const newToast = {
      id,
      message,
      title,
      type,
      duration,
      action,
      createdAt: Date.now()
    };

    setToasts((prev) => {
      // Limit visible toasts to 4 at a time to prevent clutter
      const filtered = prev.slice(-3);
      return [...filtered, newToast];
    });

    return id;
  }, []);

  const success = useCallback((msg, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return addToast(msg, { ...opts, type: 'success' });
  }, [addToast]);

  const error = useCallback((msg, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return addToast(msg, { ...opts, type: 'error', duration: 5000 });
  }, [addToast]);

  const warning = useCallback((msg, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return addToast(msg, { ...opts, type: 'warning' });
  }, [addToast]);

  const info = useCallback((msg, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return addToast(msg, { ...opts, type: 'info' });
  }, [addToast]);

  const toastMethods = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };

  // Expose to window.toast for seamless global / utility usage
  useEffect(() => {
    globalToastHandler = toastMethods;
    window.toast = toastMethods;

    // Gracefully override window.alert to display beautiful toasts instead of native browser "domain says..."
    const nativeAlert = window.alert;
    window.alert = (msg) => {
      if (typeof msg === 'string' && (/error|fail|invalid|cannot|denied/i.test(msg))) {
        toastMethods.error(msg);
      } else if (typeof msg === 'string' && (/success|completed|copied|saved|updated|verified/i.test(msg))) {
        toastMethods.success(msg);
      } else {
        toastMethods.info(String(msg || ''));
      }
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, [toastMethods]);

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback safe dummy if used outside provider
    return {
      toast: globalToastHandler || {
        success: (m) => console.log('Toast:', m),
        error: (m) => console.error('Toast:', m),
        warning: (m) => console.warn('Toast:', m),
        info: (m) => console.info('Toast:', m)
      }
    };
  }
  return { toast: ctx, ...ctx };
};

// ════════ TOAST CONTAINER & INDIVIDUAL TOAST CARD ════════
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[99999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </aside>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 250);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (!toast.duration || toast.duration === Infinity) return;

    let timerId;
    let animFrame;

    const startCountdown = () => {
      startTimeRef.current = Date.now();
      timerId = setTimeout(() => {
        handleDismiss();
      }, remainingRef.current);

      const updateProgress = () => {
        if (!isPaused) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, remainingRef.current - elapsed);
          setProgress((remaining / toast.duration) * 100);
        }
        if (remainingRef.current > 0) {
          animFrame = requestAnimationFrame(updateProgress);
        }
      };
      animFrame = requestAnimationFrame(updateProgress);
    };

    if (!isPaused) {
      startCountdown();
    }

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(animFrame);
    };
  }, [toast.duration, isPaused, handleDismiss]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Styling token maps
  const typeConfig = {
    success: {
      bg: 'bg-white/95 text-slate-900 border-emerald-300 shadow-emerald-500/10',
      iconBg: 'bg-emerald-100 text-emerald-600',
      barColor: 'bg-emerald-500',
      icon: <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />,
      defaultTitle: 'Success'
    },
    error: {
      bg: 'bg-white/95 text-slate-900 border-rose-300 shadow-rose-500/10',
      iconBg: 'bg-rose-100 text-rose-600',
      barColor: 'bg-rose-500',
      icon: <AlertCircle size={18} className="shrink-0 text-rose-600" />,
      defaultTitle: 'Error'
    },
    warning: {
      bg: 'bg-white/95 text-slate-900 border-amber-300 shadow-amber-500/10',
      iconBg: 'bg-amber-100 text-amber-600',
      barColor: 'bg-amber-500',
      icon: <AlertTriangle size={18} className="shrink-0 text-amber-600" />,
      defaultTitle: 'Notice'
    },
    info: {
      bg: 'bg-white/95 text-slate-900 border-blue-300 shadow-blue-500/10',
      iconBg: 'bg-blue-100 text-blue-600',
      barColor: 'bg-blue-600',
      icon: <Info size={18} className="shrink-0 text-blue-600" />,
      defaultTitle: 'Information'
    }
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-xl p-3.5 sm:p-4 shadow-xl transition-all duration-200 transform ${
        config.bg
      } ${
        isExiting
          ? 'opacity-0 translate-y-3 scale-95'
          : 'opacity-100 translate-y-0 scale-100 animate-slide-up'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Type Icon */}
        <div className={`p-1.5 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          {toast.title ? (
            <h4 className="text-xs font-black text-slate-900 leading-tight mb-0.5">{toast.title}</h4>
          ) : null}
          <p className="text-xs font-semibold text-slate-700 leading-relaxed break-words">
            {toast.message}
          </p>

          {/* Custom Action if provided */}
          {toast.action && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick?.();
                  handleDismiss();
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Live Progress Bar */}
      {toast.duration && toast.duration !== Infinity ? (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/80 overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default ToastProvider;
