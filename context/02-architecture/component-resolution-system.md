# Sistema de Resolução de Componentes

Este documento explica como o sistema resolve e carrega componentes de implementação de módulos dinamicamente.

## Visão Geral

O sistema usa um **Dynamic Loader** (`src/lib/modules/dynamic-loader.tsx`) que implementa múltiplas estratégias para localizar e carregar componentes React de implementações de módulos.

## Campos de Configuração

### 1. Slug (Base Module)
- **Função**: Identificador técnico único do módulo base
- **Uso**: Base para auto-resolução e identificação no sistema
- **Exemplo**: `alerts`, `performance-analytics`
- **Imutável**: Não pode ser alterado após criação

### 2. Route Pattern (Base Module)
- **Função**: Define a URL e namespace para resolução
- **Uso**: Tem prioridade sobre o slug na auto-resolução
- **Exemplo**: `alerts` → `/tenant/alerts`
- **Resolução**: Usado como namespace em `/{route_pattern}/implementations/`

### 3. Component Path (Implementation)
- **Função**: Define como localizar o componente React
- **Estratégias**: Múltiplas abordagens de resolução

## Estratégias de Resolução

O Dynamic Loader tenta carregar componentes na seguinte ordem:

### 1. Mapeamento Direto (Recomendado)
```javascript
// No banco: component_path = "BanbanAlertsImplementation"
// Sistema busca em KNOWN_IMPLEMENTATIONS:
'BanbanAlertsImplementation': () => import('@/app/(protected)/[slug]/(modules)/alerts/implementations/BanbanAlertsImplementation')
```

**Vantagens:**
- ✅ Mais confiável
- ✅ Funciona independente do contexto
- ✅ Import absoluto garantido
- ✅ Melhor para manutenção

### 2. Path Explícito do Banco
```javascript
// component_path = "./alerts/implementations/BanbanAlerts"
// ou
// component_path = "@/app/(protected)/[slug]/(modules)/alerts/implementations/BanbanAlerts"
```

### 3. Auto-Resolução Inteligente
```javascript
// Baseado em route_pattern/slug + implementation_key
// route_pattern = "alerts", implementation_key = "banban-alerts"
// Resolve para: ../alerts/implementations/BanbanAlertsImplementation
```

### 4. Fallback por Implementation Key
```javascript
// Usa mapeamento conhecido baseado no nome gerado
// generateComponentName(moduleSlug, implementationKey)
```

### 5. Fallback com Key Normalizada
```javascript
// "banban-alerts" → "banban"
// Tenta resolver com chave simplificada
```

### 6. Fallback Standard
```javascript
// Tenta carregar implementação "standard" como último recurso
```

## Configuração Recomendada

### Para Novos Módulos:

1. **Base Module:**
   - `slug`: nome técnico único (ex: `alerts`)
   - `route_pattern`: mesmo que slug (ex: `alerts`)

2. **Implementation:**
   - `component_path`: apenas nome do componente (ex: `BanbanAlertsImplementation`)
   - `implementation_key`: descritivo (ex: `banban-alerts`)

### Exemplo Completo:

```sql
-- Base Module
INSERT INTO base_modules (slug, route_pattern, name) 
VALUES ('alerts', 'alerts', 'Alert Management');

-- Implementation
INSERT INTO module_implementations (
  base_module_id, 
  implementation_key, 
  component_path,
  name
) VALUES (
  [base_module_id],
  'banban-alerts',
  'BanbanAlertsImplementation',
  'BanBan Alerts System'
);
```

```typescript
// No KNOWN_IMPLEMENTATIONS
'BanbanAlertsImplementation': () => import('@/app/(protected)/[slug]/(modules)/alerts/implementations/BanbanAlertsImplementation')
```

## Troubleshooting

### Problema: "Implementação não encontrada"

1. **Verificar mapeamento direto:**
   ```typescript
   // Existe entrada em KNOWN_IMPLEMENTATIONS?
   console.log(KNOWN_IMPLEMENTATIONS['BanbanAlertsImplementation']);
   ```

2. **Verificar arquivo do componente:**
   ```bash
   # Arquivo existe?
   ls src/app/\(protected\)/\[slug\]/\(modules\)/alerts/implementations/BanbanAlertsImplementation.tsx
   ```

3. **Verificar export default:**
   ```typescript
   // Componente tem export default?
   export default function BanbanAlertsImplementation({ ... }) { ... }
   ```

### Problema: "Cannot find module"

- **Causa**: Path relativo não funciona no contexto servidor
- **Solução**: Usar mapeamento direto com import absoluto

### Logs de Debug

O sistema produz logs detalhados para troubleshooting:

```javascript
// Ativar logs condicionais em development
conditionalDebugLogSync('[DynamicLoader] Loading attempt', { path, method });
```

## Melhores Práticas

1. **Use mapeamento direto** sempre que possível
2. **Padronize nomes** de componentes (ex: `{Client}{Module}Implementation`)
3. **Mantenha consistência** entre slug e route_pattern
4. **Teste carregamento** após criar nova implementação
5. **Use paths absolutos** para imports customizados

## Cache

O sistema implementa cache inteligente:
- **Cache Hit**: Componente já carregado
- **Error Cache**: Remove automaticamente componentes de erro
- **Development**: Cache limpo na inicialização

```typescript
// Limpar cache manualmente (debugging)
clearComponentCache();

// Ver estatísticas do cache
getCacheStats();
```