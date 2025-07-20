# Estratégia Final - Limpeza de Tabelas Core\_\*

## Resumo Executivo

Após análise completa das referências no código e dependências do banco de dados, identificamos **11 tabelas core\_\*** que podem ser excluídas de forma segura após a migração completa para as tabelas genéricas `tenant_business_*`.

## Status Atual da Migração

✅ **Refatoração de Código:** 100% concluída  
✅ **Scripts de Migração:** 100% prontos  
⚠️ **Aplicação da Migração:** Pendente  
⚠️ **Refatoração Final:** Pendente (webhooks, UI, ETL)

## Classificação por Facilidade de Exclusão

### 🟢 **EXCLUSÃO IMEDIATA** (Após migração de dados)

_Nenhuma foreign key dependente identificada_

| Tabela                     | Foreign Keys | Status    | Risco |
| -------------------------- | ------------ | --------- | ----- |
| `core_order_items`         | 0            | ✅ Pronta | Baixo |
| `core_document_items`      | 0            | ✅ Pronta | Baixo |
| `core_product_pricing`     | 0            | ✅ Pronta | Baixo |
| `core_movements`           | 0            | ✅ Pronta | Baixo |
| `core_inventory_snapshots` | 0            | ✅ Pronta | Baixo |

### 🟡 **EXCLUSÃO PLANEJADA** (Após remoção de constraints)

_Poucas foreign keys, facilmente removíveis_

| Tabela           | Foreign Keys | Principais Dependentes                              | Risco |
| ---------------- | ------------ | --------------------------------------------------- | ----- |
| `core_documents` | ~1           | core_document_items                                 | Baixo |
| `core_orders`    | ~3           | core_documents, core_order_items, delivery_tracking | Médio |
| `core_suppliers` | ~3           | core_orders, delivery_tracking, supplier_metrics    | Médio |

### 🔴 **EXCLUSÃO COMPLEXA** (Muitas constraints para remover)

_Altamente referenciadas por tabelas analytics_

| Tabela                  | Foreign Keys | Principais Dependentes                                | Risco |
| ----------------------- | ------------ | ----------------------------------------------------- | ----- |
| `core_products`         | ~4           | core_product_variants, core_pricing, core_movements   | Médio |
| `core_product_variants` | ~19          | Todas tabelas analytics (mart*\*, abc*_, forecast\__) | Alto  |
| `core_locations`        | ~20          | Todas tabelas analytics + transacionais               | Alto  |

## Plano de Execução Detalhado

### Fase 1: Aplicação da Migração 🔄

**Tempo estimado:** 2-3 horas  
**Responsável:** DBA/DevOps

```bash
# 1. Backup completo
pg_dump banban_db > backup_pre_migration_$(date +%Y%m%d).sql

# 2. Aplicar migração de estrutura
psql -f scripts/migration/phase1-create-generic-tables.sql

# 3. Migrar dados
psql -f scripts/migration/phase2-migrate-data.sql

# 4. Validar migração
psql -f scripts/migration/validate-data-migration.sql
```

### Fase 2: Refatoração Final 🔄

**Tempo estimado:** 3-5 dias  
**Responsável:** Equipe de desenvolvimento

#### 2.1 Webhooks Restantes

- [ ] **webhook-transfer-flow** (core_locations)
- [ ] **webhook-sales-flow** (core_product_variants, core_movements)
- [ ] **webhook-purchase-flow** (core_orders, core_inventory_snapshots)

#### 2.2 Daily ETL

- [ ] **sql-functions.sql** (múltiplas tabelas core\_\*)

#### 2.3 UI Components

- [ ] **abc-analysis-widget.tsx** (core_product_variants)
- [ ] **coverage-widget.tsx** (core_product_variants, core_locations)
- [ ] **catalog/page.tsx** (core_product_pricing)

### Fase 3: Remoção de Constraints 🎯

**Tempo estimado:** 1 hora  
**Responsável:** DBA

```sql
-- Script gerado automaticamente: drop-core-table-constraints.sql
-- Executar APENAS após validação completa da Fase 2

-- ETAPA 1: Analytics constraints (~40 comandos)
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS abc_analysis_variant_id_fkey;
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS abc_analysis_location_id_fkey;
ALTER TABLE mart_inventory_divergences DROP CONSTRAINT IF EXISTS mart_inventory_divergences_variant_id_fkey;
-- ... continuar para todas as constraints analytics

-- ETAPA 2: Transactional constraints (~10 comandos)
ALTER TABLE core_documents DROP CONSTRAINT IF EXISTS core_documents_order_id_fkey;
ALTER TABLE core_order_items DROP CONSTRAINT IF EXISTS core_order_items_order_id_fkey;
-- ... continuar para constraints transacionais
```

### Fase 4: Exclusão das Tabelas 🎯

**Tempo estimado:** 30 minutos  
**Responsável:** DBA

```sql
-- ORDEM ESPECÍFICA DE EXCLUSÃO (sem CASCADE para controle total)

-- 1. Tabelas relacionais (sem dependentes)
DROP TABLE IF EXISTS core_order_items;
DROP TABLE IF EXISTS core_document_items;
DROP TABLE IF EXISTS core_product_pricing;
DROP TABLE IF EXISTS core_movements;
DROP TABLE IF EXISTS core_inventory_snapshots;

-- 2. Tabelas transacionais (após relacionais)
DROP TABLE IF EXISTS core_documents;
DROP TABLE IF EXISTS core_orders;

-- 3. Tabelas mestras (por último)
DROP TABLE IF EXISTS core_product_variants;
DROP TABLE IF EXISTS core_products;
DROP TABLE IF EXISTS core_suppliers;
DROP TABLE IF EXISTS core_locations;
```

## Validações de Segurança

### Pré-requisitos Obrigatórios

- [ ] ✅ Backup completo do banco de dados
- [ ] ✅ Ambiente de staging testado
- [ ] ✅ Migração de dados validada (100% integridade)
- [ ] ✅ Código refatorado e testado
- [ ] ✅ Rollback plan documentado

### Verificações Durante Execução

```sql
-- Verificar se constraints foram removidas
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND constraint_name LIKE '%core_%';

-- Verificar se tabelas foram removidas
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'core_%'
AND table_schema = 'public';
```

### Testes Pós-Exclusão

- [ ] Aplicação funciona normalmente
- [ ] Webhooks processam dados corretamente
- [ ] Analytics e relatórios funcionam
- [ ] Performance não degradou
- [ ] Logs sem erros relacionados a tabelas core\_\*

## Benefícios Esperados

### Redução de Complexidade

- **-11 tabelas core\_\*** removidas do schema
- **-50+ foreign key constraints** eliminadas
- **-200+ referências** no código limpas

### Melhoria de Performance

- Eliminação de JOINs desnecessários
- Queries mais simples e rápidas
- Índices otimizados nas tabelas genéricas

### Facilidade de Manutenção

- Schema mais limpo e consistente
- Arquitetura verdadeiramente genérica
- Redução de débito técnico

## Cronograma Recomendado

| Fase                 | Duração   | Dependências        | Risco |
| -------------------- | --------- | ------------------- | ----- |
| Fase 1 (Migração)    | 2-3 horas | Backup, validação   | Médio |
| Fase 2 (Refatoração) | 3-5 dias  | Testes, code review | Alto  |
| Fase 3 (Constraints) | 1 hora    | Fase 2 completa     | Baixo |
| Fase 4 (Exclusão)    | 30 min    | Todas anteriores    | Baixo |

**Total estimado:** 1-2 semanas

## Rollback Plan

### Se falha na Fase 1-2:

- Restaurar backup pré-migração
- Reverter commits de código
- Revalidar sistema com tabelas core\_\*

### Se falha na Fase 3-4:

- Recriar foreign keys removidas
- Recriar tabelas excluídas do backup
- Validar integridade referencial

## Critérios de Sucesso

✅ **Aplicação funciona 100%** sem tabelas core*\*  
✅ **Performance mantida ou melhorada**  
✅ **Zero erros** relacionados a tabelas inexistentes  
✅ **Dados migrados** com 100% de integridade  
✅ **Arquitetura consistente** com padrão tenant_business*\*

---

**Status:** Plano aprovado - Aguardando execução das fases  
**Próximo milestone:** Aplicação da Fase 1 (Migração)  
**Owner:** Time de Banco de Dados + Desenvolvimento  
**Revisão:** 2025-01-27
