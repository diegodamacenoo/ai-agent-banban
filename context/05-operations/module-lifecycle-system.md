# Sistema de Module Lifecycle - Estado Atual

**Versão:** 3.1.0  
**Data:** 22/07/2025  
**Status:** ✅ Implementação Completa com Arquitetura 3-Camadas

## 🎯 **Visão Geral**

O Sistema de Lifecycle de Módulos evoluiu para uma arquitetura baseada em módulos base, implementações e atribuições de tenant. O sistema gerencia o ciclo de vida completo dos módulos desde a descoberta até o arquivamento, com monitoramento automático de arquivos e sincronização entre filesystem e banco de dados.

## 📊 **Estados do Lifecycle**

### **Status Principais**
- **`DISCOVERED`** - Módulo encontrado no filesystem, mas não registrado
- **`IMPLEMENTED`** - Módulo com arquivo presente e funcional  
- **`ACTIVE`** - Módulo em uso ativo pela organização
- **`MISSING`** - Módulo registrado mas arquivo ausente
- **`ORPHANED`** - Módulo registrado mas sem correspondência no filesystem
- **`ARCHIVED`** - Módulo arquivado pelo administrador

### **Transições de Estado**
```
DISCOVERED → IMPLEMENTED → ACTIVE
IMPLEMENTED → MISSING (arquivo removido)
ORPHANED → ARCHIVED (ação admin)  
ARCHIVED → IMPLEMENTED (reativação)
```

## 🏗️ **Arquitetura do Sistema**

### **1. Camada de Banco de Dados**
```sql
-- Módulos Base (catálogo)
base_modules {
  id, slug, name, description, category,
  is_active, created_at, updated_at, icon,
  route_pattern, permissions_required,
  supports_multi_tenant, config_schema,
  archived_at, deleted_at, status, version
}

-- Implementações dos Módulos
module_implementations {
  id, base_module_id, implementation_key,
  component_path, is_default, is_active,
  component_type, template_type, template_config,
  dependencies, config_schema_override,
  archived_at, deleted_at, name, description,
  version, audience, complexity, priority
}

-- Atribuições de Tenant
tenant_module_assignments {
  tenant_id, base_module_id, implementation_id,
  is_active, custom_config, assigned_at,
  updated_at, permissions_override, user_groups,
  activation_date, deactivation_date, assigned_by
}

-- Auditoria de Arquivos
module_file_audit {
  id, module_id, organization_id, event_type,
  file_path, file_hash, previous_hash,
  previous_status, new_status, impact_level,
  detected_at, metadata
}
```

### **2. Camada de Serviços**
```typescript
// Monitoramento de arquivos
ModuleFileMonitor {
  performHealthScan(): Promise<HealthScanResults>
  calculateFileHash(filePath: string): Promise<string>
  processDiscoveredModule(): Promise<ModuleScanResult>
  processMissingModule(): Promise<ModuleScanResult>
  updateModuleFileInfo(): Promise<void>
  markModuleAsMissing(): Promise<void>
}

// Descoberta de módulos  
ModuleDiscoveryService {
  scanAvailableModules(): Promise<AvailableModule[]>
  scanStandardModules(): Promise<StandardModule[]>
  scanCustomModules(): Promise<CustomModule[]>
}
```

### **3. Camada de API**
```typescript
// Server Actions Implementadas
getAssignedModulesForOrg(orgId): Promise<TenantModuleDetails[]>
getAvailableModulesForOrg(orgId): Promise<CoreModule[]>
assignModuleToOrg(orgId, moduleId): Promise<ActionResult>
unassignModuleFromOrg(orgId, moduleId): Promise<ActionResult>
updateTenantModuleStatus(orgId, moduleId, isEnabled): Promise<ActionResult>
updateTenantModuleVisibility(orgId, moduleId, isVisible): Promise<ActionResult>
getVisibleModulesForTenant(orgId): Promise<string[]>
```

### **4. Camada de Interface**
```typescript
// Componentes Principais
TenantModuleAssignments {
  - Visualização de módulos atribuídos
  - Ações de atribuição/remoção
  - Controle de status ativo/inativo
  - Filtros e busca
}

ModuleHealthMonitor {
  - Health scanning automático
  - Detecção de arquivos ausentes
  - Auditoria de mudanças
  - Alertas visuais por status
}
```

## 🔍 **Monitoramento Automático**

### **Health Scan Process Implementado**
1. **Descoberta**: Escaneia diretórios via `ModuleDiscoveryService.scanAvailableModules()`
2. **Comparação**: Compara com registros em `tenant_module_assignments`
3. **Validação**: Verifica integridade via hash MD5/SHA256
4. **Atualização**: Sincroniza status e `file_last_seen`
5. **Auditoria**: Registra mudanças em `module_file_audit`

### **Detecção de Problemas**
- **Módulos Ausentes**: Arquivo removido do filesystem → status `MISSING`
- **Módulos Órfãos**: Registro sem arquivo correspondente → status `ORPHANED`
- **Arquivos Modificados**: Hash diferente → auditoria de `updated`
- **Versões Desatualizadas**: Timestamps antigos detectados

## 🎛️ **Interface de Gestão**

### **Painel de Estatísticas**
```typescript
ModuleHealthStats = {
  discovered: number,
  implemented: number,
  active: number,
  planned: number,
  missing: number,
  orphaned: number,
  archived: number,
  total: number
}
```

### **Ações Disponíveis**
- **Atribuir Módulos**: `assignModuleToOrg()`
- **Remover Atribuições**: `unassignModuleFromOrg()`
- **Ativar/Desativar**: `updateTenantModuleStatus()`
- **Controlar Visibilidade**: `updateTenantModuleVisibility()`
- **Health Scan Manual**: `performHealthScan()`

## 🔧 **Integração com Sistema de Módulos**

### **Fluxo de Sincronização Atual**
```typescript
async function assignModuleToOrg(orgId, moduleId) {
  // 1. Inserir em tenant_module_assignments
  await supabase.from('tenant_module_assignments').insert({
    tenant_id: orgId,
    base_module_id: moduleId,
    is_active: true,
    assigned_at: new Date().toISOString()
  });
  
  // 2. Sincronizar com organizations.implementation_config
  const config = await getOrganizationConfig(orgId);
  const updatedConfig = {
    ...config,
    subscribed_modules: [...config.subscribed_modules, moduleId]
  };
  
  await updateOrganizationConfig(orgId, updatedConfig);
  
  // 3. Revalidar caches
  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath(`/${orgData.slug}`);
}
```

### **Gestão de Status**
```typescript
// Mapeamento de status entre sistemas
tenant_module_assignments.is_active ↔ operational_status
- is_active: true → 'ENABLED'  
- is_active: false → 'DISABLED'

// Sincronização dupla
1. tenant_module_assignments (dados estruturados)
2. organizations.implementation_config.subscribed_modules (compatibilidade)
```

## 🚨 **Sistema de Alertas**

### **Tipos de Alertas Implementados**
```typescript
ModuleHealthAlert = {
  alert_type: 'missing_file' | 'hash_changed' | 'version_mismatch' | 'module_restored',
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  details: Record<string, any>
}
```

### **Alertas Visuais por Status**
- **🔴 MISSING**: Módulos críticos ausentes
- **🟠 ORPHANED**: Módulos órfãos ou com problemas  
- **🔵 DISCOVERED**: Novos módulos descobertos
- **🟢 ACTIVE**: Sistema saudável

### **Auditoria de Mudanças**
```typescript
ModuleFileAudit = {
  event_type: 'discovered' | 'updated' | 'missing' | 'restored' | 'archived',
  impact_level: 'low' | 'medium' | 'high' | 'critical',
  detected_at: timestamp,
  metadata: { previous_hash, current_hash, file_path }
}
```

## 📋 **Boas Práticas Atuais**

### **Para Administradores**
1. **Monitoramento Automático**: Sistema realiza health scans periódicos
2. **Gestão de Atribuições**: Usar interface admin para gerenciar módulos
3. **Controle de Visibilidade**: Configurar módulos visíveis por tenant
4. **Sincronização**: Sistema mantém dupla sincronização automaticamente

### **Para Desenvolvedores**
1. **Padrão de Módulos**: Seguir estrutura `base_modules` + `module_implementations`
2. **Versionamento**: Usar campos `version` nas tabelas
3. **Tipo de Implementação**: Especificar `component_type` e `template_type`
4. **Dependências**: Documentar em `dependencies` array

## 🔄 **Casos de Uso Implementados**

### **Cenário 1: Novo Cliente**
```
1. Criar organização no admin
2. Usar getAvailableModulesForOrg() para listar módulos
3. Chamar assignModuleToOrg() para cada módulo necessário
4. Sistema sincroniza tenant_module_assignments + implementation_config
5. Módulos aparecem automaticamente na sidebar do tenant
```

### **Cenário 2: Módulo Ausente**
```
1. ModuleFileMonitor.performHealthScan() detecta ausência
2. Status muda para 'MISSING' via markModuleAsMissing()
3. Registro criado em module_file_audit
4. Admin vê alerta visual na interface
5. Ao restaurar arquivo, próximo scan detecta e atualiza
```

### **Cenário 3: Gestão de Visibilidade**
```
1. Admin usa updateTenantModuleVisibility()
2. is_active é atualizado em tenant_module_assignments
3. Sistema revalida caches do tenant via revalidatePath()
4. Sidebar do cliente reflete mudanças instantaneamente
5. Auditoria registrada automaticamente
```

## 🛠️ **Troubleshooting Atual**

### **Problemas Comuns**
1. **Health Scan Falha**: Verificar ModuleFileMonitor.isScanInProgress()
2. **Sincronização**: Verificar tenant_module_assignments vs implementation_config
3. **Cache Stale**: Executar revalidatePath() para rotas do tenant
4. **Módulos Invisíveis**: Verificar is_active em tenant_module_assignments

### **Comandos de Debug Implementados**
```typescript
// Health scan manual
const monitor = new ModuleFileMonitor();
await monitor.performHealthScan();

// Verificar módulos atribuídos
await getAssignedModulesForOrg(orgId);

// Módulos disponíveis para atribuição  
await getAvailableModulesForOrg(orgId);

// Módulos visíveis para tenant
await getVisibleModulesForTenant(orgId);
```

## 📈 **Estado Atual vs Documentado**

### **✅ Implementado**
- ✅ Estrutura de banco nova (base_modules, module_implementations, tenant_module_assignments)
- ✅ Server actions completas para CRUD de módulos
- ✅ ModuleFileMonitor com health scanning
- ✅ ModuleDiscoveryService para descoberta automática
- ✅ Sistema de auditoria em module_file_audit
- ✅ Sincronização dupla (tenant_module_assignments + implementation_config)
- ✅ Revalidação automática de cache
- ✅ Tipos TypeScript completos em module-lifecycle.ts

### **🚧 Em Desenvolvimento**
- 🚧 Interface admin para health monitoring
- 🚧 Alertas visuais baseados em status
- 🚧 Dashboard de estatísticas de health
- 🚧 Jobs automáticos de scanning

### **📋 Backlog**
- 📋 Notificações por email/webhook
- 📋 Auto-healing de problemas simples  
- 📋 Métricas de performance detalhadas
- 📋 Predição de problemas via ML

## 🚀 **Próximos Passos**

### **Fase Atual: Completar Interface**
1. **Health Dashboard**: Implementar painel visual de estatísticas
2. **Alertas UI**: Sistema de notificações na interface admin
3. **Manual Scanning**: Botão para triggerar health scan manual
4. **Status Indicators**: Indicadores visuais por status de módulo

### **Fase Seguinte: Automação**
1. **Scheduled Jobs**: Health scanning automático via cron
2. **Auto-notifications**: Alertas automáticos para administradores
3. **Self-healing**: Correção automática de problemas simples
4. **Performance Monitoring**: Métricas detalhadas de sistema

---

**O sistema evoluiu significativamente com nova arquitetura modular e monitoramento robusto. A base está sólida para expansões futuras.** 