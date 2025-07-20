# Resumo de Foreign Keys - Tabelas Core_*

## Análise Baseada na Busca de Referências

### Tabelas Core_* Encontradas e Status

#### 🔴 **ALTA DEPENDÊNCIA - Muitas Foreign Keys**

##### 1. `core_product_variants`
**Foreign Keys identificadas:**
- abc_analysis.variant_id → core_product_variants.id
- alert_history.variant_id → core_product_variants.id  
- core_document_items.variant_id → core_product_variants.id
- core_inventory_snapshots.variant_id → core_product_variants.id
- core_movements.variant_id → core_product_variants.id
- core_order_items.variant_id → core_product_variants.id
- core_product_pricing.variant_id → core_product_variants.id
- dynamic_safety_stock.variant_id → core_product_variants.id
- forecast_sales.variant_id → core_product_variants.id
- mart_inventory_divergences.variant_id → core_product_variants.id
- mart_margin_alerts.variant_id → core_product_variants.id
- mart_redistribution_suggestions.variant_id → core_product_variants.id
- mart_replenishment_alerts.variant_id → core_product_variants.id
- mart_return_spike_alerts.variant_id → core_product_variants.id
- mart_stagnant_products.variant_id → core_product_variants.id
- price_elasticity.variant_id → core_product_variants.id
- price_simulations.variant_id → core_product_variants.id
- projected_coverage.variant_id → core_product_variants.id
- promotion_recommendations.variant_id → core_product_variants.id

**Estimativa:** ~19+ constraints

##### 2. `core_locations`
**Foreign Keys identificadas:**
- abc_analysis.location_id → core_locations.id
- alert_history.location_id → core_locations.id
- core_documents.dest_location_id → core_locations.id
- core_documents.origin_location_id → core_locations.id
- core_inventory_snapshots.location_id → core_locations.id
- core_movements.location_id → core_locations.id
- core_orders.dest_location_id → core_locations.id
- core_orders.origin_location_id → core_locations.id
- dynamic_safety_stock.location_id → core_locations.id
- forecast_sales.location_id → core_locations.id
- mart_inventory_divergences.location_id → core_locations.id
- mart_redistribution_suggestions (source/target)_location_id → core_locations.id
- mart_replenishment_alerts.location_id → core_locations.id
- mart_return_spike_alerts.location_id → core_locations.id
- mart_stagnant_products.location_id → core_locations.id
- price_elasticity.location_id → core_locations.id
- price_simulations.location_id → core_locations.id
- projected_coverage.location_id → core_locations.id
- promotion_recommendations.location_id → core_locations.id

**Estimativa:** ~20+ constraints

##### 3. `core_products`
**Foreign Keys identificadas:**
- core_inventory_snapshots.product_id → core_products.id
- core_movements.product_id → core_products.id
- core_product_pricing.product_id → core_products.id
- core_product_variants.product_id → core_products.id (CASCADE)

**Estimativa:** ~4+ constraints

#### 🟡 **MÉDIA DEPENDÊNCIA**

##### 4. `core_suppliers`
**Foreign Keys identificadas:**
- core_orders.supplier_id → core_suppliers.id
- delivery_tracking.supplier_id → core_suppliers.id
- supplier_metrics.supplier_id → core_suppliers.id

**Estimativa:** ~3+ constraints

##### 5. `core_orders`
**Foreign Keys identificadas:**
- core_documents.order_id → core_orders.id
- core_order_items.order_id → core_orders.id (CASCADE)
- delivery_tracking.order_id → core_orders.id (CASCADE)

**Estimativa:** ~3+ constraints

##### 6. `core_documents`
**Foreign Keys identificadas:**
- core_document_items.document_id → core_documents.id (CASCADE)

**Estimativa:** ~1+ constraint

#### 🟢 **BAIXA DEPENDÊNCIA**

##### 7. `core_product_pricing`
**Nenhuma foreign key dependente identificada**
**Status:** ✅ Potencialmente segura para exclusão

##### 8. `core_movements`
**Nenhuma foreign key dependente identificada**
**Status:** ✅ Potencialmente segura para exclusão

##### 9. `core_inventory_snapshots`
**Nenhuma foreign key dependente identificada**
**Status:** ✅ Potencialmente segura para exclusão

##### 10. `core_order_items`
**Nenhuma foreign key dependente identificada**
**Status:** ✅ Potencialmente segura para exclusão

##### 11. `core_document_items`
**Nenhuma foreign key dependente identificada**
**Status:** ✅ Potencialmente segura para exclusão

## Ordem de Exclusão Recomendada

### Fase 1: Tabelas Relacionais (Sem dependentes)
```sql
-- Estas podem ser excluídas primeiro (menos risk)
DROP TABLE IF EXISTS core_order_items CASCADE;
DROP TABLE IF EXISTS core_document_items CASCADE; 
DROP TABLE IF EXISTS core_product_pricing CASCADE;
DROP TABLE IF EXISTS core_movements CASCADE;
DROP TABLE IF EXISTS core_inventory_snapshots CASCADE;
```

### Fase 2: Tabelas Transacionais
```sql
-- Depois das relacionais
DROP TABLE IF EXISTS core_documents CASCADE;
DROP TABLE IF EXISTS core_orders CASCADE;
```

### Fase 3: Tabelas Mestras
```sql  
-- Por último, as tabelas mais referenciadas
DROP TABLE IF EXISTS core_product_variants CASCADE;
DROP TABLE IF EXISTS core_products CASCADE;
DROP TABLE IF EXISTS core_suppliers CASCADE;
DROP TABLE IF EXISTS core_locations CASCADE;
```

## Comandos de Preparação

### Remover Foreign Keys Analytics (Principais)
```sql
-- Tabelas analytics são os maiores impedimentos
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS abc_analysis_variant_id_fkey;
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS abc_analysis_location_id_fkey;

ALTER TABLE mart_inventory_divergences DROP CONSTRAINT IF EXISTS mart_inventory_divergences_variant_id_fkey;
ALTER TABLE mart_inventory_divergences DROP CONSTRAINT IF EXISTS mart_inventory_divergences_location_id_fkey;

ALTER TABLE mart_replenishment_alerts DROP CONSTRAINT IF EXISTS mart_replenishment_alerts_variant_id_fkey;
ALTER TABLE mart_replenishment_alerts DROP CONSTRAINT IF EXISTS mart_replenishment_alerts_location_id_fkey;

ALTER TABLE forecast_sales DROP CONSTRAINT IF EXISTS forecast_sales_variant_id_fkey;
ALTER TABLE forecast_sales DROP CONSTRAINT IF EXISTS forecast_sales_location_id_fkey;

-- Continuar para todas as tabelas mart_*, price_*, promotion_*, dynamic_*, projected_*
```

## Estimativas de Impacto

### Total de Foreign Keys Estimadas
- **core_product_variants:** ~19 constraints
- **core_locations:** ~20 constraints  
- **core_products:** ~4 constraints
- **core_suppliers:** ~3 constraints
- **core_orders:** ~3 constraints
- **core_documents:** ~1 constraint
- **Outras tabelas:** 0 constraints

**Total Estimado:** ~50+ foreign key constraints

### Tabelas Dependentes Principais
1. **Analytics Tables (mart_*, forecast_*, abc_*):** ~30 constraints
2. **Price & Promotion Tables:** ~8 constraints  
3. **Dynamic & Projected Tables:** ~6 constraints
4. **Alert & History Tables:** ~4 constraints
5. **Core Transactional Tables:** ~4 constraints

## Próximos Passos Recomendados

### 1. Validação Real (Script SQL)
Executar o script `check-foreign-keys-core-tables.sql` para obter números exatos.

### 2. Criação de Script de Remoção
Gerar automaticamente todos os comandos `ALTER TABLE ... DROP CONSTRAINT`.

### 3. Planejamento de Migração
1. ✅ Aplicar fase1-create-generic-tables.sql
2. ⚠️ Aplicar phase2-migrate-data.sql  
3. ⚠️ Validar migração de dados
4. ⚠️ Remover foreign keys
5. ⚠️ Excluir tabelas core_*

### 4. Validação de Segurança
- Backup completo antes de qualquer exclusão
- Testes de regressão em ambiente de staging
- Validação manual dos dados migrados
- Rollback plan documentado

---
**Status:** Análise preliminar completa  
**Próximo:** Executar script SQL para números exatos  
**Risco:** Médio-Alto (muitas dependências identificadas) 