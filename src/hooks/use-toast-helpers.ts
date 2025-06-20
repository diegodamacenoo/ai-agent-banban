import { toast } from '@/hooks/use-toast'

export const useToastHelpers = () => {
  const showSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'default',
    })
  }

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    })
  }

  const showWarning = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'default',
    })
  }

  const showInfo = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'default',
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
} 