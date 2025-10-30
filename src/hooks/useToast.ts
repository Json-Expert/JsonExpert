import { useState, useCallback } from 'react';

import { Toast } from '../components/common/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ ...options, type: 'success', title, ...(message ? { message } : {}) });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ ...options, type: 'error', title, ...(message ? { message } : {}) });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ ...options, type: 'warning', title, ...(message ? { message } : {}) });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    addToast({ ...options, type: 'info', title, ...(message ? { message } : {}) });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((options: {
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }) => {
    const toast: Omit<Toast, 'id'> = {
      type: options.variant || 'info',
      title: options.title,
    };
    
    if (options.description) {
      toast.message = options.description;
    }
    
    if (options.duration !== undefined) {
      toast.duration = options.duration;
    }
    
    if (options.action) {
      toast.action = options.action;
    }
    
    addToast(toast);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };
}