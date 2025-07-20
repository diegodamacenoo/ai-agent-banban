// Provider principal
export {
  DrawerProvider,
  StandardDrawer,
  useDrawer,
  useCreateDrawer,
  type BaseFormData,
  type ValidationError,
  type DrawerConfig,
  type DrawerContextValue,
} from '../DrawerProvider';

// Componentes auxiliares
export {
  TextField,
  TextAreaField,
  SelectField,
  SwitchField,
  FormSection,
  FieldsGrid,
} from './components';

// Tipos dos componentes
export type { SelectOption } from './components';

// Utilitários para validação
import type { BaseFormData, ValidationError } from '../DrawerProvider';

export const createValidator = <T extends BaseFormData>(
  rules: Partial<Record<keyof T, (value: any, formData: T) => string | undefined>>
) => {
  return (formData: T): ValidationError => {
    const errors: ValidationError = {};
    
    for (const [field, validator] of Object.entries(rules)) {
      if (validator) {
        const error = validator(formData[field], formData);
        if (error) {
          errors[field] = error;
        }
      }
    }
    
    return errors;
  };
};

// Validadores comuns
export const validators = {
  required: (message = 'Campo obrigatório') => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
  },
  
  email: (message = 'Email inválido') => (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
  },
  
  minLength: (min: number, message?: string) => (value: string) => {
    if (value && value.length < min) {
      return message || `Deve ter pelo menos ${min} caracteres`;
    }
  },
  
  maxLength: (max: number, message?: string) => (value: string) => {
    if (value && value.length > max) {
      return message || `Deve ter no máximo ${max} caracteres`;
    }
  },
  
  pattern: (regex: RegExp, message = 'Formato inválido') => (value: string) => {
    if (value && !regex.test(value)) {
      return message;
    }
  },
  
  url: (message = 'URL inválida') => (value: string) => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return message;
      }
    }
  },
  
  phone: (message = 'Formato de telefone inválido') => (value: string) => {
    if (value && !/^[\d\s\-\(\)\+]+$/.test(value)) {
      return message;
    }
  },
  
  combine: (...validators: Array<(value: any) => string | undefined>) => (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
  }
}; 