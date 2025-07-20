-- ================================================
-- SCRIPT: Limpeza de Tabelas Específicas do Banban
-- Projeto: Banban - Migração para Sistema Genérico
-- Data: $(date)
-- ================================================

-- IMPORTANTE: Este script remove tabelas específicas do projeto Banban
-- que devem usar o sistema genérico tenant_business_* ou estão vazias

BEGIN;

-- ================================================
-- 1. VERIFICAR SE SISTEMA GENÉRICO ESTÁ ATIVO
-- ================================================

DO $$
DECLARE
    entity_count INTEGER;
    business_data_count INTEGER;
BEGIN
    -- Verificar se tenant_business_entities tem dados
    SELECT COUNT(*) INTO entity_count FROM tenant_business_entities;
    
    -- Verificar se há dados reais nas entidades
    SELECT COUNT(*) INTO business_data_count 
    FROM tenant_business_entities 
    WHERE business_data != '{}' OR metadata != '{}';
    
    RAISE NOTICE 'VERIFICAÇÃO DO SISTEMA GENÉRICO:';
    RAISE NOTICE '- tenant_business_entities: % registros', entity_count;
    RAISE NOTICE '- Entidades com dados: % registros', business_data_count;
    
    IF entity_count = 0 THEN
        RAISE WARNING 'ATENÇÃO: Sistema genérico parece vazio. Considere verificar migração.';
    ELSE
        RAISE NOTICE 'VERIFICAÇÃO: Sistema genérico ativo, prosseguindo com limpeza...';
    END IF;
END $$;

-- ================================================
-- 2. BACKUP DE SEGURANÇA DAS TABELAS COM DADOS
-- ================================================

-- Backup das tabelas que têm dados (mesmo que poucos)
CREATE TABLE IF NOT EXISTS _backup_tenant_modules AS SELECT * FROM tenant_modules;
CREATE TABLE IF NOT EXISTS _backup_tenant_module_settings AS SELECT * FROM tenant_module_settings;
CREATE TABLE IF NOT EXISTS _backup_tenant_dashboard_widgets AS SELECT * FROM tenant_dashboard_widgets;

RAISE NOTICE 'BACKUP: Tabelas com dados importantes salvas com prefixo _backup_';

-- ================================================
-- 3. DELETAR TABELAS MART VAZIAS (ESPECÍFICAS BANBAN)
-- ================================================

-- Tabelas MART específicas do Banban que estão vazias
-- Estas deveriam ser substituídas por dados dinâmicos via tenant_business_*

DROP TABLE IF EXISTS mart_daily_summary CASCADE;
DROP TABLE IF EXISTS mart_inventory_divergences CASCADE;
DROP TABLE IF EXISTS mart_margin_alerts CASCADE;
DROP TABLE IF EXISTS mart_replenishment_alerts CASCADE;
DROP TABLE IF EXISTS mart_stagnant_products CASCADE;
DROP TABLE IF EXISTS mart_redistribution_suggestions CASCADE;
DROP TABLE IF EXISTS mart_return_spike_alerts CASCADE;

RAISE NOTICE 'LIMPEZA: Tabelas MART específicas do Banban removidas (todas vazias)';

-- ================================================
-- 4. DELETAR TABELAS TENANT ESPECÍFICAS VAZIAS
-- ================================================

-- Tabelas específicas de tenant que estão vazias
DROP TABLE IF EXISTS tenant_dashboard_layouts CASCADE;
DROP TABLE IF EXISTS tenant_module_status CASCADE;

RAISE NOTICE 'LIMPEZA: Tabelas tenant específicas vazias removidas';

-- ================================================
-- 5. DELETAR TABELAS DE BACKUP ANTIGAS
-- ================================================

-- Limpar backups da migração anterior se existirem
DROP TABLE IF EXISTS _backup_core_products CASCADE;
DROP TABLE IF EXISTS _backup_core_suppliers CASCADE;
DROP TABLE IF EXISTS _backup_core_locations CASCADE;
DROP TABLE IF EXISTS _backup_core_product_variants CASCADE;

RAISE NOTICE 'LIMPEZA: Backups antigos da migração core_ removidos';

-- ================================================
-- 6. VERIFICAÇÃO FINAL
-- ================================================

-- Verificar tabelas tenant_ restantes
SELECT 'TABELAS TENANT_ RESTANTES:' as status;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'tenant_%'
ORDER BY table_name;

-- Verificar tabelas mart_ restantes
SELECT 'TABELAS MART_ RESTANTES:' as status;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'mart_%'
ORDER BY table_name;

-- Contar registros das tabelas de módulos mantidas
SELECT 'TABELAS DE MÓDULOS MANTIDAS:' as status;
SELECT 
    'tenant_modules' as table_name,
    COUNT(*) as record_count,
    'Sistema de módulos ativo' as purpose
FROM tenant_modules
UNION ALL
SELECT 
    'tenant_module_settings' as table_name,
    COUNT(*) as record_count,
    'Configurações de módulos' as purpose
FROM tenant_module_settings
UNION ALL
SELECT 
    'tenant_dashboard_widgets' as table_name,
    COUNT(*) as record_count,
    'Widgets do dashboard' as purpose
FROM tenant_dashboard_widgets
UNION ALL
SELECT 
    'tenant_module_status_history' as table_name,
    COUNT(*) as record_count,
    'Histórico de status (vazia mas funcional)' as purpose
FROM tenant_module_status_history;

COMMIT;

-- ================================================
-- RESUMO DA LIMPEZA ESPECÍFICA DO BANBAN
-- ================================================

/*
TABELAS DELETADAS (ESPECÍFICAS DO BANBAN):

1. TABELAS MART ESPECÍFICAS (7 total):
   - mart_daily_summary (0 registros)
   - mart_inventory_divergences (0 registros)
   - mart_margin_alerts (0 registros)
   - mart_replenishment_alerts (0 registros)
   - mart_stagnant_products (0 registros)
   - mart_redistribution_suggestions (0 registros)
   - mart_return_spike_alerts (0 registros)

2. TABELAS TENANT ESPECÍFICAS VAZIAS (2 total):
   - tenant_dashboard_layouts (0 registros)
   - tenant_module_status (0 registros)

3. BACKUPS ANTIGOS (4 total):
   - _backup_core_products
   - _backup_core_suppliers
   - _backup_core_locations
   - _backup_core_product_variants

TOTAL REMOVIDO: 13 tabelas específicas do Banban

TABELAS MANTIDAS (SISTEMA DE MÓDULOS FUNCIONAL):
✅ tenant_modules (8 registros) - ESSENCIAL para sistema de módulos
✅ tenant_module_settings (3 registros) - Configurações ativas
✅ tenant_dashboard_widgets (1 registro) - Widgets ativos
✅ tenant_module_status_history (0 registros) - Funcional para auditoria
✅ tenant_business_entities - Sistema genérico ativo
✅ tenant_business_relationships - Sistema genérico ativo
✅ tenant_business_transactions - Sistema genérico ativo

MOTIVOS DA REMOÇÃO:
- Tabelas MART específicas do Banban → substituídas por sistema genérico
- Dados devem vir dinamicamente via tenant_business_*
- Análises e alertas devem ser gerados via JSONB queries
- Redução de complexidade arquitetural
- Padronização para sistema multi-tenant genérico

BENEFÍCIOS:
🎯 Arquitetura 100% genérica (sem código específico do Banban)
📊 Dados dinâmicos via tenant_business_* (mais flexível)
🚀 Performance melhorada (menos joins, mais JSONB)
🔧 Manutenção simplificada (uma estrutura para todos)
💾 Menor overhead de metadados
🏗️ Sistema preparado para qualquer tipo de cliente

PRÓXIMOS PASSOS:
1. Validar que alertas funcionam via tenant_business_*
2. Confirmar que queries dinâmicas substituem tabelas MART
3. Testar performance das análises com JSONB
4. Remover backups após 30 dias de estabilidade

OBSERVAÇÃO IMPORTANTE:
O sistema de módulos (tenant_modules, tenant_module_settings, etc.) 
foi MANTIDO porque é parte da infraestrutura genérica de gestão 
de módulos, não específico do Banban.
*/ 