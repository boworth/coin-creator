import { useState } from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Custom hook for managing toasts.
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Toast) => {
    setToasts((currToasts) => [...currToasts, toast]);
  };

  const removeToast = (id: number) => {
    setToasts((currToasts) => currToasts.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}; 