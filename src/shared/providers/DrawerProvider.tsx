'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerCloseButton,
} from '@/shared/ui/drawer';
import { AlertTriangle, CheckCircle, Loader2, Save } from 'lucide-react';

// Tipos base para o provider
export interface BaseFormData {
  [key: string]: any;
}

export interface ValidationError {
  [field: string]: string;
}

export interface DrawerConfig<T extends BaseFormData> {
  title: string;
  description: string;
  icon?: ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  submitButtonText?: string;
  cancelButtonText?: string;
  loadingText?: string;
  successMessage?: string;
  resetOnClose?: boolean;
  autoCloseOnSuccess?: boolean;
  autoCloseDelay?: number;
}

export interface DrawerContextValue<T extends BaseFormData> {
  // Estado do drawer
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
  config: DrawerConfig<T>;
  
  // Métodos utilitários
  resetForm: () => void;
  clearErrors: () => void;
  clearFeedback: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: keyof T, value: any) => void;
  validateField: (field: keyof T) => void;
  closeDrawer: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

// Context
const DrawerContext = createContext<DrawerContextValue<any> | null>(null);

// Hook para usar o context
export function useDrawer<T extends BaseFormData>(): DrawerContextValue<T> {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer deve ser usado dentro de um DrawerProvider');
  }
  return context;
}

// Props do provider
interface DrawerProviderProps<T extends BaseFormData> {
  children: ReactNode;
  initialData: T;
  config: DrawerConfig<T>;
  onSubmit?: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onValidate?: (data: T) => ValidationError;
  onReset?: () => void;
}

// Provider component
export function DrawerProvider<T extends BaseFormData>({
  children,
  initialData,
  config,
  onSubmit,
  onSuccess,
  onValidate,
  onReset,
}: DrawerProviderProps<T>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<T>(initialData);
  const [formErrors, setFormErrors] = useState<ValidationError>({});

  // Reset form quando o drawer abre/fecha
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

  const closeDrawer = useCallback(() => {
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
      
      if (config.successMessage) {
        setSuccess(config.successMessage);
      }
      
      onSuccess?.();
      
      if (config.autoCloseOnSuccess !== false) {
        const delay = config.autoCloseDelay || 1500;
        setTimeout(() => {
          setOpen(false);
        }, delay);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro no submit:', err);
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, onValidate, onSuccess, config]);

  const contextValue: DrawerContextValue<T> = {
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
    closeDrawer,
    handleSubmit,
  };

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
    </DrawerContext.Provider>
  );
}

// Componente de drawer padrão
interface StandardDrawerProps {
  trigger?: ReactNode;
  children: ReactNode;
  formId?: string;
}

export function StandardDrawer({ trigger, children, formId = 'standard-form' }: StandardDrawerProps) {
  const { 
    open, 
    setOpen, 
    loading, 
    error, 
    success, 
    config, 
    handleSubmit,
    resetForm 
  } = useDrawer();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && config.resetOnClose !== false) {
      resetForm();
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction={config.direction || 'right'}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="w-full max-w-md ml-auto h-full">
        <DrawerCloseButton />
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-lg font-medium">
            {config.icon}
            {config.title}
          </DrawerTitle>
          <DrawerDescription>
            {config.description}
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            {children}
          </form>
        </div>
        
        <DrawerFooter className="border-t bg-gray-50/40">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              {config.cancelButtonText || 'Cancelar'}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={loading}
              className="flex-1"
              leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {loading ? (
                config.loadingText || 'Processando...'
              ) : (
                config.submitButtonText || 'Salvar'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Hook para criar drawer facilmente
export function useCreateDrawer<T extends BaseFormData>(
  initialData: T,
  config: DrawerConfig<T>,
  onSubmit: (data: T) => Promise<void>,
  options?: {
    onSuccess?: () => void;
    onValidate?: (data: T) => ValidationError;
    onReset?: () => void;
  }
) {
  const { onSuccess, onValidate, onReset } = options || {};

  return function DrawerWrapper({ children, trigger }: { children: ReactNode; trigger?: ReactNode }) {
    return (
      <DrawerProvider
        initialData={initialData}
        config={config}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onValidate={onValidate}
        onReset={onReset}
      >
        <StandardDrawer trigger={trigger}>
          {children}
        </StandardDrawer>
      </DrawerProvider>
    );
  };
} 