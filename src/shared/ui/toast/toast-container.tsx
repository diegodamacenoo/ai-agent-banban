'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from './toast-context';
import { ToastItem } from './toast-item';

export type ToastPosition = 
  | 'top-right'
  | 'top-left' 
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

interface ToastContainerProps {
  position?: ToastPosition;
  className?: string;
}

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export function ToastContainer({ 
  position = 'top-right',
  className 
}: ToastContainerProps) {
  const { toasts, removeToast } = useToastContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  if (toasts.length === 0) {
    return null;
  }

  const containerElement = (
    <div
      className={`
        fixed z-50 flex max-h-screen w-full max-w-sm flex-col gap-2 p-4
        ${positionClasses[position]}
        ${className || ''}
      `}
      role="region"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );

  return createPortal(containerElement, document.body);
}

export function Toaster(props: ToastContainerProps) {
  return <ToastContainer {...props} />;
}