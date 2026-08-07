/**
 * Lightweight Toast Notification Engine
 * Allows triggering toast alerts anywhere in the application.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = [...this.toasts];
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch (e) {
        // Ignore
      }
    });
  }

  public show(toast: Omit<ToastMessage, 'id'>): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);

    const newToast: ToastMessage = { ...toast, id };
    this.toasts.push(newToast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public success(title: string, message?: string) {
    return this.show({ type: 'success', title, message });
  }

  public error(title: string, message?: string, actionLabel?: string, onAction?: () => void) {
    return this.show({ type: 'error', title, message, actionLabel, onAction, duration: 8000 });
  }

  public warning(title: string, message?: string) {
    return this.show({ type: 'warning', title, message });
  }

  public info(title: string, message?: string) {
    return this.show({ type: 'info', title, message });
  }
}

export const toast = new ToastManager();
