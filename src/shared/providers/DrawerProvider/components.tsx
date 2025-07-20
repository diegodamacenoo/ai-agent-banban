'use client';

import React from 'react';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useDrawer, type BaseFormData } from '../DrawerProvider';
import { Card } from '@/shared/ui/card';

// Tipos de opção para select
export interface SelectOption {
  value: string;
  label: string;
}

// Componente de campo de texto
interface TextFieldProps<T extends BaseFormData> {
  name: keyof T;
  label: string;
  type?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function TextField<T extends BaseFormData>({ 
  name, 
  label, 
  type = 'text', 
  placeholder, 
  description, 
  required,
  disabled 
}: TextFieldProps<T>) {
  const { formData, formErrors, handleInputChange } = useDrawer<T>();
  const fieldKey = String(name);
  const hasError = !!formErrors[fieldKey];
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldKey}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={fieldKey}
        type={type}
        value={formData[name] || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={hasError ? 'border-red-500' : ''}
      />
      {hasError && (
        <p className="text-sm text-red-500">{formErrors[fieldKey]}</p>
      )}
      {description && !hasError && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Componente de área de texto
interface TextAreaFieldProps<T extends BaseFormData> {
  name: keyof T;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export function TextAreaField<T extends BaseFormData>({ 
  name, 
  label, 
  placeholder, 
  description, 
  required,
  disabled,
  rows = 3
}: TextAreaFieldProps<T>) {
  const { formData, formErrors, handleInputChange } = useDrawer<T>();
  const fieldKey = String(name);
  const hasError = !!formErrors[fieldKey];
  
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldKey}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={fieldKey}
        value={formData[name] || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={hasError ? 'border-red-500' : ''}
      />
      {hasError && (
        <p className="text-sm text-red-500">{formErrors[fieldKey]}</p>
      )}
      {description && !hasError && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Componente de select
interface SelectFieldProps<T extends BaseFormData> {
  name: keyof T;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SelectField<T extends BaseFormData>({ 
  name, 
  label, 
  options, 
  placeholder, 
  description, 
  required,
  disabled 
}: SelectFieldProps<T>) {
  const { formData, formErrors, handleSelectChange } = useDrawer<T>();
  const fieldKey = String(name);
  const hasError = !!formErrors[fieldKey];
  
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select 
        value={formData[name] || ''} 
        onValueChange={(value) => handleSelectChange(name, value)}
        disabled={disabled}
      >
        <SelectTrigger className={hasError ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && (
        <p className="text-sm text-red-500">{formErrors[fieldKey]}</p>
      )}
      {description && !hasError && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Componente de switch
interface SwitchFieldProps<T extends BaseFormData> {
  name: keyof T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function SwitchField<T extends BaseFormData>({ 
  name, 
  label, 
  description,
  disabled 
}: SwitchFieldProps<T>) {
  const { formData, handleSelectChange } = useDrawer<T>();
  
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <Switch
        checked={!!formData[name]}
        onCheckedChange={(checked) => handleSelectChange(name, checked)}
        disabled={disabled}
      />
    </div>
  );
}

// Componente de seção de formulário
interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <Card variant="default" size="sm" className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  );
}

// Componente de grid para organizar campos
interface FieldsGridProps {
  columns: number;
  children: React.ReactNode;
}

export function FieldsGrid({ columns, children }: FieldsGridProps) {
  const gridClass = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1';
  
  return (
    <div className={`grid ${gridClass} gap-4`}>
      {children}
    </div>
  );
} 