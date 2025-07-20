-- =====================================================
-- SCRIPT: Limpeza das Tabelas Core_ Após Migração
-- Objetivo: Remover tabelas core_ migradas para sistema genérico
-- Data: 2025-01-15
-- =====================================================

-- IMPORTANTE: Executar apenas após validar migração da Fase 3

BEGIN;

-- =====================================================
-- 1. VALIDAÇÃO PRÉ-LIMPEZA
-- =====================================================

DO $$
DECLARE
    banban_org_id UUID;
    migrated_pricing_count INTEGER;
    migrated_snapshots_count INTEGER;
    migrated_documents_count INTEGER;
    migrated_orders_count INTEGER;
    migrated_movements_count INTEGER;
    migrated_events_count INTEGER;
BEGIN
    -- Buscar ID da organização Banban
    SELECT id INTO banban_org_id 
    FROM organizations 
    WHERE company_trading_name ILIKE '%banban%' 
    LIMIT 1;
    
    IF banban_org_id IS NULL THEN
        RAISE EXCEPTION 'Organização Banban não encontrada!';
    END IF;

    -- Verificar se dados foram migrados
    SELECT COUNT(*) INTO migrated_pricing_count 
    FROM tenant_business_entities 
    WHERE entity_type = 'pricing' 
    AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_snapshots_count 
    FROM tenant_business_entities 
    WHERE entity_type = 'inventory_snapshot' 
    AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_documents_count 
    FROM tenant_business_transactions 
    WHERE transaction_type = 'document' 
    AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_orders_count 
    FROM tenant_business_transactions 
    WHERE transaction_type = 'order' 
    AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_movements_count 
    FROM tenant_business_transactions 
    WHERE transaction_type = 'movement' 
    AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_events_count 
    FROM tenant_business_transactions 
    WHERE transaction_type = 'event' 
    AND organization_id = banban_org_id;

    -- Validar migração
    IF migrated_pricing_count < (SELECT COUNT(*) FROM core_product_pricing) THEN
        RAISE EXCEPTION 'Dados de pricing não foram totalmente migrados!';
    END IF;
    
    IF migrated_snapshots_count < (SELECT COUNT(*) FROM core_inventory_snapshots) THEN
        RAISE EXCEPTION 'Dados de snapshots não foram totalmente migrados!';
    END IF;
    
    IF migrated_documents_count < (SELECT COUNT(*) FROM core_documents) THEN
        RAISE EXCEPTION 'Documentos não foram totalmente migrados!';
    END IF;
    
    IF migrated_orders_count < (SELECT COUNT(*) FROM core_orders) THEN
        RAISE EXCEPTION 'Ordens não foram totalmente migradas!';
    END IF;
    
    IF migrated_movements_count < (SELECT COUNT(*) FROM core_movements) THEN
        RAISE EXCEPTION 'Movimentações não foram totalmente migradas!';
    END IF;
    
    IF migrated_events_count < (SELECT COUNT(*) FROM core_events) THEN
        RAISE EXCEPTION 'Eventos não foram totalmente migrados!';
    END IF;

    RAISE NOTICE 'Validação pré-limpeza OK - todos os dados foram migrados';
END $$;

-- =====================================================
-- 2. REMOVER CONSTRAINTS E ÍNDICES
-- =====================================================

-- Remover FKs de core_document_items
ALTER TABLE IF EXISTS core_document_items 
    DROP CONSTRAINT IF EXISTS core_document_items_document_id_fkey,
    DROP CONSTRAINT IF EXISTS core_document_items_product_id_fkey,
    DROP CONSTRAINT IF EXISTS core_document_items_variant_id_fkey;

-- Remover FKs de core_orders
ALTER TABLE IF EXISTS core_orders
    DROP CONSTRAINT IF EXISTS core_orders_supplier_id_fkey,
    DROP CONSTRAINT IF EXISTS core_orders_location_id_fkey;

-- Remover FKs de core_movements
ALTER TABLE IF EXISTS core_movements
    DROP CONSTRAINT IF EXISTS core_movements_origin_location_id_fkey,
    DROP CONSTRAINT IF EXISTS core_movements_destination_location_id_fkey;

-- =====================================================
-- 3. REMOVER TABELAS
-- =====================================================

-- Remover em ordem para evitar problemas de dependência
DROP TABLE IF EXISTS core_document_items;
DROP TABLE IF EXISTS core_documents;
DROP TABLE IF EXISTS core_orders;
DROP TABLE IF EXISTS core_movements;
DROP TABLE IF EXISTS core_events;
DROP TABLE IF EXISTS core_inventory_snapshots;
DROP TABLE IF EXISTS core_product_pricing;

-- =====================================================
-- 4. VALIDAÇÃO PÓS-LIMPEZA
-- =====================================================

DO $$
DECLARE
    remaining_tables TEXT[];
BEGIN
    -- Verificar se alguma tabela ainda existe
    SELECT ARRAY_AGG(table_name) INTO remaining_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'core_document_items',
        'core_documents',
        'core_orders',
        'core_movements',
        'core_events',
        'core_inventory_snapshots',
        'core_product_pricing'
    );

    IF remaining_tables IS NOT NULL THEN
        RAISE WARNING 'Algumas tabelas ainda existem: %', remaining_tables;
    ELSE
        RAISE NOTICE 'Todas as tabelas foram removidas com sucesso';
    END IF;
END $$;

COMMIT; 