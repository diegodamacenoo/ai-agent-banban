# Phase 8: Migration Guide - Sistema de Arquivamento e Exclusão

## Guia de Migração para Phase 8

### 1. Visão Geral da Migração

A Phase 8 introduz um sistema robusto de arquivamento e exclusão que requer mudanças no banco de dados, server actions e interfaces. Este guia detalha como migrar do sistema anterior para o novo.

### 2. Preparação para Migração

#### 2.1 Backup do Sistema

```bash
# Backup completo do banco de dados
npx supabase db dump --data-only > backup_pre_phase8.sql

# Backup das tabelas críticas
npx supabase db dump --table=base_modules --table=module_implementations --table=tenant_module_assignments > backup_modules_pre_phase8.sql
```

#### 2.2 Análise de Dependências

```sql
-- Verificar tabelas que referenciam módulos
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name = 'base_modules' OR ccu.table_name = 'module_implementations');
```

### 3. Execução da Migração

#### 3.1 Aplicar Migração de Banco de Dados

```bash
# Aplicar a migração
npx supabase db push

# Verificar se a migração foi aplicada corretamente
npx supabase db diff
```

#### 3.2 Validar Estrutura da Migração

```sql
-- Verificar se as colunas foram criadas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'base_modules' 
    AND column_name IN ('archived_at', 'deleted_at')
ORDER BY ordinal_position;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'module_implementations' 
    AND column_name IN ('archived_at', 'deleted_at')
ORDER BY ordinal_position;

-- Verificar se os índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('base_modules', 'module_implementations')
    AND indexname LIKE '%archive%' OR indexname LIKE '%delete%';
```

### 4. Migração de Dados Existentes

#### 4.1 Migração de Status Legado

Se você tinha um sistema de status anterior, migre os dados:

```sql
-- Migrar status 'archived' para archived_at
UPDATE base_modules 
SET archived_at = updated_at
WHERE status = 'archived' AND archived_at IS NULL;

-- Migrar status 'deleted' para deleted_at
UPDATE base_modules 
SET deleted_at = updated_at
WHERE status = 'deleted' AND deleted_at IS NULL;

-- Aplicar mesma lógica para module_implementations
UPDATE module_implementations 
SET archived_at = updated_at
WHERE status = 'archived' AND archived_at IS NULL;

UPDATE module_implementations 
SET deleted_at = updated_at
WHERE status = 'deleted' AND deleted_at IS NULL;
```

#### 4.2 Limpeza de Dados Órfãos

```sql
-- Identificar módulos órfãos (sem implementações)
SELECT 
    bm.id,
    bm.name,
    bm.created_at,
    COUNT(mi.id) as implementation_count
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id
GROUP BY bm.id, bm.name, bm.created_at
HAVING COUNT(mi.id) = 0;

-- Identificar implementações órfãs (sem módulo base)
SELECT 
    mi.id,
    mi.name,
    mi.base_module_id,
    mi.created_at
FROM module_implementations mi
LEFT JOIN base_modules bm ON mi.base_module_id = bm.id
WHERE bm.id IS NULL;

-- Identificar assignments órfãos
SELECT 
    tma.id,
    tma.organization_id,
    tma.base_module_id,
    tma.implementation_id,
    CASE 
        WHEN bm.id IS NULL THEN 'Missing base_module'
        WHEN mi.id IS NULL THEN 'Missing implementation'
        WHEN o.id IS NULL THEN 'Missing organization'
        ELSE 'OK'
    END as status
FROM tenant_module_assignments tma
LEFT JOIN base_modules bm ON tma.base_module_id = bm.id
LEFT JOIN module_implementations mi ON tma.implementation_id = mi.id
LEFT JOIN organizations o ON tma.organization_id = o.id
WHERE bm.id IS NULL OR mi.id IS NULL OR o.id IS NULL;
```

### 5. Atualização do Código

#### 5.1 Importações e Tipos

**Antes:**
```typescript
// Sem campos de arquivamento
interface BaseModule {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  // ... outros campos
}
```

**Depois:**
```typescript
// Com campos de arquivamento
interface BaseModule {
  id: string;
  name: string;
  is_active: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  // ... outros campos
}
```

#### 5.2 Chamadas de API

**Antes:**
```typescript
// Buscar módulos ativos
const { data: modules } = await supabase
  .from('base_modules')
  .select('*')
  .eq('status', 'active');
```

**Depois:**
```typescript
// Buscar módulos ativos (novo padrão)
const { data: modules } = await supabase
  .from('base_modules')
  .select('*')
  .is('archived_at', null)
  .is('deleted_at', null);

// Ou usar as funções server actions
const result = await getBaseModules({
  includeArchived: false,
  includeDeleted: false
});
```

#### 5.3 Componentes React

**Antes:**
```tsx
// Componente sem suporte a arquivamento
function ModuleCard({ module }: { module: BaseModule }) {
  return (
    <div className="module-card">
      <h3>{module.name}</h3>
      <span className={`status ${module.status}`}>
        {module.status}
      </span>
    </div>
  );
}
```

**Depois:**
```tsx
// Componente com suporte a arquivamento
function ModuleCard({ module }: { module: BaseModule }) {
  const getStatusDisplay = () => {
    if (module.deleted_at) return { text: 'Soft Deleted', class: 'deleted' };
    if (module.archived_at) return { text: 'Archived', class: 'archived' };
    if (!module.is_active) return { text: 'Inactive', class: 'inactive' };
    return { text: 'Active', class: 'active' };
  };

  const status = getStatusDisplay();

  return (
    <div className="module-card">
      <h3>{module.name}</h3>
      <span className={`status ${status.class}`}>
        {status.text}
      </span>
      {module.archived_at && (
        <small>Archived: {new Date(module.archived_at).toLocaleDateString()}</small>
      )}
    </div>
  );
}
```

### 6. Atualização de Interfaces

#### 6.1 Filtros de Listagem

**Antes:**
```tsx
// Sem filtros de arquivamento
function ModuleFilters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  return (
    <div className="filters">
      <select onChange={(e) => onFilterChange({ status: e.target.value })}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  );
}
```

**Depois:**
```tsx
// Com filtros de arquivamento
function ModuleFilters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const handleFilterChange = () => {
    onFilterChange({
      includeArchived,
      includeDeleted
    });
  };

  return (
    <div className="filters">
      <label>
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(e) => {
            setIncludeArchived(e.target.checked);
            handleFilterChange();
          }}
        />
        Include Archived
      </label>
      <label>
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => {
            setIncludeDeleted(e.target.checked);
            handleFilterChange();
          }}
        />
        Include Deleted
      </label>
    </div>
  );
}
```

#### 6.2 Botões de Ação

**Antes:**
```tsx
// Sem ações de arquivamento
function ModuleActions({ module }: { module: BaseModule }) {
  return (
    <div className="actions">
      <button onClick={() => editModule(module.id)}>Edit</button>
      <button onClick={() => deleteModule(module.id)}>Delete</button>
    </div>
  );
}
```

**Depois:**
```tsx
// Com ações de arquivamento
function ModuleActions({ module, onAction }: { module: BaseModule; onAction: () => void }) {
  const handleArchive = async () => {
    await archiveBaseModule(module.id);
    onAction();
  };

  const handleSoftDelete = async () => {
    await deleteBaseModule(module.id);
    onAction();
  };

  const handleRestore = async () => {
    await restoreBaseModule(module.id);
    onAction();
  };

  const handlePurge = async () => {
    if (confirm('This will permanently delete the module. Are you sure?')) {
      await purgeBaseModule(module.id);
      onAction();
    }
  };

  const isDeleted = module.deleted_at !== null;
  const isArchived = module.archived_at !== null;
  const isActive = !isDeleted && !isArchived;

  return (
    <div className="actions">
      <button onClick={() => editModule(module.id)} disabled={isDeleted}>
        Edit
      </button>
      
      {isActive && (
        <>
          <button onClick={handleArchive}>Archive</button>
          <button onClick={handleSoftDelete}>Delete</button>
        </>
      )}
      
      {(isArchived || isDeleted) && (
        <button onClick={handleRestore}>Restore</button>
      )}
      
      {isDeleted && (
        <button onClick={handlePurge} className="danger">
          Purge
        </button>
      )}
    </div>
  );
}
```

### 7. Migração de Permissões

#### 7.1 Novas Permissões

```sql
-- Inserir novas permissões no sistema
INSERT INTO permissions (name, description, category) VALUES
('archive_modules', 'Can archive modules', 'module_management'),
('restore_modules', 'Can restore archived/deleted modules', 'module_management'),
('purge_modules', 'Can permanently delete modules', 'module_management'),
('view_archived_modules', 'Can view archived modules', 'module_management'),
('view_deleted_modules', 'Can view soft-deleted modules', 'module_management');
```

#### 7.2 Atualizar Roles

```sql
-- Atribuir permissões aos roles existentes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' 
  AND p.name IN ('archive_modules', 'restore_modules', 'view_archived_modules', 'view_deleted_modules');

-- Permissão de purge apenas para master_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'master_admin' 
  AND p.name = 'purge_modules';
```

### 8. Testes de Migração

#### 8.1 Testes Funcionais

```typescript
// Teste de migração de dados
describe('Phase 8 Migration', () => {
  test('should migrate existing status to new fields', async () => {
    // Verificar se dados foram migrados corretamente
    const { data: modules } = await supabase
      .from('base_modules')
      .select('*')
      .not('archived_at', 'is', null);
    
    expect(modules.length).toBeGreaterThan(0);
    modules.forEach(module => {
      expect(module.archived_at).toBeDefined();
      expect(new Date(module.archived_at).getTime()).toBeGreaterThan(0);
    });
  });

  test('should maintain referential integrity', async () => {
    // Verificar se não há dados órfãos
    const { data: orphanImplementations } = await supabase
      .from('module_implementations mi')
      .select('mi.id, mi.name')
      .leftJoin('base_modules bm', 'mi.base_module_id', 'bm.id')
      .whereNull('bm.id');
    
    expect(orphanImplementations.length).toBe(0);
  });
});
```

#### 8.2 Testes de Performance

```typescript
// Teste de performance com novos índices
describe('Performance Tests', () => {
  test('should query active modules efficiently', async () => {
    const startTime = Date.now();
    
    const { data: modules } = await supabase
      .from('base_modules')
      .select('*')
      .is('archived_at', null)
      .is('deleted_at', null)
      .limit(100);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500); // Deve ser rápido com índices
    expect(modules.length).toBeGreaterThan(0);
  });
});
```

### 9. Rollback Strategy

#### 9.1 Script de Rollback

```sql
-- Rollback em caso de problemas
-- ATENÇÃO: Execute apenas se necessário e com backup

-- Remover índices criados
DROP INDEX IF EXISTS idx_base_modules_archived_at;
DROP INDEX IF EXISTS idx_base_modules_deleted_at;
DROP INDEX IF EXISTS idx_module_implementations_archived_at;
DROP INDEX IF EXISTS idx_module_implementations_deleted_at;

-- Remover colunas (cuidado com perda de dados)
ALTER TABLE base_modules DROP COLUMN IF EXISTS archived_at;
ALTER TABLE base_modules DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE module_implementations DROP COLUMN IF EXISTS archived_at;
ALTER TABLE module_implementations DROP COLUMN IF EXISTS deleted_at;

-- Restaurar dados do backup se necessário
-- psql -d database_name -f backup_pre_phase8.sql
```

#### 9.2 Checklist de Rollback

- [ ] Verificar se todas as funcionalidades críticas estão funcionando
- [ ] Confirmar que os dados não foram corrompidos
- [ ] Validar que as permissões estão corretas
- [ ] Testar fluxos de usuário principais
- [ ] Verificar logs de erro
- [ ] Confirmar performance aceitável

### 10. Monitoramento Pós-Migração

#### 10.1 Métricas para Monitorar

```sql
-- Queries de monitoramento
-- Contar módulos por estado
SELECT 
    COUNT(*) as total_modules,
    COUNT(CASE WHEN archived_at IS NULL AND deleted_at IS NULL THEN 1 END) as active_modules,
    COUNT(CASE WHEN archived_at IS NOT NULL AND deleted_at IS NULL THEN 1 END) as archived_modules,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_modules
FROM base_modules;

-- Monitorar performance de queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%base_modules%'
ORDER BY mean_time DESC;

-- Verificar uso de índices
SELECT 
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%archive%' OR indexname LIKE '%delete%';
```

#### 10.2 Alertas e Logs

```typescript
// Configurar alertas para operações críticas
const alertThresholds = {
  purgeOperations: 5,        // Máximo 5 purges por dia
  massArchiving: 50,         // Alerta se mais de 50 módulos arquivados por vez
  performanceDegrade: 1000,  // Alerta se queries > 1s
};

// Log de operações críticas
function logCriticalOperation(operation: string, details: any) {
  console.error(`[CRITICAL] ${operation}:`, {
    timestamp: new Date().toISOString(),
    operation,
    details,
    user: details.userId,
    ip: details.ipAddress
  });
  
  // Enviar para sistema de monitoramento
  // sendToMonitoring('critical_operation', { operation, details });
}
```

### 11. Documentação para Usuários

#### 11.1 Mudanças Visíveis

**Para Administradores:**
- Novos botões de "Archive" e "Restore" nos módulos
- Filtros para visualizar módulos arquivados/deletados
- Confirmação adicional para exclusão permanente
- Histórico de mudanças nos logs de auditoria

**Para Usuários Finais:**
- Módulos arquivados não aparecem mais nas listagens por padrão
- Melhor performance nas páginas de módulos
- Funcionalidades mais estáveis com soft-delete

#### 11.2 Treinamento da Equipe

**Conceitos Importantes:**
1. **Arquivamento**: Oculta temporariamente, pode ser restaurado
2. **Soft Delete**: Marca para exclusão, pode ser restaurado
3. **Purge**: Exclusão permanente, irreversível
4. **Cascata**: Ações no módulo base afetam implementações

**Fluxo Recomendado:**
1. Primeiro, arquive módulos não utilizados
2. Se não precisar mais, faça soft delete
3. Só use purge se tiver certeza absoluta
4. Sempre verifique dependências antes de excluir

### 12. Checklist de Migração

#### 12.1 Pré-Migração

- [ ] Backup completo do banco de dados
- [ ] Backup das tabelas críticas
- [ ] Análise de dependências
- [ ] Revisão do código que será afetado
- [ ] Testes em ambiente de staging

#### 12.2 Durante a Migração

- [ ] Aplicar migração de banco de dados
- [ ] Validar estrutura das tabelas
- [ ] Migrar dados existentes
- [ ] Limpar dados órfãos
- [ ] Atualizar código das aplicações

#### 12.3 Pós-Migração

- [ ] Testes funcionais completos
- [ ] Testes de performance
- [ ] Verificação de integridade dos dados
- [ ] Monitoramento de logs de erro
- [ ] Documentação de mudanças
- [ ] Treinamento da equipe

### 13. Solução de Problemas

#### 13.1 Problemas Comuns

**Erro: "Constraint violation"**
```sql
-- Verificar constraints que podem estar falhando
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('base_modules', 'module_implementations');
```

**Performance lenta após migração**
```sql
-- Analisar planos de execução
EXPLAIN ANALYZE SELECT * FROM base_modules 
WHERE archived_at IS NULL AND deleted_at IS NULL;

-- Verificar se índices estão sendo usados
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename = 'base_modules';
```

**Dados inconsistentes**
```sql
-- Verificar inconsistências
SELECT 
    bm.id,
    bm.name,
    bm.archived_at,
    bm.deleted_at,
    COUNT(mi.id) as active_implementations
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id 
    AND mi.archived_at IS NULL 
    AND mi.deleted_at IS NULL
WHERE bm.archived_at IS NOT NULL OR bm.deleted_at IS NOT NULL
GROUP BY bm.id, bm.name, bm.archived_at, bm.deleted_at
HAVING COUNT(mi.id) > 0;
```

### 14. Conclusão

A migração para Phase 8 introduz um sistema robusto de arquivamento e exclusão que melhora significativamente a gestão de módulos. Seguindo este guia passo a passo, você deve conseguir migrar com sucesso mantendo a integridade dos dados e a performance do sistema.

**Pontos Críticos para Lembrar:**
- Sempre faça backup antes de iniciar
- Teste extensivamente em ambiente de staging
- Monitor performance pós-migração
- Treine a equipe nos novos conceitos
- Mantenha logs detalhados de todas as operações

**Suporte:**
- Documentação técnica: `TECHNICAL_SPECIFICATIONS.md`
- Resumo da implementação: `IMPLEMENTATION_SUMMARY.md`
- Código fonte: `src/app/actions/admin/configurable-modules.ts`

---

**Preparado por**: Claude Code  
**Data**: 2025-01-14  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para Produção