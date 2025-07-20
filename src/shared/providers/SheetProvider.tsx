'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { AlertTriangle, CheckCircle, Loader2, Save, SheetIcon } from 'lucide-react';

// Tipos base para o provider
export interface BaseFormData {
  [key: string]: any;
}

export interface ValidationError {
  [field: string]: string;
}

export interface SheetConfig<T extends BaseFormData> {
  title: string;
  description: string;
  icon?: ReactNode;
  maxWidth?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  submitButtonText?: string;
  cancelButtonText?: string;
  loadingText?: string;
  successMessage?: string;
  resetOnClose?: boolean;
  autoCloseOnSuccess?: boolean;
  autoCloseDelay?: number;
}

export interface SheetContextValue<T extends BaseFormData> {
  // Estado do sheet
  open: boolean;
  setOpen: (open: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Estado de feedback
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;
  
  // Dados do formulário
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  formErrors: ValidationError;
  setFormErrors: React.Dispatch<React.SetStateAction<ValidationError>>;
  
  // Configuração
  config: SheetConfig<T>;
  
  // Métodos utilitários
  resetForm: () => void;
  clearErrors: () => void;
  clearFeedback: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: keyof T, value: any) => void;
  validateField: (field: keyof T) => void;
  closeSheet: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

// Context
const SheetContext = createContext<SheetContextValue<any> | null>(null);

// Hook para usar o context
export function useSheet<T extends BaseFormData>(): SheetContextValue<T> {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet deve ser usado dentro de um SheetProvider');
  }
  return context;
}

// Props do provider
interface SheetProviderProps<T extends BaseFormData> {
  children: ReactNode;
  initialData: T;
  config: SheetConfig<T>;
  onSubmit?: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onValidate?: (data: T) => ValidationError;
  onReset?: () => void;
}

// Provider component
export function SheetProvider<T extends BaseFormData>({
  children,
  initialData,
  config,
  onSubmit,
  onSuccess,
  onValidate,
  onReset,
}: SheetProviderProps<T>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<T>(initialData);
  const [formErrors, setFormErrors] = useState<ValidationError>({});

  // Reset form quando o sheet abre/fecha
  useEffect(() => {
    if (open && config.resetOnClose !== false) {
      resetForm();
    }
  }, [open]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setFormErrors({});
    setError(null);
    setSuccess(null);
    onReset?.();
  }, [initialData, onReset]);

  const clearErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  const clearFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const fieldName = id as keyof T;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Limpar erro do campo se existir
    const fieldKey = String(fieldName);
    if (formErrors[fieldKey]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  }, [formErrors]);

  const handleSelectChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo se existir
    const fieldKey = String(field);
    if (formErrors[fieldKey]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  }, [formErrors]);

  const validateField = useCallback((field: keyof T) => {
    if (onValidate) {
      const errors = onValidate(formData);
      const fieldKey = String(field);
      if (errors[fieldKey]) {
        setFormErrors(prev => ({
          ...prev,
          [fieldKey]: errors[fieldKey]
        }));
      }
    }
  }, [formData, onValidate]);

  const closeSheet = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!onSubmit) return;

    // Validar formulário
    if (onValidate) {
      const errors = onValidate(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(formData);
      
      const successMsg = config.successMessage || 'Operação realizada com sucesso!';
      setSuccess(successMsg);
      onSuccess?.();

      if (config.autoCloseOnSuccess !== false) {
        setTimeout(() => {
          setOpen(false);
        }, config.autoCloseDelay || 2000);
      }
    } catch (err) {
      console.error('Erro ao executar operação:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, onValidate, onSuccess, config]);

  const contextValue: SheetContextValue<T> = {
    open,
    setOpen,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    config,
    resetForm,
    clearErrors,
    clearFeedback,
    handleInputChange,
    handleSelectChange,
    validateField,
    closeSheet,
    handleSubmit,
  };

  return (
    <SheetContext.Provider value={contextValue}>
      {children}
    </SheetContext.Provider>
  );
}

// Componente Sheet padronizado
interface StandardSheetProps {
  trigger?: ReactNode;
  children: ReactNode;
  formId?: string;
}

export function StandardSheet({ trigger, children, formId = 'standard-form' }: StandardSheetProps) {
  const {
    open,
    setOpen,
    loading,
    error,
    success,
    config,
    formData,
    formErrors,
    handleInputChange,
    handleSelectChange,
    closeSheet,
    handleSubmit: contextHandleSubmit
  } = useSheet();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await contextHandleSubmit(e);
  }, [contextHandleSubmit]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent 
        className={`flex flex-col justify-between w-full ${config.maxWidth || 'sm:max-w-lg'}`}
        side={config.side}
      >
        <SheetHeader className="mb-4" icon={config.icon} title={config.title} description={config.description} />

        <div className="grid flex-1 auto-rows-min gap-6 overflow-y-auto">
          <div className="space-y-6 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form id={formId} onSubmit={handleSubmit} className="space-y-6">
              {children}
            </form>
          </div>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeSheet}
            disabled={loading}
            className="w-full"
          >
            {config.cancelButtonText || 'Cancelar'}
          </Button>
          <Button
            form={formId}
            type="submit"
            disabled={loading}
            className="w-full"
            leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {loading ? (config.loadingText || 'Processando...') : (config.submitButtonText || 'Salvar')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Hook para criar um sheet facilmente
export function useCreateSheet<T extends BaseFormData>(
  initialData: T,
  config: SheetConfig<T>,
  onSubmit: (data: T) => Promise<void>,
  options?: {
    onSuccess?: () => void;
    onValidate?: (data: T) => ValidationError;
    onReset?: () => void;
  }
) {
  return function SheetWrapper({ children, trigger }: { children: ReactNode; trigger?: ReactNode }) {
    return (
      <SheetProvider
        initialData={initialData}
        config={config}
        onSubmit={onSubmit}
        onSuccess={options?.onSuccess}
        onValidate={options?.onValidate}
        onReset={options?.onReset}
      >
        <StandardSheet trigger={trigger}>
          {children}
        </StandardSheet>
      </SheetProvider>
    );
  };
} 