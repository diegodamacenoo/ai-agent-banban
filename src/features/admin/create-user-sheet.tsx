'use client';

import { useState, useEffect } from 'react';
import { getAllOrganizations } from '@/app/actions/admin/organizations';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Building2, Plus } from 'lucide-react';
import {
  DrawerProvider,
  StandardDrawer,
  TextField,
  SelectField,
  FormSection,
  FieldsGrid,
  createValidator,
  validators,
  useDrawer,
  type BaseFormData,
  type SelectOption,
} from '@/shared/providers/DrawerProvider/index';

// Definir o tipo dos dados do formulário
interface UserFormData extends BaseFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'organization_admin' | 'editor' | 'reader' | 'visitor';
  organization_id: string;
}

// Dados iniciais do formulário
const initialUserData: UserFormData = {
  email: '',
  first_name: '',
  last_name: '',
  role: 'reader',
  organization_id: '',
};

// Validador do formulário
const validateUserForm = createValidator<UserFormData>({
  email: validators.combine(
    validators.required('Email é obrigatório'),
    validators.email('Email inválido')
  ),
  first_name: validators.required('Nome é obrigatório'),
  last_name: validators.required('Sobrenome é obrigatório'),
  role: validators.required('Função é obrigatória'),
  organization_id: validators.required('Organização é obrigatória'),
});

// Componente do formulário
function UserFormContent({ organizationId }: { organizationId?: string }) {
  const [organizations, setOrganizations] = useState<SelectOption[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const { formData, formErrors, handleSelectChange } = useDrawer<UserFormData>();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      console.debug('Iniciando carregamento das organizações...');
      const result = await getAllOrganizations();
      console.debug('Resultado da busca de organizações:', result);
      
      if (result.data) {
        const orgOptions = result.data.map(org => ({
          value: org.id,
          label: org.company_trading_name || org.company_legal_name
        }));
        console.debug('Organizações mapeadas:', orgOptions);
        setOrganizations(orgOptions);
      } else if (result.error) {
        console.error('Erro ao buscar organizações:', result.error);
      }
    } catch (err) {
      console.error('Erro ao carregar organizações:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const roleOptions: SelectOption[] = [
    {
      value: 'organization_admin',
      label: 'Administrador da Organização'
    },
    {
      value: 'editor',
      label: 'Editor'
    },
    {
      value: 'reader',
      label: 'Leitor'
    },
    {
      value: 'visitor',
      label: 'Visitante'
    }
  ];

  return (
    <>
      <FormSection
        title="Informações do Usuário"
        description="Dados básicos do novo usuário da organização"
      >
        <TextField<UserFormData>
          name="email"
          label="Email"
          type="email"
          placeholder="usuario@exemplo.com"
          description="Um convite será enviado para este email"
          required
        />
        <FieldsGrid columns={2}>
          <TextField<UserFormData>
            name="first_name"
            label="Nome"
            placeholder="João"
            required
          />
          <TextField<UserFormData>
            name="last_name"
            label="Sobrenome"
            placeholder="Silva"
            required
          />
        </FieldsGrid>
      </FormSection>

      <FormSection
        title="Permissões e Organização"
        description="Defina o nível de acesso e a organização do usuário"
      >
        {organizationId ? (
          <div className="space-y-2">
            <Label>
              Organização <span className="text-red-500">*</span>
            </Label>
            <Select
              value={organizationId}
              disabled
            >
              <SelectTrigger>
                <SelectValue>
                  {organizations.find(org => org.value === organizationId)?.label || 'Carregando...'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.value} value={org.value}>
                    {org.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Organização à qual o usuário pertencerá
            </p>
          </div>
        ) : (
          <SelectField<UserFormData>
            name="organization_id"
            label="Organização"
            options={organizations}
            placeholder={loadingOrgs ? "Carregando organizações..." : "Selecione uma organização"}
            description="Organização à qual o usuário pertencerá"
            required
          />
        )}
        <SelectField<UserFormData>
          name="role"
          label="Função"
          options={roleOptions}
          placeholder="Selecione uma função"
          description="Nível de acesso que o usuário terá na organização"
          required
        />
      </FormSection>
    </>
  );
}

// Props do componente principal
interface CreateUserDrawerProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  organizationId?: string;
}

export function CreateUserSheet({ onSuccess, trigger, organizationId }: CreateUserDrawerProps) {
  // Dados iniciais do formulário
  const initialData: UserFormData = {
    email: '',
    first_name: '',
    last_name: '',
    role: 'editor',
    organization_id: organizationId || '',
  };

  // Função de validação do formulário
  const validateUserForm = createValidator<UserFormData>({
    email: validators.combine(
      validators.required('Email é obrigatório'),
      validators.email('Email inválido')
    ),
    first_name: validators.required('Nome é obrigatório'),
    last_name: validators.required('Sobrenome é obrigatório'),
    role: validators.required('Função é obrigatória'),
    organization_id: validators.required('Organização é obrigatória'),
  });

  // Função para criar o usuário usando Edge Function
  const handleCreateUser = async (formData: UserFormData) => {
    console.debug('🚀 Iniciando criação de usuário via Edge Function com dados:', formData);
    
    const supabase = createSupabaseBrowserClient();
    
    try {
      // Chamar a edge function invite-new-user
      const { data, error } = await supabase.functions.invoke('invite-new-user', {
        body: {
          email: formData.email,
          organization_id: formData.organization_id,
          role: formData.role,
          // Adicionar dados extras para a edge function processar
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
      });

      console.debug('📥 Resultado da Edge Function de convite:', { data, error });

      if (error) {
        console.error('❌ Erro retornado pela Edge Function:', error);
        throw new Error(error.message || 'Erro interno da função');
      }

      if (!data?.success) {
        console.error('❌ Edge Function retornou falha:', data?.error);
        throw new Error(data?.error || 'Erro desconhecido');
      }

      console.debug('✅ Convite enviado com sucesso via Edge Function:', data);
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      // Lança o erro para que o DrawerProvider possa capturá-lo e exibir a mensagem
      throw new Error(err instanceof Error ? err.message : 'Erro inesperado ao enviar convite');
    }
  };

  const defaultTrigger = (
    <Button variant="outline">
      <Plus className="h-4 w-4" />
      Adicionar Usuário
    </Button>
  );

  return (
    <DrawerProvider
      initialData={initialData}
      config={{
        title: 'Adicionar Usuário à Organização',
        description: 'Criar um novo usuário e vinculá-lo a uma organização existente',
        icon: <Building2 className="h-5 w-5" />,
        submitButtonText: 'Criar Usuário',
        loadingText: 'Criando usuário...',
        successMessage: 'Usuário criado com sucesso! Um convite foi enviado por email.',
        direction: 'right',
      }}
      onSubmit={handleCreateUser}
      onSuccess={onSuccess}
      onValidate={validateUserForm}
    >
      <StandardDrawer trigger={trigger || defaultTrigger}>
        <UserFormContent organizationId={organizationId} />
      </StandardDrawer>
    </DrawerProvider>
  );
} 