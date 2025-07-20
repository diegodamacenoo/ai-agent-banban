# Arquitetura Multi-Tenant: Separação de Conceitos

## Problema Identificado

Durante o desenvolvimento, havia confusão entre nomenclaturas específicas de cliente (ex: "BanBan") e nomenclaturas genéricas do sistema multi-tenant. Isso gerava código hardcoded e dificultava a escalabilidade.

## Estrutura Correta

### 1. Sistema Base (Genérico)
- **Localização**: `src/core/`, `src/shared/`, `src/app/`
- **Propósito**: Funcionalidades genéricas que servem para qualquer cliente
- **Nomenclatura**: Sempre genérica (ex: "Cliente Customizado", "Análise Avançada")

### 2. Módulos Padrão
- **Localização**: `src/core/modules/standard/`
- **Propósito**: Módulos base que podem ser utilizados por qualquer cliente
- **Exemplos**: `performance-base`, `user-management`, `reporting`

### 3. Clientes Customizados
- **Localização**: `src/clients/[cliente]/`, `src/core/modules/[cliente]/`
- **Propósito**: Implementações específicas para cada cliente
- **Exemplos**: BanBan, Riachuelo, C&A
- **Nomenclatura**: Pode usar nome específico do cliente

## Conceitos Importantes

### BanBan é um Cliente, não o Produto
- **BanBan Fashion** = Cliente que usa nossa solução
- **Sistema Axon** = Nossa solução/produto
- **Implementação BanBan** = Customização específica para este cliente

### Separação Clara
```
src/
├── core/           # Sistema base genérico
├── shared/         # Componentes reutilizáveis
├── app/           # Rotas e layouts genéricos
└── clients/       # Implementações por cliente
    ├── banban/    # Customizações específicas do BanBan
    ├── registry.ts # Registro de clientes
```

## Arquivos Corrigidos

### 1. UnifiedSidebar (`src/shared/components/unified-sidebar.tsx`)
**Antes**: Hardcoded "BanBan Intelligence"
```typescript
title: 'BanBan Intelligence',
items: [
  { title: 'Insights', href: '/banban/insights' }
]
```

**Depois**: Baseado em indústria/setor
```typescript
title: getIndustrySubtitle(industryType), // "Análise de Moda"
items: [
  { title: 'Insights', href: '/insights' }
]
```

### 2. Tenant Middleware (`src/shared/utils/tenant-middleware.ts`)
**Antes**: Configurações hardcoded para clientes específicos
```typescript
export const TENANT_CONFIG = {
  'banban': { organizationName: 'BanBan Fashion' }
}
```

**Depois**: Configurações por tipo de indústria
```typescript
export const INDUSTRY_DEFAULTS = {
  fashion: { features: ['fashion-metrics'] },
  grocery: { features: ['inventory-tracking'] }
}
```

### 3. Setup Page (`src/app/(protected)/admin/setup-custom-client/`)
**Antes**: `setup-banban/` com textos específicos
**Depois**: `setup-custom-client/` com configuração por indústria

## Estrutura de Módulos Customizados

### ✅ Correto - Módulos Específicos por Cliente
```
src/core/modules/banban/
├── insights/           # Lógica específica de insights do BanBan
├── performance/        # Performance específica para moda
├── alerts/            # Alertas customizados
└── config.ts          # Configuração específica
```

### ✅ Correto - Interface de Cliente
```
src/clients/banban/
├── components/        # Componentes UI específicos
├── config/           # Configurações de tema/branding
└── index.ts          # Exportações
```

## Regras de Nomenclatura

### Sistema Base (Sempre Genérico)
- ✅ "Cliente Customizado"
- ✅ "Análise Avançada"
- ✅ "Gestão de [Setor]"
- ❌ "BanBan Intelligence"
- ❌ "Sistema BanBan"

### Módulos Customizados (Pode ser Específico)
- ✅ `banban-performance`
- ✅ `BanbanInsight`
- ✅ `BANBAN_MODULE_CONFIG`
- ✅ `/api/modules/banban/insights`

### Configuração Dinâmica
- ✅ Baseada em `industryType` (fashion, grocery, healthcare)
- ✅ Configuração via banco de dados
- ❌ Hardcoded por cliente específico

## Vantagens desta Arquitetura

1. **Escalabilidade**: Fácil adicionar novos clientes
2. **Manutenibilidade**: Separação clara de responsabilidades
3. **Reutilização**: Módulos base podem ser compartilhados
4. **Flexibilidade**: Cada cliente pode ter customizações específicas
5. **Padronização**: Interface unificada para administração

## Exemplo Prático

### Adicionando Novo Cliente (Riachuelo)
1. Criar `src/clients/riachuelo/`
2. Criar `src/core/modules/riachuelo/` (se precisar de customizações)
3. Registrar no `src/clients/registry.ts`
4. Configurar no banco: `client_type: 'custom'`, `industry_type: 'fashion'`
5. Sistema automaticamente aplica configurações de indústria "fashion"

### Resultado
- Riachuelo usa os mesmos módulos base que BanBan
- Interface administrativa genérica funciona para ambos
- Cada um pode ter customizações específicas se necessário
- Sidebar mostra "Análise de Moda" para ambos (baseado em `industry_type`)

## Conclusão

A arquitetura agora suporta verdadeiro multi-tenant:
- **Sistema genérico** para funcionalidades comuns
- **Configuração por indústria** para padrões setoriais  
- **Customização por cliente** quando necessário
- **Nomenclatura consistente** que não favorece nenhum cliente específico 