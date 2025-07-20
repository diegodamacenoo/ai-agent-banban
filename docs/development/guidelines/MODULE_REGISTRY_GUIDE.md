# Guia do ModuleRegistry

O ModuleRegistry é um sistema central para gerenciamento de módulos no projeto, permitindo o carregamento dinâmico e gerenciamento de módulos padrão e customizados.

## Estrutura

O sistema é composto por três componentes principais:

1. **ModuleRegistry**: Classe principal que gerencia o ciclo de vida dos módulos
2. **ModuleLoader**: Responsável pelo carregamento dinâmico e validação dos módulos
3. **Types**: Definições de tipos e interfaces para configuração dos módulos

## Tipos de Módulos

### Módulos Padrão (Standard)
- Implementação base para funcionalidades comuns
- Localizados em `src/core/modules/standard`
- Configuração via `StandardModuleConfig`
- Exemplo: Módulo de Inventário Base

### Módulos Customizados (Custom)
- Implementações específicas para clientes
- Localizados em `src/core/modules/custom`
- Configuração via `CustomModuleConfig`
- Exemplo: Módulo de Inventário do BanBan

## Configuração

### StandardModuleConfig
```typescript
{
  id: string;
  name: string;
  version: string;
  clientType: 'standard';
  isActive: boolean;
  features: string[];
  endpoints: string[];
  dependencies?: string[];
}
```

### CustomModuleConfig
```typescript
{
  id: string;
  name: string;
  version: string;
  clientType: 'custom';
  isActive: boolean;
  customCodePath: string;
  apiEndpoints: {
    path: string;
    method: string;
    handler: string;
  }[];
  configuration: Record<string, any>;
  dependencies?: string[];
}
```

## Uso

### Registrando um Módulo
```typescript
const moduleRegistry = new ModuleRegistry();

// Registrar módulo padrão
await moduleRegistry.registerModule({
  id: 'inventory',
  name: 'Inventory Module',
  version: '1.0.0',
  clientType: 'standard',
  isActive: true,
  features: ['stock-control'],
  endpoints: ['/api/inventory']
});

// Registrar módulo customizado
await moduleRegistry.registerModule({
  id: 'banban-inventory',
  name: 'BanBan Inventory',
  version: '1.0.0',
  clientType: 'custom',
  isActive: true,
  customCodePath: 'src/modules/custom/banban-inventory',
  apiEndpoints: [
    { path: '/api/custom/inventory', method: 'GET', handler: 'handleInventory' }
  ],
  configuration: {
    stockThreshold: 100,
    notificationChannels: ['email']
  }
});
```

### Gerenciando Módulos
```typescript
// Obter módulo específico
const module = moduleRegistry.getModule('inventory');

// Listar todos os módulos
const allModules = moduleRegistry.getAllModules();

// Listar módulos por tipo
const customModules = moduleRegistry.getModulesByType('custom');

// Listar módulos ativos
const activeModules = moduleRegistry.getActiveModules();

// Desregistrar módulo
await moduleRegistry.unregisterModule('inventory');
```

## Validação

O sistema inclui validação automática para:
- Configurações básicas (id, name, version)
- Dependências entre módulos
- Endpoints e handlers
- Configurações específicas do módulo

## Eventos

O ModuleRegistry emite eventos para:
- Carregamento de módulo
- Descarregamento de módulo
- Erros durante operações

```typescript
const moduleRegistry = new ModuleRegistry({
  onModuleLoaded: (moduleId) => console.log(`Módulo ${moduleId} carregado`),
  onModuleUnloaded: (moduleId) => console.log(`Módulo ${moduleId} descarregado`),
  onModuleError: (moduleId, error) => console.error(`Erro no módulo ${moduleId}:`, error)
});
```

## Boas Práticas

1. **Estrutura de Diretórios**
   - Módulos padrão em `src/core/modules/standard`
   - Módulos customizados em `src/core/modules/custom`
   - Testes em `__tests__` dentro de cada módulo

2. **Implementação de Módulos**
   - Exportar classe principal como default
   - Implementar método de validação de configuração
   - Documentar endpoints e handlers
   - Incluir testes unitários

3. **Configuração**
   - Usar tipos específicos para configuração
   - Validar valores obrigatórios
   - Documentar opções de configuração

4. **Testes**
   - Testar carregamento/descarregamento
   - Validar configurações
   - Testar handlers de endpoints
   - Simular erros e casos de borda

## Próximos Passos

1. Implementar sistema de versionamento
2. Adicionar suporte a hot-reload
3. Implementar sistema de migração de configuração
4. Expandir documentação com mais exemplos
5. Adicionar ferramentas de desenvolvimento 