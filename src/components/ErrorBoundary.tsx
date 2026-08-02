import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };


  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (confirm('Вы уверены, что хотите сбросить сохраненные данные приложения и восстановить рабочее состояние?')) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Failed to clear storage:', e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#141417] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Произошла ошибка загрузки</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Возможно, в браузере сохранились несовместимые данные предыдущей версии. Вы можете перезагрузить страницу или выполнить чистый сброс.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3 text-left max-h-28 overflow-y-auto">
                <p className="text-[11px] font-mono text-rose-300 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Перезагрузить страницу</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full py-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Сбросить данные и запустить заново</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
