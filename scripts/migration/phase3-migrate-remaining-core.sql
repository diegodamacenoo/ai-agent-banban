-- =====================================================
-- FASE 3: MIGRAÇÃO FINAL DAS TABELAS CORE_ RESTANTES
-- =====================================================
-- Objetivo: Migrar últimas tabelas core_ para sistema genérico
-- Data: 2025-01-15
-- Autor: AI Assistant

BEGIN;

-- =====================================================
-- 0. VALIDAÇÃO INICIAL
-- =====================================================

DO $$
DECLARE
    banban_org_id UUID;
BEGIN
    -- Buscar ID da organização Banban
    SELECT id INTO banban_org_id 
    FROM organizations 
    WHERE company_trading_name ILIKE '%banban%' 
    LIMIT 1;
    
    IF banban_org_id IS NULL THEN
        RAISE EXCEPTION 'Organização Banban não encontrada!';
    END IF;
END $$;

-- =====================================================
-- 1. ALTA PRIORIDADE - EVENTOS (219 registros)
-- =====================================================
-- Origem: core_events
-- Destino: tenant_business_transactions (type: event)
-- Usado em: /events/page.tsx

INSERT INTO tenant_business_transactions (
    organization_id,
    transaction_type,
    transaction_date,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE company_trading_name ILIKE '%banban%'),
    'event',
    created_at,
    'completed',
    jsonb_build_object(
        'event_type', event_type,
        'entity_type', entity_type,
        'entity_id', entity_id,
        'severity', severity,
        'source', source,
        'details', details,
        'original_event_id', id
    ),
    created_at,
    updated_at
FROM core_events;

-- =====================================================
-- 2. ALTA PRIORIDADE - SNAPSHOTS (480 registros)
-- =====================================================
-- Origem: core_inventory_snapshots
-- Destino: tenant_business_entities (type: inventory_snapshot)
-- Usado em: webhook-purchase-flow

INSERT INTO tenant_business_entities (
    organization_id,
    entity_type,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE company_trading_name ILIKE '%banban%'),
    'inventory_snapshot',
    'active',
    jsonb_build_object(
        'product_id', product_id,
        'location_id', location_id,
        'quantity', quantity,
        'snapshot_type', snapshot_type,
        'snapshot_date', snapshot_date,
        'original_snapshot_id', id
    ),
    created_at,
    updated_at
FROM core_inventory_snapshots;

-- =====================================================
-- 3. ALTA PRIORIDADE - PRICING (120 registros)
-- =====================================================
-- Origem: core_product_pricing
-- Destino: tenant_business_entities (type: pricing)
-- Usado em: /catalog/page.tsx

INSERT INTO tenant_business_entities (
    organization_id,
    entity_type,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE company_trading_name ILIKE '%banban%'),
    'pricing',
    'active',
    jsonb_build_object(
        'product_id', product_id,
        'base_price', base_price,
        'sale_price', sale_price,
        'cost_price', cost_price,
        'margin_percentage', margin_percentage,
        'price_list', price_list,
        'valid_from', valid_from,
        'valid_to', valid_to,
        'original_pricing_id', id
    ),
    created_at,
    updated_at
FROM core_product_pricing;

-- =====================================================
-- 4. MÉDIA PRIORIDADE - ORDERS (10 registros)
-- =====================================================
-- Origem: core_orders + core_order_items
-- Destino: tenant_business_transactions (type: order)
-- Usado em: webhook-purchase-flow

INSERT INTO tenant_business_transactions (
    organization_id,
    transaction_type,
    transaction_date,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE company_trading_name ILIKE '%banban%'),
    'order',
    order_date,
    order_status,
    jsonb_build_object(
        'order_number', order_number,
        'supplier_id', supplier_id,
        'location_id', location_id,
        'total_amount', total_amount,
        'notes', notes,
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'product_id', oi.product_id,
                        'quantity', oi.quantity,
                        'unit_price', oi.unit_price,
                        'total_price', oi.total_price,
                        'notes', oi.notes
                    )
                )
                FROM core_order_items oi
                WHERE oi.order_id = o.id
            ),
            '[]'::jsonb
        ),
        'original_order_id', id
    ),
    created_at,
    updated_at
FROM core_orders o;

-- =====================================================
-- 5. MÉDIA PRIORIDADE - DOCUMENTS (8 registros)
-- =====================================================
-- Origem: core_documents + core_document_items
-- Destino: tenant_business_transactions (type: document)
-- Usado em: webhook-purchase-flow

INSERT INTO tenant_business_transactions (
    organization_id,
    transaction_type,
    transaction_date,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE company_trading_name ILIKE '%banban%'),
    'document',
    document_date,
    document_status,
    jsonb_build_object(
        'document_number', document_number,
        'document_type', document_type,
        'supplier_id', supplier_id,
        'total_amount', total_amount,
        'notes', notes,
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'product_id', di.product_id,
                        'variant_id', di.variant_id,
                        'quantity', di.quantity,
                        'unit_price', di.unit_price,
                        'total_price', di.total_price,
                        'notes', di.notes
                    )
                )
                FROM core_document_items di
                WHERE di.document_id = d.id
            ),
            '[]'::jsonb
        ),
        'original_document_id', id
    ),
    created_at,
    updated_at
FROM core_documents d;

-- =====================================================
-- 6. BAIXA PRIORIDADE - MOVEMENTS (1 registro)
-- =====================================================
-- Origem: core_movements
-- Destino: tenant_business_transactions (type: movement)
-- Status: Não usado no código, mas migrando por completude

INSERT INTO tenant_business_transactions (
    organization_id,
    transaction_type,
    transaction_date,
    status,
    metadata,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE company_trading_name ILIKE '%banban%'),
    'movement',
    movement_date,
    movement_status,
    jsonb_build_object(
        'movement_type', movement_type,
        'origin_location_id', origin_location_id,
        'destination_location_id', destination_location_id,
        'product_id', product_id,
        'quantity', quantity,
        'notes', notes,
        'original_movement_id', id
    ),
    created_at,
    updated_at
FROM core_movements;

-- =====================================================
-- 7. VALIDAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    events_count INTEGER;
    snapshots_count INTEGER;
    pricing_count INTEGER;
    orders_count INTEGER;
    documents_count INTEGER;
    movements_count INTEGER;
BEGIN
    -- Contagem de registros originais
    SELECT COUNT(*) INTO events_count FROM core_events;
    SELECT COUNT(*) INTO snapshots_count FROM core_inventory_snapshots;
    SELECT COUNT(*) INTO pricing_count FROM core_product_pricing;
    SELECT COUNT(*) INTO orders_count FROM core_orders;
    SELECT COUNT(*) INTO documents_count FROM core_documents;
    SELECT COUNT(*) INTO movements_count FROM core_movements;

    -- Validar migração
    IF events_count != (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'event') THEN
        RAISE EXCEPTION 'Migração de eventos incompleta!';
    END IF;

    IF snapshots_count != (SELECT COUNT(*) FROM tenant_business_entities WHERE entity_type = 'inventory_snapshot') THEN
        RAISE EXCEPTION 'Migração de snapshots incompleta!';
    END IF;

    IF pricing_count != (SELECT COUNT(*) FROM tenant_business_entities WHERE entity_type = 'pricing') THEN
        RAISE EXCEPTION 'Migração de pricing incompleta!';
    END IF;

    IF orders_count != (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'order') THEN
        RAISE EXCEPTION 'Migração de ordens incompleta!';
    END IF;

    IF documents_count != (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'document') THEN
        RAISE EXCEPTION 'Migração de documentos incompleta!';
    END IF;

    IF movements_count != (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'movement') THEN
        RAISE EXCEPTION 'Migração de movimentações incompleta!';
    END IF;

    RAISE NOTICE 'Migração concluída com sucesso!';
    RAISE NOTICE 'Eventos: % registros', events_count;
    RAISE NOTICE 'Snapshots: % registros', snapshots_count;
    RAISE NOTICE 'Pricing: % registros', pricing_count;
    RAISE NOTICE 'Ordens: % registros', orders_count;
    RAISE NOTICE 'Documentos: % registros', documents_count;
    RAISE NOTICE 'Movimentações: % registros', movements_count;
END $$;

COMMIT; 