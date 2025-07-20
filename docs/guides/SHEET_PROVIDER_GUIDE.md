# Guia do SheetProvider

O `SheetProvider` é uma implementação padronizada para gerenciar sheets (painéis laterais) com formulários no projeto. Ele centraliza a lógica comum de estado, validação e operações CRUD.

## Características

- ✅ **Gerenciamento de Estado**: Controle automático de abertura/fechamento, loading, erros e sucesso
- ✅ **Validação Integrada**: Sistema de validação flexível com validadores pré-construídos
- ✅ **Componentes Padronizados**: Campos de formulário que se integram automaticamente
- ✅ **TypeScript**: Tipagem completa para segurança de tipos
- ✅ **Reutilizável**: Pode ser usado para qualquer tipo de formulário em sheet
- ✅ **Configurável**: Múltiplas opções de customização

## Estrutura dos Arquivos

```
src/shared/providers/SheetProvider/
├── SheetProvider.tsx        # Provider principal
├── components.tsx           # Componentes de formulário
└── index.ts                # Exportações e utilitários
```

## Uso Básico

### 1. Definir o Tipo de Dados

```typescript
interface UserFormData extends BaseFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  organization_id: string;
}
```

### 2. Criar Dados Iniciais

```typescript
const initialUserData: UserFormData = {
  email: '',
  first_name: '',
  last_name: '',
  role: 'user',
  organization_id: '',
};
```

### 3. Configurar Validação

```typescript
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
```

### 4. Implementar o Sheet

```typescript
export function CreateUserSheet({ onSuccess, trigger }: CreateUserSheetProps) {
  const handleCreateUser = async (formData: UserFormData) => {
    // Lógica para criar usuário
    const result = await createUser(formData);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  return (
    <SheetProvider
      initialData={initialUserData}
      config={{
        title: 'Novo Usuário',
        description: 'Criar um novo usuário no sistema',
        icon: <Building2 className="h-5 w-5" />,
        submitButtonText: 'Criar Usuário',
        successMessage: 'Usuário criado com sucesso!',
      }}
      onSubmit={handleCreateUser}
      onSuccess={onSuccess}
      onValidate={validateUserForm}
    >
      <StandardSheet trigger={trigger}>
        <FormContent />
      </StandardSheet>
    </SheetProvider>
  );
}
```

### 5. Criar o Conteúdo do Formulário

```typescript
function FormContent() {
  return (
    <>
      <FormSection
        title="Informações de Acesso"
        description="Credenciais de login do usuário"
      >
        <TextField<UserFormData>
          name="email"
          label="Email"
          type="email"
          placeholder="usuario@exemplo.com"
          required
        />
      </FormSection>

      <FormSection
        title="Informações Pessoais"
        description="Dados pessoais do usuário"
      >
        <FieldsGrid columns={2}>
          <TextField<UserFormData>
            name="first_name"
            label="Nome"
            required
          />
          <TextField<UserFormData>
            name="last_name"
            label="Sobrenome"
            required
          />
        </FieldsGrid>
      </FormSection>
    </>
  );
}
```

## Componentes Disponíveis

### TextField
Campo de texto com suporte a diferentes tipos.

```typescript
<TextField<FormDataType>
  name="email"
  label="Email"
  type="email"
  placeholder="usuario@exemplo.com"
  required
  description="Insira um email válido"
/>
```

### TextAreaField
Campo de texto longo.

```typescript
<TextAreaField<FormDataType>
  name="description"
  label="Descrição"
  placeholder="Digite a descrição..."
  rows={4}
  required
/>
```

### SelectField
Campo de seleção com opções.

```typescript
<SelectField<FormDataType>
  name="role"
  label="Função"
  options={[
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuário' }
  ]}
  placeholder="Selecione uma função"
  required
/>
```

### SwitchField
Campo de switch/toggle.

```typescript
<SwitchField<FormDataType>
  name="is_active"
  label="Usuário Ativo"
  defaultChecked={true}
  description="Determina se o usuário pode fazer login"
/>
```

### FormSection
Agrupa campos relacionados.

```typescript
<FormSection
  title="Informações Pessoais"
  description="Dados pessoais do usuário"
>
  {/* Campos aqui */}
</FormSection>
```

### FieldsGrid
Organiza campos em grid responsivo.

```typescript
<FieldsGrid columns={2}>
  <TextField name="first_name" label="Nome" />
  <TextField name="last_name" label="Sobrenome" />
</FieldsGrid>
```

## Configuração do Sheet

```typescript
interface SheetConfig<T> {
  title: string;                    // Título do sheet
  description: string;              // Descrição
  icon?: ReactNode;                 // Ícone do título
  maxWidth?: string;                // Largura máxima
  side?: 'left' | 'right' | 'top' | 'bottom'; // Posição
  submitButtonText?: string;        // Texto do botão submit
  cancelButtonText?: string;        // Texto do botão cancelar
  loadingText?: string;             // Texto durante loading
  successMessage?: string;          // Mensagem de sucesso
  resetOnClose?: boolean;           // Reset ao fechar (padrão: true)
  autoCloseOnSuccess?: boolean;     // Fechar automaticamente (padrão: true)
  autoCloseDelay?: number;          // Delay para fechar (padrão: 2000ms)
}
```

## Validadores Disponíveis

### Validadores Básicos

```typescript
validators.required('Campo obrigatório')
validators.email('Email inválido')
validators.minLength(6, 'Mínimo 6 caracteres')
validators.maxLength(100, 'Máximo 100 caracteres')
validators.pattern(/^[A-Z]+$/, 'Apenas letras maiúsculas')
validators.url('URL inválida')
validators.phone('Telefone inválido')
```

### Combinando Validadores

```typescript
validators.combine(
  validators.required('Campo obrigatório'),
  validators.minLength(6, 'Mínimo 6 caracteres'),
  validators.pattern(/^[a-zA-Z0-9]+$/, 'Apenas letras e números')
)
```

### Validador Customizado

```typescript
const validateUserForm = createValidator<UserFormData>({
  email: (value, formData) => {
    if (!value) return 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
    // Validação customizada adicional
    if (formData.role === 'admin' && !value.endsWith('@admin.com')) {
      return 'Admins devem usar email @admin.com';
    }
  },
});
```

## Hook useSheet

Dentro dos componentes de formulário, você pode usar o hook `useSheet` para acessar o estado:

```typescript
function CustomField() {
  const {
    formData,
    formErrors,
    handleInputChange,
    handleSelectChange,
    loading,
    setError,
    closeSheet
  } = useSheet<UserFormData>();

  return (
    <div>
      <input
        value={formData.customField || ''}
        onChange={handleInputChange}
        disabled={loading}
      />
      {formErrors.customField && (
        <span className="error">{formErrors.customField}</span>
      )}
    </div>
  );
}
```

## Exemplo Completo

Veja o arquivo `src/features/admin/create-user-sheet-refactored.tsx` para um exemplo completo de implementação.

## Vantagens da Implementação Padronizada

### Antes (Implementação Manual)
- ❌ 498 linhas de código
- ❌ Estado duplicado em cada sheet
- ❌ Lógica de validação repetida
- ❌ Tratamento de erro inconsistente
- ❌ Difícil manutenção

### Depois (Com SheetProvider)
- ✅ ~200 linhas de código
- ✅ Estado centralizado e reutilizável
- ✅ Validação padronizada
- ✅ Tratamento de erro consistente
- ✅ Fácil manutenção e extensão

## Migração de Sheets Existentes

1. **Identificar dados do formulário** → Criar interface `FormData`
2. **Extrair validação** → Usar `createValidator` e `validators`
3. **Substituir campos** → Usar componentes padronizados
4. **Configurar provider** → Definir `SheetConfig`
5. **Testar funcionalidade** → Verificar se tudo funciona

## Boas Práticas

- ✅ Sempre definir tipos TypeScript para os dados do formulário
- ✅ Usar validadores pré-construídos quando possível
- ✅ Agrupar campos relacionados com `FormSection`
- ✅ Usar `FieldsGrid` para layouts responsivos
- ✅ Fornecer mensagens de erro claras
- ✅ Configurar mensagens de sucesso específicas
- ✅ Testar validação em diferentes cenários 