/**
 * Centralized Logging & Diagnostic Engine for DQS Nutrition Tracker
 * Automatically captures errors, system events, warnings, network calls, and storage operations.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'Storage' | 'Sync' | 'UI' | 'Image' | 'Calculation' | 'Auth' | 'System' | 'Network';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string; // HH:mm:ss.SSS
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  stack?: string;
}

const MAX_MEMORY_LOGS = 250;
const MAX_PERSISTENT_LOGS = 100;
const LOG_STORAGE_KEY = 'dqs_system_logs_v1';

type LogListener = (logs: LogEntry[]) => void;

class Logger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private originalConsoleError = console.error;
  private originalConsoleWarn = console.warn;

  constructor() {
    this.loadPersistedLogs();
    this.setupGlobalHandlers();
  }

  private loadPersistedLogs() {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(-MAX_MEMORY_LOGS);
        }
      }
    } catch (e) {
      // Ignore storage load issues for logger
    }
  }

  private persistLogs() {
    try {
      const toPersist = this.logs.slice(-MAX_PERSISTENT_LOGS);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      // Ignore quota errors for persistent log storage
    }
  }

  private isNoiseLog(message: string, stack?: string): boolean {
    if (!message) return false;
    const msg = message.toLowerCase();
    const st = (stack || '').toLowerCase();

    // Browser extension noise (e.g. Wallet/Web3 extensions, MetaMask, contentscripts)
    if (msg.includes('maxlistenersexceededwarning') || msg.includes('objectmultiplex') || msg.includes('orphaned data for stream')) {
      return true;
    }
    if (st.includes('contentscript.js') || msg.includes('contentscript.js') || msg.includes('chrome-extension://')) {
      return true;
    }

    // PWA install prompt banner warning
    if (msg.includes('beforeinstallpromptevent.preventdefault()') || msg.includes('banner not shown')) {
      return true;
    }

    // Cross-Origin-Opener-Policy browser popup warning (normal browser behavior when closing Firebase Auth popups)
    if (msg.includes('cross-origin-opener-policy') || msg.includes('would block the window.closed call')) {
      return true;
    }

    // Mobile browser backgrounding IndexedDB closing noise
    if (
      msg.includes('database is closing') ||
      msg.includes('database is hidden') ||
      msg.includes('connection is closing') ||
      msg.includes('connection is closed') ||
      msg.includes('database connection is closing') ||
      msg.includes('dbinstance') ||
      msg.includes('invalidstateerror') ||
      msg.includes('the database is closing')
    ) {
      return true;
    }

    return false;
  }

  private setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    // Window onerror handler
    window.addEventListener('error', (event) => {
      const msg = event.message || '';
      if (this.isNoiseLog(msg, event.error?.stack)) return;

      this.log('error', 'System', `Uncaught JS Error: ${msg}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.toString() : null,
      }, event.error?.stack);
    });

    // Window unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;

      if (this.isNoiseLog(message, stack)) return;

      this.log('error', 'System', `Unhandled Promise Rejection: ${message}`, {
        reason: typeof reason === 'object' ? JSON.stringify(reason) : String(reason),
      }, stack);
    });

    // Proxy console.error to automatically capture third-party/library errors
    console.error = (...args: any[]) => {
      const firstArg = args[0];
      const message = typeof firstArg === 'string' ? firstArg : (firstArg instanceof Error ? firstArg.message : 'Console Error');
      const stack = firstArg instanceof Error ? firstArg.stack : undefined;

      if (!this.isNoiseLog(message, stack)) {
        this.originalConsoleError.apply(console, args);
        try {
          this.log('error', 'System', message, args.length > 1 ? args.slice(1) : undefined, stack);
        } catch (e) {
          // Prevent recursive crash
        }
      }
    };

    // Proxy console.warn
    console.warn = (...args: any[]) => {
      const firstArg = args[0];
      const message = typeof firstArg === 'string' ? firstArg : 'Console Warning';

      if (!this.isNoiseLog(message)) {
        this.originalConsoleWarn.apply(console, args);
        try {
          this.log('warn', 'System', message, args.length > 1 ? args.slice(1) : undefined);
        } catch (e) {
          // Prevent recursive crash
        }
      }
    };
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentLogs = this.getLogs();
    this.listeners.forEach((listener) => {
      try {
        listener(currentLogs);
      } catch (e) {
        // Ignore subscriber errors
      }
    });
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: any,
    stack?: string
  ) {
    const now = new Date();
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      formattedTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`,
      level,
      category,
      message,
      details: details !== undefined ? this.sanitizeDetails(details) : undefined,
      stack,
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_MEMORY_LOGS) {
      this.logs = this.logs.slice(-MAX_MEMORY_LOGS);
    }

    this.persistLogs();
    this.notify();
  }

  private sanitizeDetails(details: any): any {
    try {
      if (typeof details === 'function') return '[Function]';
      if (details instanceof Error) {
        return { message: details.message, name: details.name, stack: details.stack };
      }
      if (typeof details === 'object' && details !== null) {
        // Avoid circular reference stringify error
        const cache = new Set();
        return JSON.parse(
          JSON.stringify(details, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (cache.has(value)) return '[Circular]';
              cache.add(value);
            }
            // Strip large base64 strings from log details to avoid bloating logs
            if (typeof value === 'string' && value.startsWith('data:image')) {
              return `[DataURL Image ~${Math.round(value.length / 1024)}KB]`;
            }
            return value;
          })
        );
      }
      return details;
    } catch (e) {
      return String(details);
    }
  }

  public info(category: LogCategory, message: string, details?: any) {
    this.log('info', category, message, details);
  }

  public warn(category: LogCategory, message: string, details?: any) {
    this.log('warn', category, message, details);
  }

  public error(category: LogCategory, message: string, details?: any, stack?: string) {
    let extractedStack = stack;
    if (!extractedStack && details instanceof Error) {
      extractedStack = details.stack;
    }
    this.log('error', category, message, details, extractedStack);
  }

  public debug(category: LogCategory, message: string, details?: any) {
    this.log('debug', category, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
    this.notify();
  }

  public getDiagnosticSummary() {
    const totalLogs = this.logs.length;
    const errorsCount = this.logs.filter((l) => l.level === 'error').length;
    const warningsCount = this.logs.filter((l) => l.level === 'warn').length;

    let storageInfo = 'Неизвестно';
    try {
      if (typeof localStorage !== 'undefined') {
        const totalChars = Object.keys(localStorage).reduce(
          (acc, key) => acc + (localStorage.getItem(key)?.length || 0),
          0
        );
        storageInfo = `~${Math.round(totalChars / 1024)} KB / LocalStorage`;
      }
    } catch (e) {
      storageInfo = 'Ошибка определения LocalStorage';
    }

    return {
      time: new Date().toLocaleString('ru-RU'),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      windowDimensions: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
      storageUsage: storageInfo,
      totalLogs,
      errorsCount,
      warningsCount,
    };
  }

  public exportDiagnosticReport(): string {
    const summary = this.getDiagnosticSummary();
    const logsText = this.logs
      .map((l) => `[${l.formattedTime}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}${l.details ? '\n  Details: ' + JSON.stringify(l.details) : ''}${l.stack ? '\n  Stack: ' + l.stack : ''}`)
      .join('\n');

    return `=== СИСТЕМНЫЙ ОТЧЁТ ДИАГНОСТИКИ DQS NUTRITION TRACKER ===
Дата и время: ${summary.time}
User Agent: ${summary.userAgent}
Разрешение экрана: ${summary.windowDimensions}
Использование хранилища: ${summary.storageUsage}
Всего записей в журнале: ${summary.totalLogs} (Ошибок: ${summary.errorsCount}, Предупреждений: ${summary.warningsCount})

=================== ЖУРНАЛ СОБЫТИЙ (LOGS) ===================
${logsText || 'Записей нет'}
`;
  }
}

export const logger = new Logger();
