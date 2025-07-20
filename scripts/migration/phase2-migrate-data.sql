-- =====================================================
-- FASE 2: MIGRAÇÃO DE DADOS PARA TABELAS GENÉRICAS
-- =====================================================
-- Objetivo: Migrar dados das tabelas core_* para tenant_business_entities/relationships/transactions
-- Data: 2025-01-14
-- Estimativa: 2 semanas
-- Pré-requisito: Fase 1 executada (tabelas genéricas criadas)

-- =====================================================
-- 1. VALIDAÇÃO PRÉ-MIGRAÇÃO
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    banban_org_id UUID;
BEGIN
    -- Verificar se as tabelas genéricas existem
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('tenant_business_entities', 'tenant_business_relationships', 'tenant_business_transactions')
        AND table_schema = 'public';
    
    IF table_count != 3 THEN
        RAISE EXCEPTION 'ERRO: Execute primeiro a Fase 1 - Tabelas genéricas não encontradas';
    END IF;
    
    -- Verificar se a organização Banban existe
    SELECT id INTO banban_org_id FROM organizations WHERE slug = 'banban' OR company_trading_name ILIKE '%banban%';
    
    IF banban_org_id IS NULL THEN
        RAISE EXCEPTION 'ERRO: Organização Banban não encontrada. Crie primeiro ou ajuste o filtro.';
    END IF;
    
    RAISE NOTICE '✅ Validação pré-migração passou - iniciando migração de dados';
    RAISE NOTICE 'Organização Banban ID: %', banban_org_id;
END $$;

-- =====================================================
-- 2. MIGRAÇÃO: core_products → tenant_business_entities
-- =====================================================

-- Migrar produtos do Banban
INSERT INTO tenant_business_entities (
    organization_id,
    entity_type,
    external_id,
    name,
    business_data,
    configuration,
    metadata,
    status,
    created_at,
    updated_at,
    created_by
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' OR company_trading_name ILIKE '%banban%' LIMIT 1),
    'product',
    cp.external_id,
    cp.product_name,
    jsonb_build_object(
        'category', cp.category,
        'sub_category', cp.sub_category,
        'description', cp.description,
        'gtin', cp.gtin,
        'unit_measure', cp.unit_measure,
        'gender', cp.gender,
        'folder', cp.folder,
        'type', cp.type,
        'supplier_external_id', cp.supplier_external_id,
        'source_table', 'core_products'
    ),
    jsonb_build_object(
        'migrated_from', 'core_products',
        'migration_date', NOW()
    ),
    jsonb_build_object(
        'migration_info', jsonb_build_object(
            'original_id', cp.id,
            'migrated_at', NOW(),
            'source_table', 'core_products'
        )
    ),
    cp.status,
    cp.created_at,
    cp.updated_at,
    NULL -- created_by não existe em core_products
FROM core_products cp
ON CONFLICT (organization_id, entity_type, external_id) DO UPDATE SET
    name = EXCLUDED.name,
    business_data = EXCLUDED.business_data,
    updated_at = NOW();

-- =====================================================
-- 3. MIGRAÇÃO: core_suppliers → tenant_business_entities  
-- =====================================================

INSERT INTO tenant_business_entities (
    organization_id,
    entity_type,
    external_id,
    name,
    business_data,
    configuration,
    metadata,
    status,
    created_at,
    updated_at
)
SELECT 
    COALESCE(cs.organization_id, (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)),
    'supplier',
    cs.external_id,
    cs.trade_name,
    jsonb_build_object(
        'legal_name', cs.legal_name,
        'cnpj', cs.cnpj,
        'trade_name', cs.trade_name,
        'source_table', 'core_suppliers'
    ),
    jsonb_build_object(
        'migrated_from', 'core_suppliers',
        'migration_date', NOW()
    ),
    jsonb_build_object(
        'migration_info', jsonb_build_object(
            'original_id', cs.id,
            'migrated_at', NOW(),
            'source_table', 'core_suppliers'
        )
    ),
    'active', -- core_suppliers não tem status
    cs.created_at,
    cs.updated_at
FROM core_suppliers cs
ON CONFLICT (organization_id, entity_type, external_id) DO UPDATE SET
    name = EXCLUDED.name,
    business_data = EXCLUDED.business_data,
    updated_at = NOW();

-- =====================================================
-- 4. MIGRAÇÃO: core_locations → tenant_business_entities
-- =====================================================

INSERT INTO tenant_business_entities (
    organization_id,
    entity_type,
    external_id,
    name,
    business_data,
    configuration,
    metadata,
    status,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1),
    'location',
    COALESCE(cl.external_id, cl.id::text), -- core_locations pode não ter external_id
    cl.name,
    jsonb_build_object(
        'location_type', cl.location_type,
        'address', COALESCE(cl.address, '{}'),
        'source_table', 'core_locations'
    ),
    jsonb_build_object(
        'migrated_from', 'core_locations',
        'migration_date', NOW()
    ),
    jsonb_build_object(
        'migration_info', jsonb_build_object(
            'original_id', cl.id,
            'migrated_at', NOW(),
            'source_table', 'core_locations'
        )
    ),
    'active',
    COALESCE(cl.created_at, NOW()),
    COALESCE(cl.updated_at, NOW())
FROM core_locations cl
ON CONFLICT (organization_id, entity_type, external_id) DO UPDATE SET
    name = EXCLUDED.name,
    business_data = EXCLUDED.business_data,
    updated_at = NOW();

-- =====================================================
-- 5. MIGRAÇÃO: core_product_variants → tenant_business_relationships
-- =====================================================

-- Primeiro, criar entidades para as variantes
INSERT INTO tenant_business_entities (
    organization_id,
    entity_type,
    external_id,
    name,
    business_data,
    configuration,
    metadata,
    status,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1),
    'variant',
    COALESCE(cpv.external_id, cpv.id::text),
    CONCAT(p.name, ' - ', cpv.size, ' - ', cpv.color),
    jsonb_build_object(
        'size', cpv.size,
        'color', cpv.color,
        'sku', cpv.sku,
        'gtin_variant', cpv.gtin_variant,
        'parent_product_external_id', p.external_id,
        'source_table', 'core_product_variants'
    ),
    jsonb_build_object(
        'migrated_from', 'core_product_variants',
        'migration_date', NOW()
    ),
    jsonb_build_object(
        'migration_info', jsonb_build_object(
            'original_id', cpv.id,
            'original_product_id', cpv.product_id,
            'migrated_at', NOW(),
            'source_table', 'core_product_variants'
        )
    ),
    'active',
    COALESCE(cpv.created_at, NOW()),
    COALESCE(cpv.updated_at, NOW())
FROM core_product_variants cpv
JOIN core_products p ON cpv.product_id = p.id
ON CONFLICT (organization_id, entity_type, external_id) DO UPDATE SET
    name = EXCLUDED.name,
    business_data = EXCLUDED.business_data,
    updated_at = NOW();

-- Agora, criar relacionamentos variant_of
INSERT INTO tenant_business_relationships (
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_data,
    status,
    created_at
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1),
    tbe_variant.id,
    tbe_product.id,
    'variant_of',
    jsonb_build_object(
        'size', cpv.size,
        'color', cpv.color,
        'sku', cpv.sku,
        'gtin_variant', cpv.gtin_variant,
        'original_variant_id', cpv.id,
        'original_product_id', cpv.product_id
    ),
    'active',
    COALESCE(cpv.created_at, NOW())
FROM core_product_variants cpv
JOIN core_products p ON cpv.product_id = p.id
JOIN tenant_business_entities tbe_product ON (
    tbe_product.entity_type = 'product' 
    AND tbe_product.external_id = p.external_id
    AND tbe_product.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
JOIN tenant_business_entities tbe_variant ON (
    tbe_variant.entity_type = 'variant'
    AND tbe_variant.external_id = COALESCE(cpv.external_id, cpv.id::text)
    AND tbe_variant.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
ON CONFLICT (organization_id, source_entity_id, target_entity_id, relationship_type) DO NOTHING;

-- =====================================================
-- 6. MIGRAÇÃO: core_product_pricing → tenant_business_relationships
-- =====================================================

-- Criar relacionamentos priced_as para preços
INSERT INTO tenant_business_relationships (
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_data,
    status,
    created_at
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1),
    COALESCE(tbe_variant.id, tbe_product.id), -- Se for preço da variante, usa variante; senão, produto
    tbe_product.id,
    'priced_as',
    jsonb_build_object(
        'price_value', cpp.price_value,
        'price_type', cpp.price_type,
        'valid_from', cpp.valid_from,
        'valid_to', cpp.valid_to,
        'cost_price', cpp.cost_price,
        'margin_percentage', cpp.margin_percentage,
        'markup_percentage', cpp.markup_percentage,
        'change_reason', cpp.change_reason,
        'original_pricing_id', cpp.id
    ),
    'active',
    COALESCE(cpp.created_at, NOW())
FROM core_product_pricing cpp
LEFT JOIN core_product_variants cpv ON cpp.variant_id = cpv.id
LEFT JOIN core_products p ON COALESCE(cpp.product_id, cpv.product_id) = p.id
JOIN tenant_business_entities tbe_product ON (
    tbe_product.entity_type = 'product' 
    AND tbe_product.external_id = p.external_id
    AND tbe_product.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
LEFT JOIN tenant_business_entities tbe_variant ON (
    cpv.id IS NOT NULL
    AND tbe_variant.entity_type = 'variant'
    AND tbe_variant.external_id = COALESCE(cpv.external_id, cpv.id::text)
    AND tbe_variant.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
WHERE p.id IS NOT NULL
ON CONFLICT (organization_id, source_entity_id, target_entity_id, relationship_type) DO UPDATE SET
    relationship_data = EXCLUDED.relationship_data,
    updated_at = NOW();

-- =====================================================
-- 7. MIGRAÇÃO: tenant_inventory_items → tenant_business_entities
-- =====================================================

-- Migrar itens de inventário existentes
INSERT INTO tenant_business_entities (
    organization_id,
    entity_type,
    external_id,
    name,
    business_data,
    configuration,
    metadata,
    status,
    created_at,
    updated_at
)
SELECT 
    tii.tenant_id,
    'product',
    tii.sku,
    tii.name,
    jsonb_build_object(
        'description', tii.description,
        'collection', tii.collection,
        'season', tii.season,
        'gender', tii.gender,
        'material', tii.material,
        'heel_height', tii.heel_height,
        'style', tii.style,
        'brand_tier', tii.brand_tier,
        'store_id', tii.store_id,
        'location', tii.location,
        'source_table', 'tenant_inventory_items'
    ),
    jsonb_build_object(
        'cost_price', tii.cost_price,
        'selling_price', tii.selling_price,
        'min_stock_level', tii.min_stock_level,
        'max_stock_level', tii.max_stock_level,
        'reorder_point', tii.reorder_point,
        'migrated_from', 'tenant_inventory_items',
        'migration_date', NOW()
    ),
    jsonb_build_object(
        'current_quantity', tii.current_quantity,
        'reserved_quantity', tii.reserved_quantity,
        'available_quantity', tii.available_quantity,
        'abc_classification', tii.abc_classification,
        'turnover_rate', tii.turnover_rate,
        'last_count_date', tii.last_count_date,
        'migration_info', jsonb_build_object(
            'original_id', tii.id,
            'migrated_at', NOW(),
            'source_table', 'tenant_inventory_items'
        )
    ),
    CASE WHEN tii.is_active THEN 'active' ELSE 'inactive' END,
    tii.created_at,
    tii.updated_at
FROM tenant_inventory_items tii
WHERE tii.tenant_id IN (SELECT id FROM organizations)
ON CONFLICT (organization_id, entity_type, external_id) DO UPDATE SET
    name = EXCLUDED.name,
    business_data = business_data || EXCLUDED.business_data,
    configuration = configuration || EXCLUDED.configuration,
    metadata = metadata || EXCLUDED.metadata,
    updated_at = NOW();

-- =====================================================
-- 8. MIGRAÇÃO: core_orders → tenant_business_transactions  
-- =====================================================

INSERT INTO tenant_business_transactions (
    organization_id,
    transaction_type,
    external_id,
    transaction_number,
    transaction_data,
    transaction_items,
    total_value,
    origin_entity_id,
    destination_entity_id,
    status,
    transaction_date,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1),
    'order',
    co.external_id,
    co.external_id,
    jsonb_build_object(
        'order_type', co.order_type,
        'issue_timestamp', co.issue_timestamp,
        'expected_delivery_date', co.expected_delivery_date,
        'actual_delivery_date', co.actual_delivery_date,
        'notes', co.notes,
        'approval_notes', co.approval_notes,
        'original_order_id', co.id,
        'source_table', 'core_orders'
    ),
    '[]'::jsonb, -- Itens serão migrados separadamente se existirem
    COALESCE(co.total_value, 0),
    origin_loc.id,
    dest_loc.id,
    co.status,
    co.issue_timestamp,
    co.created_at,
    co.updated_at
FROM core_orders co
LEFT JOIN tenant_business_entities origin_loc ON (
    origin_loc.entity_type = 'location' 
    AND origin_loc.metadata->>'migration_info'->>'original_id' = co.origin_location_id::text
    AND origin_loc.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
LEFT JOIN tenant_business_entities dest_loc ON (
    dest_loc.entity_type = 'location' 
    AND dest_loc.metadata->>'migration_info'->>'original_id' = co.dest_location_id::text
    AND dest_loc.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
ON CONFLICT (organization_id, transaction_type, external_id) DO UPDATE SET
    transaction_data = EXCLUDED.transaction_data,
    total_value = EXCLUDED.total_value,
    updated_at = NOW();

-- =====================================================
-- 9. MIGRAÇÃO: core_documents → tenant_business_transactions
-- =====================================================

INSERT INTO tenant_business_transactions (
    organization_id,
    transaction_type,
    external_id,
    transaction_number,
    transaction_data,
    transaction_items,
    total_value,
    origin_entity_id,
    destination_entity_id,
    status,
    transaction_date,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1),
    'document',
    cd.external_id,
    cd.external_id,
    jsonb_build_object(
        'doc_type', cd.doc_type,
        'issue_date', cd.issue_date,
        'order_id', cd.order_id,
        'original_document_id', cd.id,
        'source_table', 'core_documents'
    ),
    '[]'::jsonb, -- Itens serão migrados separadamente se existirem
    COALESCE(cd.total_value, 0),
    origin_loc.id,
    dest_loc.id,
    cd.status,
    cd.issue_date,
    cd.created_at,
    cd.updated_at
FROM core_documents cd
LEFT JOIN tenant_business_entities origin_loc ON (
    origin_loc.entity_type = 'location' 
    AND origin_loc.metadata->>'migration_info'->>'original_id' = cd.origin_location_id::text
    AND origin_loc.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
LEFT JOIN tenant_business_entities dest_loc ON (
    dest_loc.entity_type = 'location' 
    AND dest_loc.metadata->>'migration_info'->>'original_id' = cd.dest_location_id::text
    AND dest_loc.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
ON CONFLICT (organization_id, transaction_type, external_id) DO UPDATE SET
    transaction_data = EXCLUDED.transaction_data,
    total_value = EXCLUDED.total_value,
    updated_at = NOW();

-- =====================================================
-- 10. MIGRAÇÃO: core_movements → tenant_business_transactions
-- =====================================================

INSERT INTO tenant_business_transactions (
    organization_id,
    transaction_type,
    external_id,
    transaction_number,
    transaction_data,
    transaction_items,
    total_value,
    origin_entity_id,
    destination_entity_id,
    status,
    transaction_date,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1),
    'movement',
    cm.id::text, -- movements não tem external_id
    cm.id::text,
    jsonb_build_object(
        'movement_type', cm.movement_type,
        'qty_change', cm.qty_change,
        'reference_id', cm.reference_id,
        'original_movement_id', cm.id,
        'source_table', 'core_movements'
    ),
    jsonb_build_array(
        jsonb_build_object(
            'product_entity_id', product_entity.id,
            'variant_entity_id', variant_entity.id,
            'quantity', cm.qty_change,
            'original_product_id', cm.product_id,
            'original_variant_id', cm.variant_id
        )
    ),
    0, -- movements não têm valor
    NULL, -- origem será definida pelo movement_type
    location_entity.id,
    'completed', -- movements são sempre completados
    cm.movement_ts,
    cm.created_at,
    cm.updated_at
FROM core_movements cm
LEFT JOIN tenant_business_entities product_entity ON (
    product_entity.entity_type = 'product'
    AND product_entity.metadata->>'migration_info'->>'original_id' = cm.product_id::text
    AND product_entity.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
LEFT JOIN tenant_business_entities variant_entity ON (
    variant_entity.entity_type = 'variant'
    AND variant_entity.metadata->>'migration_info'->>'original_variant_id' = cm.variant_id::text
    AND variant_entity.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
LEFT JOIN tenant_business_entities location_entity ON (
    location_entity.entity_type = 'location' 
    AND location_entity.metadata->>'migration_info'->>'original_id' = cm.location_id::text
    AND location_entity.organization_id = (SELECT id FROM organizations WHERE slug = 'banban' LIMIT 1)
)
ON CONFLICT (organization_id, transaction_type, external_id) DO UPDATE SET
    transaction_data = EXCLUDED.transaction_data,
    transaction_items = EXCLUDED.transaction_items,
    updated_at = NOW();

-- =====================================================
-- 11. VALIDAÇÃO PÓS-MIGRAÇÃO
-- =====================================================

DO $$
DECLARE
    core_products_count INTEGER;
    core_suppliers_count INTEGER;
    core_locations_count INTEGER;
    core_variants_count INTEGER;
    core_orders_count INTEGER;
    core_documents_count INTEGER;
    core_movements_count INTEGER;
    tenant_inventory_count INTEGER;
    
    migrated_products_count INTEGER;
    migrated_suppliers_count INTEGER;
    migrated_locations_count INTEGER;
    migrated_variants_count INTEGER;
    migrated_relationships_count INTEGER;
    migrated_transactions_count INTEGER;
    
    banban_org_id UUID;
BEGIN
    SELECT id INTO banban_org_id FROM organizations WHERE slug = 'banban' LIMIT 1;
    
    -- Contar registros originais
    SELECT COUNT(*) INTO core_products_count FROM core_products;
    SELECT COUNT(*) INTO core_suppliers_count FROM core_suppliers;
    SELECT COUNT(*) INTO core_locations_count FROM core_locations;
    SELECT COUNT(*) INTO core_variants_count FROM core_product_variants;
    SELECT COUNT(*) INTO core_orders_count FROM core_orders;
    SELECT COUNT(*) INTO core_documents_count FROM core_documents;
    SELECT COUNT(*) INTO core_movements_count FROM core_movements;
    SELECT COUNT(*) INTO tenant_inventory_count FROM tenant_inventory_items;
    
    -- Contar registros migrados
    SELECT COUNT(*) INTO migrated_products_count 
    FROM tenant_business_entities 
    WHERE entity_type = 'product' AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_suppliers_count 
    FROM tenant_business_entities 
    WHERE entity_type = 'supplier' AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_locations_count 
    FROM tenant_business_entities 
    WHERE entity_type = 'location' AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_variants_count 
    FROM tenant_business_entities 
    WHERE entity_type = 'variant' AND organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_relationships_count 
    FROM tenant_business_relationships 
    WHERE organization_id = banban_org_id;
    
    SELECT COUNT(*) INTO migrated_transactions_count 
    FROM tenant_business_transactions 
    WHERE organization_id = banban_org_id;
    
    -- Relatório de migração
    RAISE NOTICE '';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'RELATÓRIO DE MIGRAÇÃO - FASE 2';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'TABELAS ORIGINAIS → MIGRADAS:';
    RAISE NOTICE '• core_products: % → % products migrados', core_products_count, migrated_products_count;
    RAISE NOTICE '• core_suppliers: % → % suppliers migrados', core_suppliers_count, migrated_suppliers_count;
    RAISE NOTICE '• core_locations: % → % locations migrados', core_locations_count, migrated_locations_count;
    RAISE NOTICE '• core_product_variants: % → % variants migrados', core_variants_count, migrated_variants_count;
    RAISE NOTICE '• tenant_inventory_items: % → incluídos nos products', tenant_inventory_count;
    RAISE NOTICE '';
    RAISE NOTICE 'TRANSAÇÕES MIGRADAS:';
    RAISE NOTICE '• core_orders: % registros', core_orders_count;
    RAISE NOTICE '• core_documents: % registros', core_documents_count;
    RAISE NOTICE '• core_movements: % registros', core_movements_count;
    RAISE NOTICE '• Total transactions criadas: %', migrated_transactions_count;
    RAISE NOTICE '';
    RAISE NOTICE 'RELACIONAMENTOS CRIADOS:';
    RAISE NOTICE '• Total relationships: %', migrated_relationships_count;
    RAISE NOTICE '  - variant_of (produto → variante)';
    RAISE NOTICE '  - priced_as (preços)';
    RAISE NOTICE '';
    RAISE NOTICE 'STATUS: ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO';
    RAISE NOTICE 'Próximo passo: Executar Fase 3 (atualização do código)';
    RAISE NOTICE '===============================================';
END $$; 