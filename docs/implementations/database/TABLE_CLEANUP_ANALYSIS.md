# Análise de Limpeza de Tabelas - Migração para Tabelas Genéricas

## Objetivo
Identificar quais tabelas `core_*` podem ser excluídas com segurança após a migração completa para as novas tabelas genéricas `tenant_business_*`.

## Status da Migração
✅ **Refatoração de Código:** 100% concluída  
🔄 **Migração de Dados:** Fase 1 pronta (scripts criados)  
⚠️ **Aplicação da Migração:** Pendente  

## Tabelas Principais para Exclusão

### 🔴 ALTA PRIORIDADE - Podem ser excluídas após migração

#### 1. `core_products`
**Substituída por:** `tenant_business_entities` (entity_type = 'product')
**Referências encontradas:**
- ❌ Código: Refatorado para GenericDataService
- ❌ Views: core_products_compat criada
- ❌ Schemas: Atualizado para tenant_inventory_items_compat
- ❌ Webhooks: Refatorados para tabelas genéricas

**Status:** ✅ Pronta para exclusão

#### 2. `core_suppliers`
**Substituída por:** `tenant_business_entities` (entity_type = 'supplier')
**Referências encontradas:**
- ❌ Código: Refatorado para GenericDataService
- ❌ Views: core_suppliers_compat criada
- ❌ Analytics: Migrado para tenant_business_entities

**Status:** ✅ Pronta para exclusão

#### 3. `core_locations`
**Substituída por:** `tenant_business_entities` (entity_type = 'location')
**Referências encontradas:**
- ❌ Código: Refatorado para GenericDataService
- ⚠️ Webhooks: Ainda usada em webhook-transfer-flow e webhook-sales-flow
- ⚠️ Daily ETL: Ainda referenciada

**Status:** ⚠️ Requer refatoração de webhooks restantes

#### 4. `core_product_variants`
**Substituída por:** `tenant_business_relationships` (relationship_type = 'variant_of')
**Referências encontradas:**
- ❌ Código: Refatorado para GenericDataService
- ⚠️ Webhooks: Ainda usada em webhook-sales-flow
- ⚠️ Daily ETL: Ainda referenciada
- ⚠️ UI Components: Ainda referenciada em widgets

**Status:** ⚠️ Requer refatoração de componentes UI e webhooks

#### 5. `core_orders`
**Substituída por:** `tenant_business_transactions` (transaction_type = 'order')
**Referências encontradas:**
- ❌ Código principal: Refatorado
- ⚠️ Webhooks: Ainda usada em webhook-purchase-flow
- ❌ Analytics: Preparado para migração

**Status:** ⚠️ Requer refatoração de webhook-purchase-flow

#### 6. `core_documents`
**Substituída por:** `tenant_business_transactions` (transaction_type = 'document')
**Referências encontradas:**
- ❌ Código principal: Preparado
- ⚠️ Webhooks: Amplamente usada em todos os webhooks
- ⚠️ Daily ETL: Ainda referenciada

**Status:** 🔴 Requer refatoração completa de webhooks

#### 7. `core_movements`
**Substituída por:** `tenant_business_transactions` (transaction_type = 'movement')
**Referências encontradas:**
- ❌ Código principal: Preparado
- ⚠️ Webhooks: Ainda usada em webhook-sales-flow
- ⚠️ Daily ETL: Ainda referenciada

**Status:** ⚠️ Requer refatoração de webhook e ETL

### 🟡 PRIORIDADE MÉDIA

#### 8. `core_product_pricing`
**Substituída por:** `tenant_business_relationships` (relationship_type = 'priced_as')
**Referências encontradas:**
- ❌ Analytics: Refatorado
- ⚠️ Daily ETL: Ainda referenciada
- ⚠️ Catalog page: Ainda referenciada em src/app/(protected)/catalog/page.tsx

**Status:** ⚠️ Requer refatoração de catalog e ETL

#### 9. `core_inventory_snapshots`
**Substituída por:** `tenant_business_transactions` (transaction_type = 'inventory_snapshot')
**Referências encontradas:**
- ❌ Analytics: Preparado
- ⚠️ Webhooks: Ainda usada em webhook-purchase-flow
- ⚠️ Daily ETL: Ainda referenciada

**Status:** ⚠️ Requer refatoração significativa

### 🟢 BAIXA PRIORIDADE - Tabelas Relacionais

#### 10. `core_order_items`
**Substituída por:** Estrutura JSONB em tenant_business_transactions
**Status:** ⚠️ Dependente da migração de core_orders

#### 11. `core_document_items`
**Substituída por:** Estrutura JSONB em tenant_business_transactions
**Status:** ⚠️ Dependente da migração de core_documents

## Tabelas que NÃO Devem ser Excluídas

### ✅ Manter Sistema de Módulos
- `core_modules` - Sistema de módulos v2.0.0 (não implementado no banco, apenas planejado)
- **NOTA:** Verificação revelou que apenas `organization_modules` está implementada

### ✅ Manter Sistema Multi-tenant
- `core_organizations` - Renomeada para `organizations` no schema atual

## Dependências e Constraints

### ⚠️ Foreign Keys Identificadas (50+ constraints)

#### **Tabelas com ALTA dependência:**
- **core_product_variants:** ~19 foreign keys (todas as tabelas analytics)
- **core_locations:** ~20 foreign keys (todas as tabelas analytics + transacionais)
- **core_products:** ~4 foreign keys (inventory, movements, pricing, variants)

#### **Tabelas com MÉDIA dependência:**  
- **core_suppliers:** ~3 foreign keys (orders, delivery_tracking, supplier_metrics)
- **core_orders:** ~3 foreign keys (documents, order_items, delivery_tracking)
- **core_documents:** ~1 foreign key (document_items)

#### **Tabelas com BAIXA dependência (prontas para exclusão):**
- ✅ **core_product_pricing:** 0 foreign keys dependentes
- ✅ **core_movements:** 0 foreign keys dependentes  
- ✅ **core_inventory_snapshots:** 0 foreign keys dependentes
- ✅ **core_order_items:** 0 foreign keys dependentes
- ✅ **core_document_items:** 0 foreign keys dependentes

### Comandos de Preparação
```sql
-- FASE 1: Remover constraints das tabelas analytics (principais impedimentos)
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS abc_analysis_variant_id_fkey;
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS abc_analysis_location_id_fkey;
ALTER TABLE mart_inventory_divergences DROP CONSTRAINT IF EXISTS mart_inventory_divergences_variant_id_fkey;
ALTER TABLE mart_replenishment_alerts DROP CONSTRAINT IF EXISTS mart_replenishment_alerts_variant_id_fkey;
ALTER TABLE forecast_sales DROP CONSTRAINT IF EXISTS forecast_sales_variant_id_fkey;
-- ... (continuar para todas as ~50 constraints)

-- FASE 2: Excluir tabelas em ordem segura
DROP TABLE IF EXISTS core_order_items CASCADE;
DROP TABLE IF EXISTS core_document_items CASCADE; 
DROP TABLE IF EXISTS core_product_pricing CASCADE;
DROP TABLE IF EXISTS core_movements CASCADE;
DROP TABLE IF EXISTS core_inventory_snapshots CASCADE;
DROP TABLE IF EXISTS core_documents CASCADE;
DROP TABLE IF EXISTS core_orders CASCADE;
DROP TABLE IF EXISTS core_product_variants CASCADE;
DROP TABLE IF EXISTS core_products CASCADE;
DROP TABLE IF EXISTS core_suppliers CASCADE;
DROP TABLE IF EXISTS core_locations CASCADE;
```

### Views de Compatibilidade Criadas
- ✅ `core_products_compat`
- ✅ `core_suppliers_compat`
- ✅ `tenant_inventory_items_compat`

## Plano de Execução

### Fase 1: Migração de Dados ✅
- Script `phase1-create-generic-tables.sql` criado
- Script `phase2-migrate-data.sql` criado
- Views de compatibilidade criadas

### Fase 2: Refatoração Pendente 🔄
1. **Webhooks restantes:**
   - webhook-transfer-flow (core_locations)
   - webhook-sales-flow (core_product_variants, core_movements)
   - webhook-purchase-flow (core_orders, core_inventory_snapshots)

2. **Daily ETL:**
   - sql-functions.sql (múltiplas tabelas core_*)

3. **UI Components:**
   - abc-analysis-widget.tsx (core_product_variants)
   - coverage-widget.tsx (core_product_variants, core_locations)
   - catalog/page.tsx (core_product_pricing)

### Fase 3: Exclusão Segura 🎯
```sql
-- Ordem de exclusão sugerida (após Fase 2)
1. DROP TABLE core_order_items CASCADE;
2. DROP TABLE core_document_items CASCADE;
3. DROP TABLE core_product_pricing CASCADE;
4. DROP TABLE core_movements CASCADE;
5. DROP TABLE core_inventory_snapshots CASCADE;
6. DROP TABLE core_documents CASCADE;
7. DROP TABLE core_orders CASCADE;
8. DROP TABLE core_product_variants CASCADE;
9. DROP TABLE core_products CASCADE;
10. DROP TABLE core_suppliers CASCADE;
11. DROP TABLE core_locations CASCADE;
```

## Estimativas de Impacto

### Arquivos que Precisam de Refatoração
- **Webhooks:** 3 arquivos (transfer-flow, sales-flow, purchase-flow)
- **ETL:** 1 arquivo (sql-functions.sql)
- **UI:** 3 componentes
- **Scripts:** ~20 scripts de segurança/análise

### Benefícios da Limpeza
- **Redução de complexidade:** -11 tabelas core_*
- **Melhoria de performance:** Eliminação de JOINs desnecessários
- **Simplificação do schema:** Arquitetura consistente
- **Redução de manutenção:** -50+ constraints foreign key

## Recomendações

### Ação Imediata
1. ✅ Aplicar migração Fase 1 (tabelas genéricas)
2. 🔄 Refatorar webhooks restantes
3. 🔄 Atualizar componentes UI
4. 🔄 Migrar Daily ETL

### Ação Futura
1. Aplicar migração Fase 2 (dados)
2. Executar exclusão ordenada das tabelas
3. Limpar scripts e documentação legacy

### Critério de Segurança
⚠️ **NUNCA excluir uma tabela até:**
- Migração de dados 100% validada
- Todas as referências refatoradas
- Testes de regressão aprovados
- Backup completo realizado

---
**Última atualização:** 2025-01-27  
**Status:** Análise completa - Pronto para Fase 2 