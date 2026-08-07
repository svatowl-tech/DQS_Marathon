import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Terminal } from 'lucide-react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('System', `ErrorBoundary caught React exception: ${error.message}`, {
      componentStack: errorInfo.componentStack,
      errorName: error.name,
    }, error.stack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyDiagnostic = () => {
    const report = logger.exportDiagnosticReport();
    navigator.clipboard.writeText(report).then(() => {
      (this as React.Component<ErrorBoundaryProps, ErrorBoundaryState>).setState({ copied: true });
      setTimeout(() => (this as React.Component<ErrorBoundaryProps, ErrorBoundaryState>).setState({ copied: false }), 2500);
    }).catch(() => {
      alert('Не удалось скопировать. Отчёт записан в консоль браузера.');
      console.log(report);
    });
  };

  private handleResetStorage = () => {
    if (confirm('Вы уверены, что хотите сбросить сохраненные данные приложения и восстановить рабочее состояние?')) {
      try {
        localStorage.clear();
        logger.info('Storage', 'LocalStorage completely cleared via ErrorBoundary reset');
      } catch (e) {
        logger.error('Storage', 'Failed to clear localStorage on ErrorBoundary reset', e);
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
                Возможно, в браузере сохранились несовместимые данные предыдущей версии. Ошибка автоматически записана в системный журнал.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3 text-left max-h-32 overflow-y-auto space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Детали ошибки:</span>
                <p className="text-[11px] font-mono text-rose-300 break-words leading-relaxed">
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
                onClick={this.handleCopyDiagnostic}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>{this.state.copied ? '✓ Отчёт скопирован в буфер!' : 'Скопировать системный отчёт логов'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full py-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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

