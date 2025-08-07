'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  persistent?: boolean; // Para toasts que não auto-removem
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) => 
      prev.map((toast) => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000, // 5 segundos por padrão
      ...toast,
    };

    setToasts((prev) => {
      // Limitar a 5 toasts máximo
      const updated = [...prev, newToast];
      return updated.length > 5 ? updated.slice(1) : updated;
    });

    // O auto-dismiss agora é gerenciado pelo ToastItem com animação

    return id;
  }, [removeToast]);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

// Hook simplificado para uso comum
export function useToast() {
  const { addToast, updateToast, removeToast } = useToastContext();
  
  return {
    toast: addToast,
    success: (title: string, description?: string) => 
      addToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => 
      addToast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) => 
      addToast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) => 
      addToast({ title, description, variant: 'info' }),
    update: updateToast,
    dismiss: removeToast,
  };
}