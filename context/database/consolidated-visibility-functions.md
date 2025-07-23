# Funções Consolidadas de Visibilidade de Módulos

**Criado**: Janeiro 2025  
**Propósito**: Unificar controle de visibilidade de módulos, eliminando disparidades entre configuração administrativa e interface do tenant.

## Problema Resolvido

Antes das funções consolidadas, o sistema tinha **4 fontes conflitantes** de configuração de módulos:
1. `tenant_module_assignments.is_active`
2. `organizations.implementation_config.subscribed_modules`
3. `organizations.visible_modules`
4. Cache desatualizado na API

Resultado: Módulos apareciam na sidebar sem configuração adequada ou vice-versa.

## Funções Implementadas

### 1. `get_user_visible_modules()`

**Função principal** que centraliza toda lógica de visibilidade.

```sql
get_user_visible_modules(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  module_slug VARCHAR(50),
  module_name VARCHAR(100), 
  module_category VARCHAR(50),
  can_view BOOLEAN,
  can_access BOOLEAN,
  assignment_id UUID,
  custom_config JSONB,
  permissions_override TEXT[],
  status TEXT,
  implementation_key VARCHAR(50),
  component_path VARCHAR(255)
)
```

#### Lógica de Visibilidade

**can_view** (Controla se aparece na sidebar):
```sql
CASE 
  WHEN tma.is_visible = false THEN false
  WHEN tma.status IN ('archived', 'deleted') THEN false
  WHEN tma.deactivation_date IS NOT NULL AND tma.deactivation_date < NOW() THEN false
  WHEN tma.activation_date IS NOT NULL AND tma.activation_date > NOW() THEN false
  ELSE true
END
```

**can_access** (Controla se pode ser acessado):
```sql
CASE 
  WHEN tma.is_active = false THEN false
  WHEN tma.status != 'active' THEN false
  WHEN bm.archived_at IS NOT NULL THEN false
  WHEN bm.deleted_at IS NOT NULL THEN false
  WHEN mi.archived_at IS NOT NULL THEN false
  WHEN mi.deleted_at IS NOT NULL THEN false
  ELSE true
END
```

### 2. `get_visible_modules_for_tenant()`

**Função simplificada** para uso em APIs.

```sql
get_visible_modules_for_tenant(p_tenant_id UUID)
RETURNS TABLE(
  module_slug VARCHAR(50),
  module_name VARCHAR(100),
  component_path VARCHAR(255),
  custom_config JSONB
)
```

**Uso**: Filtra automaticamente apenas módulos com `can_view = true` AND `can_access = true`.

### 3. `user_can_access_module()`

**Função de validação** para verificar acesso a módulo específico.

```sql
user_can_access_module(
  p_tenant_id UUID,
  p_module_slug VARCHAR(50),
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
```

**Uso**: Validação em middleware de rotas para evitar acesso não autorizado.

## Integração com Sistema

### ModuleConfigurationService

Antes (Fragmentado):
```typescript
const { data: assignments } = await supabase
  .from('tenant_module_assignments')
  .select('...')
  .eq('tenant_id', orgId)
  .eq('is_active', true);
```

Depois (Consolidado):
```typescript
const { data: modules } = await supabase
  .rpc('get_user_visible_modules', {
    p_tenant_id: orgId
  });

const visibleModules = modules.filter(m => m.can_view && m.can_access);
```

### API de Configuração

A API `/api/modules/configuration` usa `ModuleConfigurationService.loadModuleConfigurations()` que:
1. Chama `get_user_visible_modules()`
2. Filtra por `can_view` e `can_access`  
3. Gera navegação automaticamente
4. Cache de 30 segundos com invalidação automática

### DynamicSidebar

O componente `DynamicSidebar` consome a API que usa as funções consolidadas:
```typescript
const response = await fetch(`/api/modules/configuration?organizationId=${orgId}`);
const { navigation } = await response.json();
// navigation contém apenas módulos verdadeiramente visíveis
```

## Cache Invalidation

Após mudanças administrativas, o cache é invalidado automaticamente:

```typescript
// Após criar/atualizar assignment
const { invalidateModuleCacheForOrg } = await import('../cache-invalidation');
await invalidateModuleCacheForOrg(tenantId);

// Após mudanças em base_modules/implementations  
await invalidateGlobalModuleCache();
```

## Performance

### Índices Criados
```sql
-- Índices específicos para as funções
CREATE INDEX idx_tenant_assignments_status ON tenant_module_assignments(tenant_id, status);
CREATE INDEX idx_tenant_assignments_visible ON tenant_module_assignments(tenant_id, is_visible);
CREATE INDEX idx_tenant_assignments_composite ON tenant_module_assignments(tenant_id, is_active, is_visible, status);
```

### Query Performance
- **Antes**: Múltiplas queries + joins + cache desalinhado
- **Depois**: 1 função otimizada + cache sincronizado

## Segurança

### Permissões
```sql
GRANT EXECUTE ON FUNCTION get_user_visible_modules(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_visible_modules_for_tenant(UUID) TO authenticated; 
GRANT EXECUTE ON FUNCTION user_can_access_module(UUID, VARCHAR(50), UUID) TO authenticated;
```

### RLS Bypass Controlado
As funções usam `SECURITY DEFINER` para acessar dados com privilégios da função, mas:
1. Apenas usuários autenticados podem executar
2. Lógica interna valida tenant_id
3. Não retorna dados de outros tenants

## Resultado

✅ **Fonte única de verdade** para visibilidade de módulos  
✅ **Cache sincronizado** com mudanças administrativas  
✅ **Sidebar alinhada** com configuração real  
✅ **Performance otimizada** com índices específicos  
✅ **Segurança granular** com validações centralizadas

**Status**: ✅ Implementado e funcionando (Jan 2025)