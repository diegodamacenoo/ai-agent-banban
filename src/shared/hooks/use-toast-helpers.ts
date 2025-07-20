import { useToast } from '@/shared/ui/toast'

interface ToastActionButton {
  label: string;
  onClick: () => void;
}

interface ToastWithActionOptions {
  title: string;
  description?: string;
  action?: ToastActionButton;
  cancel?: ToastActionButton;
}

export const useToastHelpers = () => {
  const { toast } = useToast();

  const showSuccess = (title: string, description?: string) => {
    return toast.success(title, { description });
  }

  const showError = (title: string, description?: string) => {
    return toast.error(title, { description });
  }

  const showWarning = (title: string, description?: string) => {
    return toast.warning(title, { description });
  }

  const showInfo = (title: string, description?: string) => {
    return toast.info(title, { description });
  }

  // Toast com botão de ação personalizado
  const showWithAction = ({ title, description, action, cancel }: ToastWithActionOptions) => {
    return toast.show({
      title,
      description,
      action,
      cancel,
    });
  }

  // Toast de sucesso com ação de desfazer
  const showSuccessWithUndo = (title: string, description: string, onUndo: () => void) => {
    return toast.success(title, {
      description,
      action: {
        label: 'Desfazer',
        onClick: onUndo,
      },
    });
  }

  // Toast de confirmação com ação e cancelamento
  const showConfirmAction = (
    title: string, 
    description: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    return toast.show({
      title,
      description,
      action: {
        label: 'Confirmar',
        onClick: onConfirm,
      },
      cancel: {
        label: 'Cancelar',
        onClick: onCancel || (() => {}),
      },
    });
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWithAction,
    showSuccessWithUndo,
    showConfirmAction,
  }
} 
