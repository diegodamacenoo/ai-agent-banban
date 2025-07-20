'use client';

import React from 'react';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { useSheet, type BaseFormData } from './index';

// Props base para campos
interface BaseFieldProps {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
  description?: string;
}

// Campo de texto
interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TextField<T extends BaseFormData>({ 
  name, 
  label, 
  required = false, 
  type = 'text',
  placeholder,
  className,
  description,
  onChange
}: TextFieldProps) {
  const { formData, formErrors, handleInputChange } = useSheet<T>();
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        value={formData[name] || ''}
        onChange={(e) => {
          handleInputChange(e);
          if (onChange) {
            onChange(e);
          }
        }}
        placeholder={placeholder}
        className={`${formErrors[name] ? 'border-red-500' : ''} ${className || ''}`}
      />
      {formErrors[name] && (
        <p className="text-sm text-red-500">{formErrors[name]}</p>
      )}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Campo de texto longo
interface TextAreaFieldProps extends BaseFieldProps {
  placeholder?: string;
  rows?: number;
}

export function TextAreaField<T extends BaseFormData>({ 
  name, 
  label, 
  required = false, 
  placeholder,
  rows = 3,
  className,
  description 
}: TextAreaFieldProps) {
  const { formData, formErrors, handleInputChange } = useSheet<T>();
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        rows={rows}
        className={`${formErrors[name] ? 'border-red-500' : ''} ${className || ''}`}
      />
      {formErrors[name] && (
        <p className="text-sm text-red-500">{formErrors[name]}</p>
      )}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Campo de seleção
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[];
  placeholder?: string;
}

export function SelectField<T extends BaseFormData>({ 
  name, 
  label, 
  required = false, 
  options,
  placeholder = 'Selecione uma opção',
  className,
  description 
}: SelectFieldProps) {
  const { formData, formErrors, handleSelectChange } = useSheet<T>();
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={formData[name] || ''}
        onValueChange={(value) => handleSelectChange(name as keyof T, value)}
      >
        <SelectTrigger className={formErrors[name] ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {formErrors[name] && (
        <p className="text-sm text-red-500">{formErrors[name]}</p>
      )}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Campo de switch
interface SwitchFieldProps extends BaseFieldProps {
  defaultChecked?: boolean;
}

export function SwitchField<T extends BaseFormData>({ 
  name, 
  label, 
  defaultChecked = false,
  className,
  description 
}: SwitchFieldProps) {
  const { formData, handleSelectChange } = useSheet<T>();
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Switch
          id={name}
          checked={formData[name] ?? defaultChecked}
          onCheckedChange={(checked) => handleSelectChange(name as keyof T, checked)}
          className={className}
        />
        <Label htmlFor={name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Seção de formulário
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Grid de campos
interface FieldsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FieldsGrid({ children, columns = 1, className }: FieldsGridProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-4 ${className || ''}`}>
      {children}
    </div>
  );
} 