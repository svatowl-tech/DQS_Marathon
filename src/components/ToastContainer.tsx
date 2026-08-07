import React, { useEffect, useState } from 'react';
import { toast, ToastMessage } from '../utils/toast';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  onOpenLogs?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ onOpenLogs }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-start gap-3 relative overflow-hidden ${
            item.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
              : item.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
              : item.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
              : 'bg-zinc-900/90 border-zinc-700 text-zinc-100'
          }`}
        >
          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {item.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1 pr-4">
            <h4 className="text-xs font-bold leading-snug">{item.title}</h4>
            {item.message && (
              <p className="text-[11px] opacity-80 leading-relaxed font-sans break-words">
                {item.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {item.onAction && item.actionLabel && (
                <button
                  onClick={() => {
                    item.onAction?.();
                    toast.dismiss(item.id);
                  }}
                  className="text-[10px] font-bold underline hover:opacity-100 opacity-90 cursor-pointer"
                >
                  {item.actionLabel}
                </button>
              )}

              {item.type === 'error' && onOpenLogs && (
                <button
                  onClick={() => {
                    onOpenLogs();
                    toast.dismiss(item.id);
                  }}
                  className="text-[10px] font-bold text-amber-300 underline hover:text-amber-200 cursor-pointer"
                >
                  Журнал логов
                </button>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => toast.dismiss(item.id)}
            className="absolute top-3 right-3 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
