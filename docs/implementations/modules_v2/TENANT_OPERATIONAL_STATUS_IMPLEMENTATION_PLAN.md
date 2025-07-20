# Plano de Implementação: Gestão de Status Operacional por Tenant

## Visão Geral

Este plano implementa um sistema refinado de gestão de status operacional por tenant, com 10 status distintos e políticas de disponibilidade baseadas no ciclo de vida dos módulos.

## 1. Estrutura de Status Operacional

### 1.1 Status Operacionais (10 estados)

| Status             | Significado                    | Trigger              | Próximo Estado                       |
| ------------------ | ------------------------------ | -------------------- | ------------------------------------ |
| `REQUESTED`        | Tenant clicou "Enable"         | UI Action            | `PENDING_APPROVAL` ou `PROVISIONING` |
| `PENDING_APPROVAL` | Aguardando aprovação humana    | Auto/Manual          | `PROVISIONING` ou `DENIED`           |
| `PROVISIONING`     | Criando infra, tabelas, chaves | Background Job       | `ENABLED` ou `ERROR`                 |
| `ENABLED`          | Pronto para uso                | Provisioning Success | `UP_TO_DATE`, `UPGRADING`            |
| `UPGRADING`        | Executando scripts de upgrade  | Version Update       | `UP_TO_DATE` ou `ERROR`              |
| `UP_TO_DATE`       | Última versão GA instalada     | Health Check         | `UPGRADING`, `SUSPENDED`             |
| `SUSPENDED`        | Suspenso por pagamento/limites | Billing/Policy       | `ENABLED`, `DISABLED`                |
| `DISABLED`         | Desligado pelo tenant          | Tenant Action        | `ENABLED`, `ARCHIVED`                |
| `ARCHIVED`         | Dados exportados/purgados      | Retention Policy     | `DISABLED` (restore)                 |
| `ERROR`            | Falha de setup/upgrade         | System Error         | `PROVISIONING`, `UPGRADING`          |

### 1.2 Fluxo Principal

```
REQUESTED → PENDING_APPROVAL → PROVISIONING → ENABLED ↔ UPGRADING → UP_TO_DATE
                                                     ↓
                                            SUSPENDED/DISABLED → ARCHIVED
                                                     ↓
                                                   ERROR
```

## 2. Políticas de Disponibilidade

### 2.1 Campos de Política no `core_modules`

```sql
-- Adicionar campos de política de disponibilidade
ALTER TABLE core_modules ADD COLUMN default_visibility TEXT DEFAULT 'PUBLIC'
  CHECK (default_visibility IN ('HIDDEN', 'INTERNAL', 'PUBLIC'));

ALTER TABLE core_modules ADD COLUMN request_policy TEXT DEFAULT 'MANUAL_APPROVAL'
  CHECK (request_policy IN ('DENY_ALL', 'MANUAL_APPROVAL', 'AUTO_APPROVE'));

ALTER TABLE core_modules ADD COLUMN auto_enable_policy TEXT DEFAULT 'NONE'
  CHECK (auto_enable_policy IN ('NONE', 'NEW_TENANTS', 'ALL_TENANTS'));
```

### 2.2 Mapeamento por Maturidade

| Maturidade       | `default_visibility` | `request_policy`  | `auto_enable_policy` |
| ---------------- | -------------------- | ----------------- | -------------------- |
| `PLANNED`        | `HIDDEN`             | `DENY_ALL`        | `NONE`               |
| `IN_DEVELOPMENT` | `HIDDEN`             | `DENY_ALL`        | `NONE`               |
| `ALPHA`          | `INTERNAL`           | `MANUAL_APPROVAL` | `NONE`               |
| `BETA`           | `PUBLIC`             | `MANUAL_APPROVAL` | `NONE`               |
| `RC`             | `PUBLIC`             | `AUTO_APPROVE`    | `NEW_TENANTS`        |
| `GA`             | `PUBLIC`             | `AUTO_APPROVE`    | `NEW_TENANTS`        |
| `MAINTENANCE`    | `PUBLIC`             | `MANUAL_APPROVAL` | `NONE`               |
| `DEPRECATED`     | `HIDDEN`             | `DENY_ALL`        | `NONE`               |
| `RETIRED`        | `HIDDEN`             | `DENY_ALL`        | `NONE`               |

## 3. Implementação por Fases

### Fase 1: Estrutura Base (1-2 dias)

#### 3.1 Migração do Banco de Dados

```sql
-- Migration: 20250110000000_enhance_tenant_operational_status.sql
```

#### 3.2 Atualizar Tipos TypeScript

- Expandir `ModuleTenantStatus` em `src/shared/types/module-lifecycle.ts`
- Adicionar tipos de política em `src/shared/types/module-catalog.ts`

#### 3.3 Atualizar Serviços

- `TenantModuleService`: adicionar métodos para transições de status
- `ModuleCatalogService`: implementar lógica de políticas

### Fase 2: Lógica de Negócio (2-3 dias)

#### 3.4 Sistema de Transições

- Implementar máquina de estados para transições válidas
- Validações de negócio para cada transição
- Logs de auditoria para mudanças de status

#### 3.5 Marketplace Logic

- Filtros baseados em `default_visibility`
- Controle do botão "Enable" baseado em `request_policy`
- Sistema de aprovação para `MANUAL_APPROVAL`

#### 3.6 Auto-Enable System

- Worker para novos tenants (`NEW_TENANTS`)
- Cron job para upgrades de status (`ALL_TENANTS`)
- Notificações automáticas

### Fase 3: Interface do Usuário (2-3 dias)

#### 3.7 Atualizar Página de Módulos

- Adicionar coluna de status operacional
- Badges e indicadores visuais para cada status
- Actions contextuais baseadas no status atual

#### 3.8 Marketplace de Módulos

- Filtros por disponibilidade
- Indicadores de política de aprovação
- Fluxo de solicitação/aprovação

#### 3.9 Dashboard de Tenant

- Status operacional dos módulos do tenant
- Histórico de transições
- Ações disponíveis por status

### Fase 4: Automação e Monitoramento (1-2 dias)

#### 3.10 Background Jobs

- Provisioning automático
- Health checks periódicos
- Upgrade automático de versões

#### 3.11 Sistema de Notificações

- Alertas de mudança de status
- Notificações de aprovação pendente
- Relatórios de saúde do sistema

## 4. Arquivos a Serem Modificados

### 4.1 Database

- `supabase/migrations/20250110000000_enhance_tenant_operational_status.sql`

### 4.2 Types

- `src/shared/types/module-lifecycle.ts`
- `src/shared/types/module-catalog.ts`
- `src/shared/types/tenant-modules.ts` (novo)

### 4.3 Services

- `src/core/services/TenantModuleService.ts`
- `src/core/services/ModuleCatalogService.ts`
- `src/core/services/ModuleProvisioningService.ts` (novo)

### 4.4 Actions

- `src/app/actions/admin/tenant-modules.ts`
- `src/app/actions/admin/module-catalog.ts`
- `src/app/actions/marketplace/modules.ts` (novo)

### 4.5 Components

- `src/app/(protected)/admin/modules/page.tsx`
- `src/app/(protected)/admin/modules/components/TenantStatusBadge.tsx` (novo)
- `src/app/(protected)/admin/modules/components/StatusTransitionActions.tsx` (novo)

### 4.6 Background Jobs

- `src/core/jobs/ModuleProvisioningJob.ts` (novo)
- `src/core/jobs/ModuleHealthCheckJob.ts` (novo)
- `src/core/jobs/AutoEnableJob.ts` (novo)

## 5. Critérios de Aceitação

### 5.1 Funcionalidades Básicas

- ✅ 10 status operacionais implementados
- ✅ Transições de status validadas
- ✅ Políticas de disponibilidade funcionais
- ✅ Auto-enable para novos tenants

### 5.2 Interface

- ✅ Status visível na página de módulos
- ✅ Actions contextuais por status
- ✅ Marketplace com filtros de disponibilidade
- ✅ Dashboard de tenant atualizado

### 5.3 Automação

- ✅ Provisioning automático
- ✅ Health checks periódicos
- ✅ Notificações de mudança de status
- ✅ Logs de auditoria completos

## 6. Testes

### 6.1 Testes Unitários

- Validação de transições de status
- Lógica de políticas de disponibilidade
- Serviços de provisioning

### 6.2 Testes de Integração

- Fluxo completo de solicitação → ativação
- Auto-enable para novos tenants
- Sistema de aprovação

### 6.3 Testes E2E

- Jornada do usuário no marketplace
- Gestão de módulos por admin
- Monitoramento de saúde

## 7. Cronograma Estimado

| Fase                      | Duração     | Dependências |
| ------------------------- | ----------- | ------------ |
| Fase 1: Estrutura Base    | 2 dias      | -            |
| Fase 2: Lógica de Negócio | 3 dias      | Fase 1       |
| Fase 3: Interface         | 3 dias      | Fase 2       |
| Fase 4: Automação         | 2 dias      | Fase 3       |
| **Total**                 | **10 dias** | -            |

## 8. Riscos e Mitigações

### 8.1 Riscos Identificados

- **Migração de dados**: Status atuais podem não mapear diretamente
- **Performance**: Muitas verificações de política podem impactar performance
- **Complexidade**: Sistema de transições pode ser complexo de debugar

### 8.2 Mitigações

- Script de migração com mapeamento cuidadoso de status
- Cache de políticas e otimização de queries
- Logs detalhados e dashboard de monitoramento

## 9. Próximos Passos

1. **Aprovação do plano** - Revisar e aprovar o escopo
2. **Setup do ambiente** - Preparar branch e ambiente de desenvolvimento
3. **Fase 1**: Implementar estrutura base
4. **Iteração contínua** - Implementar fases sequencialmente com validação

---

**Status**: 📋 Planejamento Completo  
**Última atualização**: 10/01/2025  
**Responsável**: AI Agent  
**Estimativa total**: 10 dias úteis
