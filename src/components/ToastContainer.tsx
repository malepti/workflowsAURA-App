import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />,
          warning: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
          info: <Info className="h-4 w-4 text-indigo-600 shrink-0" />
        };

        const bgStyles = {
          success: 'border-emerald-200 bg-white/95 text-emerald-950',
          error: 'border-rose-200 bg-white/95 text-rose-950',
          warning: 'border-amber-200 bg-white/95 text-amber-950',
          info: 'border-indigo-200 bg-white/95 text-indigo-950'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between rounded-2xl border p-3.5 shadow-xl backdrop-blur-md text-xs font-medium animate-in slide-in-from-bottom-2 ${
              bgStyles[toast.type]
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {icons[toast.type]}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
