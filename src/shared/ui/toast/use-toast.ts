import { useToastContext, type Toast } from './toast-context';

type ToastOptions = Omit<Toast, 'id' | 'variant'>;
type ToastVariantOptions = Omit<Toast, 'id'>;

export function useToast() {
  const { addToast, updateToast, removeToast, clearToasts } = useToastContext();

  const toast = {
    // Método genérico
    show: (options: ToastVariantOptions) => addToast(options),

    // Métodos específicos por variante
    success: (title: string, options?: Partial<ToastOptions>) =>
      addToast({ title, ...options, variant: 'success' }),

    error: (title: string, options?: Partial<ToastOptions>) =>
      addToast({ title, ...options, variant: 'error' }),

    warning: (title: string, options?: Partial<ToastOptions>) =>
      addToast({ title, ...options, variant: 'warning' }),

    info: (title: string, options?: Partial<ToastOptions>) =>
      addToast({ title, ...options, variant: 'info' }),

    default: (title: string, options?: Partial<ToastOptions>) =>
      addToast({ title, ...options, variant: 'default' }),

    // Toast de loading (persistente)
    loading: (title: string, options?: Partial<ToastOptions>) =>
      addToast({ title, ...options, variant: 'info', persistent: true }),

    // Utilitários
    update: updateToast,
    dismiss: removeToast,
    clear: clearToasts,
  };

  return { toast };
}