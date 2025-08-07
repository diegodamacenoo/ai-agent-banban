'use client';

import { useState, useCallback, useEffect } from 'react';
import { createOrganization } from '@/app/actions/admin/organizations';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Building2, Plus } from 'lucide-react';
import {
  DrawerProvider,
  StandardDrawer,
  TextField,
  TextAreaField,
  SelectField,
  SwitchField,
  FormSection,
  FieldsGrid,
  createValidator,
  validators,
  useDrawer,
  type BaseFormData,
  type SelectOption,
} from '@/shared/providers/DrawerProvider/index';

// Definir o tipo dos dados do formulário
interface OrganizationFormData extends BaseFormData {
  company_legal_name: string;
  company_trading_name: string;
  slug: string;
  client_type: 'standard' | 'custom';
  custom_backend_url?: string;
  implementation_config: string;
  is_implementation_complete: boolean;
}

// Dados iniciais do formulário
const initialOrganizationData: OrganizationFormData = {
  company_legal_name: '',
  company_trading_name: '',
  slug: '',
  client_type: 'standard',
  custom_backend_url: '',
  implementation_config: '{}',
  is_implementation_complete: false,
};

// Validador do formulário
const validateOrganizationForm = createValidator<OrganizationFormData>({
  company_legal_name: validators.required('Razão social é obrigatória'),
  company_trading_name: validators.required('Nome fantasia é obrigatório'),
  slug: validators.combine(
    validators.required('Slug é obrigatório'),
    validators.pattern(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
  ),
  custom_backend_url: (value, formData) => {
    if (formData.client_type === 'custom' && !value?.trim()) {
      return 'URL do backend é obrigatória para clientes custom';
    }
    if (value?.trim()) {
      try {
        new URL(value);
      } catch {
        return 'URL inválida';
      }
    }
  },
  implementation_config: (value) => {
    if (value?.trim()) {
      try {
        JSON.parse(value);
      } catch {
        return 'JSON inválido';
      }
    }
  },
});

// Opções para o tipo de cliente
const clientTypeOptions: SelectOption[] = [
  {
    value: 'standard',
    label: 'Implementação Padrão'
  },
  {
    value: 'custom',
    label: 'Implementação Customizada'
  }
];

// Componente do formulário
function OrganizationFormContent() {
  const [autoUpdateSlug, setAutoUpdateSlug] = useState(true);
  const { formData, handleInputChange, handleSelectChange } = useDrawer<OrganizationFormData>();

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  // Atualizar slug automaticamente quando o nome fantasia mudar
  useEffect(() => {
    if (autoUpdateSlug && formData.company_trading_name) {
      const newSlug = generateSlug(formData.company_trading_name);
      if (newSlug !== formData.slug) {
        handleSelectChange('slug', newSlug);
      }
    }
  }, [formData.company_trading_name, autoUpdateSlug, generateSlug, handleSelectChange, formData.slug]);

  return (
    <>
      <FormSection
        title="Informações Básicas"
        description="Dados fundamentais da organização"
      >
        <TextField<OrganizationFormData>
          name="company_legal_name"
          label="Razão Social"
          placeholder="Ex: Empresa Ltda"
          required
        />
        <TextField<OrganizationFormData>
          name="company_trading_name"
          label="Nome Fantasia"
          placeholder="Ex: Empresa"
          required
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-update-slug" className="text-sm text-gray-500">
              Atualizar slug automaticamente
            </Label>
            <Switch
              id="auto-update-slug"
              checked={autoUpdateSlug}
              onCheckedChange={setAutoUpdateSlug}
            />
          </div>
          <TextField<OrganizationFormData>
            name="slug"
            label="Slug"
            placeholder="Ex: empresa"
            description={`Este será o identificador único da organização na URL: https://app.exemplo.com/${formData.slug || 'empresa'}`}
            required
          />
        </div>
      </FormSection>

      <FormSection
        title="Configurações"
        description="Tipo de implementação e configurações"
      >
        <SelectField<OrganizationFormData>
          name="client_type"
          label="Tipo de Cliente"
          options={clientTypeOptions}
          placeholder="Selecione o tipo de cliente"
        />

        {formData.client_type === 'custom' && (
          <TextField<OrganizationFormData>
            name="custom_backend_url"
            label="URL do Backend Custom"
            type="url"
            placeholder="Ex: http://localhost:4000"
            description="URL onde o backend customizado estará hospedado"
            required
          />
        )}

        <TextAreaField<OrganizationFormData>
          name="implementation_config"
          label="Configurações (JSON)"
          placeholder={JSON.stringify({
            "enabled_modules": ["analytics", "reports"],
            "custom_features": ["advanced_reporting"]
          }, null, 2)}
          description="Configurações em formato JSON"
          rows={4}
        />

        <SwitchField<OrganizationFormData>
          name="is_implementation_complete"
          label="Implementação Completa"
          description="Marque se a implementação já está finalizada"
        />
      </FormSection>
    </>
  );
}

interface CreateOrganizationDrawerProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateOrganizationDrawer({ onSuccess, trigger }: CreateOrganizationDrawerProps) {
  const handleSubmit = async (data: OrganizationFormData): Promise<void> => {
    const submitData = {
      ...data,
      slug: data.slug.toLowerCase(),
      implementation_config: data.implementation_config
        ? JSON.parse(data.implementation_config)
        : {},
    };

    if (!submitData.custom_backend_url?.trim()) {
      delete submitData.custom_backend_url;
    }

    const result = await createOrganization(submitData);

    if (result.success) {
      onSuccess?.();
    } else {
      throw new Error(result.error || 'Erro ao criar organização');
    }
  };

  const defaultTrigger = (
    <Button variant="default">
      <Plus className="h-4 w-4" />
      Nova Organização
    </Button>
  );

  return (
    <DrawerProvider
      initialData={initialOrganizationData}
      config={{
        title: 'Nova Organização',
        description: 'Criar uma nova organização no sistema',
        icon: <Building2 className="h-5 w-5" />,
        submitButtonText: 'Criar Organização',
        loadingText: 'Criando...',
        successMessage: 'Organização criada com sucesso!',
        autoCloseOnSuccess: true,
        autoCloseDelay: 2000,
        direction: 'right',
      }}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      onValidate={validateOrganizationForm}
    >
      <StandardDrawer trigger={trigger || defaultTrigger}>
        <OrganizationFormContent />
      </StandardDrawer>
    </DrawerProvider>
  );
} 
