'use client';

import { Button } from '@/shared/ui/button';
import { User, Plus } from 'lucide-react';
import {
  SheetProvider,
  StandardSheet,
  TextField,
  SelectField,
  FormSection,
  createValidator,
  validators,
  type BaseFormData,
  type SelectOption,
} from './index';

// Exemplo de dados do formulário
interface TestFormData extends BaseFormData {
  name: string;
  email: string;
  role: string;
}

const initialData: TestFormData = {
  name: '',
  email: '',
  role: 'user',
};

const validateForm = createValidator<TestFormData>({
  name: validators.required('Nome é obrigatório'),
  email: validators.combine(
    validators.required('Email é obrigatório'),
    validators.email('Email inválido')
  ),
  role: validators.required('Função é obrigatória'),
});

const roleOptions: SelectOption[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'user', label: 'Usuário' },
  { value: 'viewer', label: 'Visualizador' },
];

function TestFormContent() {
  return (
    <FormSection
      title="Dados do Usuário"
      description="Preencha as informações básicas"
    >
      <TextField<TestFormData>
        name="name"
        label="Nome"
        placeholder="Digite o nome"
        required
      />
      <TextField<TestFormData>
        name="email"
        label="Email"
        type="email"
        placeholder="usuario@exemplo.com"
        required
      />
      <SelectField<TestFormData>
        name="role"
        label="Função"
        options={roleOptions}
        placeholder="Selecione uma função"
        required
      />
    </FormSection>
  );
}

export function TestSheet() {
  const handleSubmit = async (data: TestFormData) => {
    console.debug('Dados do formulário:', data);
    
    // Simular uma operação async
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular sucesso
    console.debug('Operação concluída com sucesso!');
  };

  const handleSuccess = () => {
    console.debug('Callback de sucesso executado!');
  };

  return (
    <SheetProvider
      initialData={initialData}
      config={{
        title: 'Teste do SheetProvider',
        description: 'Formulário de teste para validar o funcionamento',
        icon: <User className="h-5 w-5" />,
        submitButtonText: 'Salvar Teste',
        loadingText: 'Salvando...',
        successMessage: 'Dados salvos com sucesso!',
        maxWidth: 'sm:max-w-md'
      }}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      onValidate={validateForm}
    >
      <StandardSheet 
        trigger={
          <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
            Abrir Teste
          </Button>
        }
      >
        <TestFormContent />
      </StandardSheet>
    </SheetProvider>
  );
} 