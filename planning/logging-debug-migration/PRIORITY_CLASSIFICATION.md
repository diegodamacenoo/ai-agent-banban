# Classificação de Prioridades - Migração Debug

**Sistema de Classificação:** ⭐ CRÍTICO | 🔥 ALTO | 📝 MÉDIO | ❌ NÃO MIGRAR

## 🎯 Critérios de Classificação

### ⭐ **CRÍTICO** - Migrar PRIMEIRO
Logs que admins **frequentemente** precisam para:
- Diagnosticar problemas de módulos
- Entender fluxos de configuração automática
- Investigar falhas de integração
- Monitorar operações administrativas

### 🔥 **ALTO** - Migrar na Fase 2
Logs **ocasionalmente** úteis para:
- Performance debugging
- Troubleshooting de middleware
- Auditoria de segurança
- Monitoramento de APIs

### 📝 **MÉDIO** - Migrar se houver tempo
Logs que **raramente** são necessários:
- Debug de componentes específicos
- Logs informativos de baixo impacto
- Utilitários auxiliares

### ❌ **NÃO MIGRAR** - Manter console.*
- Erros críticos sempre visíveis
- Logs temporários de desenvolvimento
- Bibliotecas externas
- Status essencial da aplicação

---

## 📁 Classificação por Diretório

### **src/app/actions/admin/modules/** ⭐ CRÍTICO
```typescript
auto-config-applier.ts          ⭐ // Sistema de configuração automática
base-modules.ts                 ⭐ // Operações em módulos base  
module-implementations.ts       ⭐ // CRUD implementações
tenant-module-assignments.ts    ⭐ // Atribuições por tenant
module-backups.ts              🔥 // Sistema de backup
system-config-utils.ts         🔥 // Utilitários de config (já implementado)
utils.ts                       📝 // Utilitários gerais
call-tracker.ts                📝 // Rastreamento de chamadas
```

**Razão:** Admins usam essas funcionalidades diariamente para gerenciar o sistema.

### **src/core/services/** 🔥 ALTO
```typescript
module-discovery.ts             ⭐ // Descoberta de módulos crítica
ModuleIntegrationService.ts     ⭐ // Integração entre módulos
TenantOperationalStatusService.ts ⭐ // Status operacional
module-metadata.ts             🔥 // Metadados dos módulos
module-file-monitor.ts         🔥 // Monitor de arquivos
ModuleCatalogService.ts        📝 // Catálogo de módulos
TenantModuleService.ts         📝 // Serviços por tenant
GenericDataService.ts          📝 // Serviços genéricos
```

**Razão:** Core services definem comportamento fundamental do sistema.

### **src/shared/utils/** 🔥 ALTO
```typescript
tenant-middleware.ts           ⭐ // Middleware crítico
subdomain-middleware.ts        🔥 // Resolução de subdomínio
audit-logger.ts               🔥 // Logs de auditoria
api-router.ts                 📝 // Roteamento de APIs
module-mapping.ts             📝 // Mapeamento de módulos
security-detector.ts          📝 // Detector de segurança
```

**Razão:** Middleware afeta toda requisição, debug é essencial.

### **src/app/actions/admin/** (não-modules) 📝 MÉDIO
```typescript
users.ts                      🔥 // Gerenciamento de usuários
organizations.ts              🔥 // Gerenciamento de orgs
tenant-operational-status.ts  🔥 // Status operacional
dashboard.ts                  📝 // Dashboard admin
scan-modules.ts               📝 // Scan de módulos
```

**Razão:** Operações administrativas importantes mas menos frequentes.

### **src/app/actions/auth/** ❌ NÃO MIGRAR (maioria)
```typescript
sessions.ts                   📝 // Gestão de sessões (seletivo)
mfa.ts                       ❌ // MFA - manter console.error
account-management.ts        ❌ // Gerenciamento - manter console.error
data-export-processor.ts     📝 // Export de dados (seletivo)
```

**Razão:** Auth logs devem sempre ser visíveis por segurança.

### **src/app/api/v1/** ❌ NÃO MIGRAR
```typescript
user-management/*/route.ts    ❌ // APIs - manter console.error
auth/*/route.ts              ❌ // APIs - manter console.error
admin/*/route.ts             ❌ // APIs - manter console.error
```

**Razão:** API routes precisam de logs sempre visíveis.

### **src/shared/hooks/** 📝 MÉDIO
```typescript
useDashboardData.ts          📝 // Hook de dashboard
useDynamicLayout.ts          📝 // Hook de layout
useSecurityAlerts.ts         📝 // Hook de alertas
```

**Razão:** Hooks são debugados pelos desenvolvedores, não admins.

---

## 🎯 Exemplos Práticos

### ⭐ MIGRAR (Crítico)
```typescript
// Em auto-config-applier.ts
console.debug('Aplicando configurações automáticas', data);
// → MIGRAR - Admin precisa saber quando configs são aplicadas

// Em module-discovery.ts  
console.log('Módulo descoberto:', moduleInfo);
// → MIGRAR - Essential para troubleshooting de módulos
```

### 🔥 MIGRAR (Alto)
```typescript
// Em tenant-middleware.ts
console.debug('Resolvendo tenant:', { subdomain, tenantId });
// → MIGRAR - Útil para debug de roteamento

// Em module-metadata.ts
console.log('Metadados carregados:', metadata);
// → MIGRAR - Pode ser útil ocasionalmente
```

### ❌ NÃO MIGRAR
```typescript
// Em auth/mfa.ts
console.error('Falha na verificação MFA:', error);
// → MANTER - Erro crítico sempre visível

// Em api/*/route.ts
console.error('Erro na API:', error);
// → MANTER - APIs precisam de logs sempre visíveis
```

---

## 📊 Estatísticas Estimadas

| Classificação | Arquivos | Console.* | % do Total |
|---------------|----------|-----------|------------|
| ⭐ CRÍTICO    | ~25      | ~300      | 26%        |
| 🔥 ALTO       | ~35      | ~250      | 22%        |
| 📝 MÉDIO      | ~40      | ~200      | 18%        |
| ❌ NÃO MIGRAR | ~51      | ~392      | 34%        |
| **TOTAL**     | **151**  | **1142**  | **100%**   |

## 🎯 Meta de Migração

**Objetivo:** Migrar ~66% dos logs relevantes (750 de ~1142)  
**Manter:** ~34% como console.* (principalmente erros críticos)

Esta proporção garante que admins tenham controle sobre logs úteis sem comprometer a visibilidade de erros críticos.