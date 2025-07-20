# Módulo de Configuração

Este documento descreve o módulo de Configuração, suas funcionalidades, estrutura e como utilizá-lo no sistema multi-tenant.

## Visão Geral

O módulo de Configuração é responsável por gerenciar configurações por tenant, oferecendo:

- Grupos de configuração organizados
- Validação de tipos e valores
- Versionamento de configurações
- Histórico de alterações
- Isolamento por organização

## Estrutura

### Grupos de Configuração

Grupos são usados para organizar configurações relacionadas:

```typescript
interface ConfigurationGroup {
  id: string;
  name: string;
  description?: string;
  configs: ConfigurationValue[];
  isActive: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}
```

### Valores de Configuração

Cada configuração tem:

```typescript
interface ConfigurationValue {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  version: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  validations?: {
    required?: boolean;
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
    custom?: (value: any) => boolean | Promise<boolean>;
  };
  created_at: Date;
  updated_at: Date;
}
```

### Histórico

Todas as alterações são registradas:

```typescript
interface ConfigurationHistory {
  id: string;
  configId: string;
  value: any;
  version: number;
  changedBy: string;
  reason?: string;
  created_at: Date;
}
```

## Uso

### Criação de Grupo

```typescript
const group = await configModule.createConfigGroup({
  name: 'App Settings',
  description: 'Configurações gerais do aplicativo',
  isActive: true,
  configs: []
});
```

### Criação de Configuração

```typescript
const config = await configModule.createConfig(groupId, {
  key: 'max_users',
  value: 100,
  type: 'number',
  isActive: true,
  validations: {
    required: true,
    minValue: 1,
    maxValue: 1000
  }
});
```

### Atualização de Configuração

```typescript
const updated = await configModule.updateConfig(
  groupId,
  configId,
  {
    value: 200,
    metadata: { updatedBy: 'admin' }
  },
  'Aumentando limite de usuários'
);
```

### Busca de Valor

```typescript
const value = await configModule.getConfigValue(groupId, 'max_users');
```

### Histórico de Alterações

```typescript
const history = await configModule.getConfigHistory(configId);
```

## Validações

### Tipos Suportados

- `string`: Texto
- `number`: Números
- `boolean`: Valores booleanos
- `object`: Objetos JSON
- `array`: Arrays

### Regras de Validação

1. **Strings**
   - `minLength`: Comprimento mínimo
   - `maxLength`: Comprimento máximo
   - `pattern`: Expressão regular

2. **Números**
   - `minValue`: Valor mínimo
   - `maxValue`: Valor máximo

3. **Geral**
   - `required`: Campo obrigatório
   - `enum`: Lista de valores permitidos
   - `custom`: Função de validação customizada

### Exemplos de Validação

```typescript
// Validação de email
const emailConfig = {
  key: 'contact_email',
  value: 'admin@example.com',
  type: 'string',
  validations: {
    required: true,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
  }
};

// Validação de limite
const limitConfig = {
  key: 'api_rate_limit',
  value: 1000,
  type: 'number',
  validations: {
    required: true,
    minValue: 100,
    maxValue: 10000
  }
};

// Validação de enum
const statusConfig = {
  key: 'account_status',
  value: 'active',
  type: 'string',
  validations: {
    required: true,
    enum: ['active', 'inactive', 'suspended']
  }
};

// Validação customizada
const customConfig = {
  key: 'custom_field',
  value: 'test',
  type: 'string',
  validations: {
    custom: async (value) => {
      // Lógica de validação customizada
      return value.length > 0;
    }
  }
};
```

## Banco de Dados

### Tabelas

1. `configuration_groups`
   - Armazena grupos de configuração
   - Isolamento por organização
   - Soft delete

2. `configuration_values`
   - Armazena valores de configuração
   - Validações em nível de banco
   - Versionamento

3. `configuration_history`
   - Histórico de alterações
   - Rastreabilidade

### Funções

1. `validate_configuration_value()`
   - Trigger para validação de valores
   - Executa todas as regras configuradas

2. `get_configuration_value()`
   - Busca valor de configuração
   - Considera isolamento e status

## Segurança

### Row Level Security (RLS)

- Todas as tabelas têm RLS habilitado
- Políticas por organização
- Controle de acesso granular

### Políticas

1. **Leitura**
   - Usuários veem apenas dados de sua organização

2. **Inserção**
   - Usuários inserem apenas em sua organização

3. **Atualização**
   - Usuários atualizam apenas dados de sua organização

## Boas Práticas

1. **Organização**
   - Agrupar configurações relacionadas
   - Usar nomes descritivos
   - Documentar propósito

2. **Validação**
   - Definir regras claras
   - Usar tipos apropriados
   - Implementar validações customizadas

3. **Versionamento**
   - Registrar motivo das alterações
   - Manter histórico completo
   - Usar metadados para contexto

4. **Performance**
   - Usar índices apropriados
   - Limitar tamanho de valores
   - Implementar cache quando necessário

## Próximos Passos

1. **Cache**
   - Implementar sistema de cache
   - Invalidação inteligente
   - Cache por tenant

2. **Interface**
   - Dashboard de administração
   - Editor de configurações
   - Visualização de histórico

3. **Integrações**
   - Webhooks para alterações
   - API pública
   - Exportação de configurações

4. **Monitoramento**
   - Métricas de uso
   - Alertas de alterações
   - Logs detalhados 