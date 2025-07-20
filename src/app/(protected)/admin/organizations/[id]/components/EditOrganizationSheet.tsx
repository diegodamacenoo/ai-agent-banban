'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { updateOrganization } from '@/app/actions/admin/organizations';
import { Edit } from 'lucide-react';
import {
  DrawerProvider,
  StandardDrawer,
  TextField,
  SelectField,
  createValidator,
  validators,
  useDrawer,
  type BaseFormData,
  type SelectOption,
} from '@/shared/providers/DrawerProvider/index';
import { Card } from '@/shared/ui/card';

interface Organization {
  id: string;
  company_legal_name: string;
  company_trading_name: string;
  slug?: string;
  client_type: 'standard' | 'custom';
  is_implementation_complete: boolean;
}

interface OrganizationFormData extends BaseFormData {
  company_legal_name: string;
  company_trading_name: string;
  slug: string;
  client_type: 'standard' | 'custom';
}

// Validador do formulário
const validateOrganizationForm = createValidator<OrganizationFormData>({
  company_legal_name: validators.required('Razão social é obrigatória'),
  company_trading_name: validators.required('Nome fantasia é obrigatório'),
  slug: validators.combine(
    validators.required('Slug é obrigatório'),
    validators.pattern(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
  ),
});

// Opções para o tipo de cliente
const clientTypeOptions: SelectOption[] = [
  {
    value: 'standard',
    label: 'Standard'
  },
  {
    value: 'custom',
    label: 'Custom'
  }
];

// Componente do formulário
function EditOrganizationFormContent({ organization }: { organization: Organization }) {
  const [autoUpdateSlug, setAutoUpdateSlug] = useState(false);
  const { formData, handleSelectChange } = useDrawer<OrganizationFormData>();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  };

  // Atualizar slug automaticamente quando o nome fantasia mudar
  useEffect(() => {
    if (autoUpdateSlug && formData.company_trading_name) {
      const newSlug = generateSlug(formData.company_trading_name);
      if (newSlug !== formData.slug) {
        handleSelectChange('slug', newSlug);
      }
    }
  }, [formData.company_trading_name, autoUpdateSlug, handleSelectChange, formData.slug]);

  return (
    <>
    <Card variant="default" className="bg-transparent" size="sm">
      {/* Razão Social */}
      <TextField<OrganizationFormData>
        name="company_legal_name"
        label="Razão Social"
        placeholder="Digite a razão social"
        required
      />

      {/* Nome Fantasia */}
      <TextField<OrganizationFormData>
        name="company_trading_name"
        label="Nome Fantasia"
        placeholder="Digite o nome fantasia"
        required
      />

      {/* Controle de atualização automática do slug */}
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
        
        {/* Slug */}
        <TextField<OrganizationFormData>
          name="slug"
          label="Slug"
          placeholder="slug-da-organizacao"
          description={`Usado na URL: ${formData.slug || 'slug'}.localhost (apenas letras minúsculas, números e hífens)`}
          required
        />
      </div>

      {/* Tipo de Cliente */}
      <SelectField<OrganizationFormData>
        name="client_type"
        label="Tipo de Cliente"
        options={clientTypeOptions}
        description={formData.client_type === 'custom' 
          ? 'Cliente com implementação personalizada' 
          : 'Cliente com implementação padrão'
        }
      />
      </Card>
    </>
  );
}

interface EditOrganizationSheetProps {
  organization: Organization;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditOrganizationSheet({ 
  organization, 
  onSuccess,
  trigger 
}: EditOrganizationSheetProps) {
  const initialData: OrganizationFormData = {
    company_legal_name: organization.company_legal_name,
    company_trading_name: organization.company_trading_name,
    slug: organization.slug || '',
    client_type: organization.client_type
  };

  const handleSubmit = async (data: OrganizationFormData): Promise<void> => {
    const result = await updateOrganization({
      id: organization.id,
      ...data
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao atualizar organização');
    }

    onSuccess?.();
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <Edit className="h-4 w-4" />
    </Button>
  );

  return (
    <DrawerProvider
      initialData={initialData}
      config={{
        title: 'Editar Organização',
        description: 'Atualize as informações básicas da organização',
        icon: <Edit className="h-5 w-5" />,
        submitButtonText: 'Salvar Alterações',
        loadingText: 'Salvando...',
        successMessage: 'Organização atualizada com sucesso!',
        autoCloseOnSuccess: true,
        autoCloseDelay: 1500,
        direction: 'right',
      }}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      onValidate={validateOrganizationForm}
    >
      <StandardDrawer trigger={trigger || defaultTrigger}>
        <EditOrganizationFormContent organization={organization} />
      </StandardDrawer>
    </DrawerProvider>
  );
} 