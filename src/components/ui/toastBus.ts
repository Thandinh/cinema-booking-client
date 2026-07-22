type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastPayload {
  type: ToastType;
  message: string;
}

type Listener = (toast: ToastPayload) => void;

const listeners = new Set<Listener>();

export const subscribeToasts = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emit = (toast: ToastPayload) => {
  listeners.forEach((listener) => listener(toast));
};

export const toast = {
  success: (message: string) => emit({ type: 'success', message }),
  error: (message: string) => emit({ type: 'error', message }),
  warning: (message: string) => emit({ type: 'warning', message }),
  info: (message: string) => emit({ type: 'info', message }),
};
