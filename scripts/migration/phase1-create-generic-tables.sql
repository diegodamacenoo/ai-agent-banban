-- =====================================================
-- FASE 1: CRIAÇÃO DE TABELAS GENÉRICAS MULTI-TENANT
-- =====================================================
-- Objetivo: Padronizar arquitetura eliminando inconsistência core_* vs tenant_*
-- Data: 2025-01-14
-- Estimativa: 1 semana

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter organization_id do usuário atual
CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$;

-- =====================================================
-- 1. TABELA GENÉRICA: tenant_business_entities
-- Substitui: core_products, core_suppliers, core_locations + todas as core_*
-- =====================================================

CREATE TABLE IF NOT EXISTS tenant_business_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação genérica
    entity_type TEXT NOT NULL, -- 'product', 'supplier', 'location', 'customer', 'variant'
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    
    -- Dados estruturados flexíveis por tipo de negócio
    business_data JSONB DEFAULT '{}', -- Dados específicos: gender, brand, folder, cnpj, address, etc.
    configuration JSONB DEFAULT '{}', -- Configurações: pricing, stock levels, contact info, etc.
    metadata JSONB DEFAULT '{}',      -- Metadados técnicos: abc_classification, performance, etc.
    
    -- Campos comuns
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(organization_id, entity_type, external_id),
    CHECK (jsonb_typeof(business_data) = 'object'),
    CHECK (jsonb_typeof(configuration) = 'object'),
    CHECK (jsonb_typeof(metadata) = 'object')
);

-- Comentários
COMMENT ON TABLE tenant_business_entities IS 'Entidades de negócio genéricas: produtos, fornecedores, locais, clientes, etc.';
COMMENT ON COLUMN tenant_business_entities.entity_type IS 'Tipo da entidade: product, supplier, location, customer, variant';
COMMENT ON COLUMN tenant_business_entities.business_data IS 'Dados específicos do negócio: gender, brand, folder, cnpj, address, etc.';
COMMENT ON COLUMN tenant_business_entities.configuration IS 'Configurações: pricing, stock, contacts, settings';
COMMENT ON COLUMN tenant_business_entities.metadata IS 'Metadados técnicos: performance, classification, analytics';

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_org_type ON tenant_business_entities(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_external_id ON tenant_business_entities(organization_id, entity_type, external_id);
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_name ON tenant_business_entities(organization_id, entity_type, name);
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_status ON tenant_business_entities(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_created_at ON tenant_business_entities(created_at DESC);

-- Índices JSONB para queries específicas
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_business_data_gin ON tenant_business_entities USING gin(business_data);
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_configuration_gin ON tenant_business_entities USING gin(configuration);
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_metadata_gin ON tenant_business_entities USING gin(metadata);

-- Índices específicos para campos comuns no business_data
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_category ON tenant_business_entities(organization_id, entity_type, (business_data->>'category'));
CREATE INDEX IF NOT EXISTS idx_tenant_business_entities_brand ON tenant_business_entities(organization_id, entity_type, (business_data->>'brand')) WHERE business_data ? 'brand';

-- RLS
ALTER TABLE tenant_business_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_business_entities ON tenant_business_entities
    USING (organization_id = current_user_organization_id());

-- Triggers para auditoria
CREATE OR REPLACE FUNCTION update_tenant_business_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_business_entities_updated_at
    BEFORE UPDATE ON tenant_business_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_business_entities_updated_at();

-- =====================================================
-- 2. TABELA GENÉRICA: tenant_business_relationships
-- Substitui: relacionamentos entre core_products, core_suppliers, etc.
-- =====================================================

CREATE TABLE IF NOT EXISTS tenant_business_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Relacionamento genérico
    source_entity_id UUID NOT NULL REFERENCES tenant_business_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES tenant_business_entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- 'variant_of', 'supplied_by', 'located_at', 'priced_as', 'categorized_as'
    
    -- Dados específicos do relacionamento
    relationship_data JSONB DEFAULT '{}', -- size, color, price_type, quantity, etc.
    
    -- Campos comuns
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(organization_id, source_entity_id, target_entity_id, relationship_type),
    CHECK (source_entity_id != target_entity_id),
    CHECK (jsonb_typeof(relationship_data) = 'object')
);

-- Comentários
COMMENT ON TABLE tenant_business_relationships IS 'Relacionamentos entre entidades de negócio';
COMMENT ON COLUMN tenant_business_relationships.relationship_type IS 'Tipo: variant_of, supplied_by, located_at, priced_as';
COMMENT ON COLUMN tenant_business_relationships.relationship_data IS 'Dados do relacionamento: size, color, price_value, etc.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_business_relationships_org ON tenant_business_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_business_relationships_source ON tenant_business_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_tenant_business_relationships_target ON tenant_business_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_tenant_business_relationships_type ON tenant_business_relationships(organization_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_tenant_business_relationships_data_gin ON tenant_business_relationships USING gin(relationship_data);

-- RLS
ALTER TABLE tenant_business_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_business_relationships ON tenant_business_relationships
    USING (organization_id = current_user_organization_id());

-- =====================================================
-- 3. TABELA GENÉRICA: tenant_business_transactions
-- Substitui: core_orders, core_documents, core_movements
-- =====================================================

CREATE TABLE IF NOT EXISTS tenant_business_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Tipo e identificação da transação
    transaction_type TEXT NOT NULL, -- 'order', 'document', 'movement', 'sale', 'transfer', 'adjustment'
    external_id TEXT,
    transaction_number TEXT, -- número sequencial, nota fiscal, etc.
    
    -- Dados da transação
    transaction_data JSONB NOT NULL, -- dados específicos da transação
    transaction_items JSONB DEFAULT '[]', -- itens da transação
    
    -- Valores financeiros
    total_value DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    
    -- Localização e referências
    origin_entity_id UUID REFERENCES tenant_business_entities(id),
    destination_entity_id UUID REFERENCES tenant_business_entities(id),
    reference_transaction_id UUID REFERENCES tenant_business_transactions(id),
    
    -- Status e datas
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'error')),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(organization_id, transaction_type, external_id),
    CHECK (jsonb_typeof(transaction_data) = 'object'),
    CHECK (jsonb_typeof(transaction_items) = 'array'),
    CHECK (total_value >= 0)
);

-- Comentários
COMMENT ON TABLE tenant_business_transactions IS 'Transações de negócio genéricas: orders, documents, movements, sales';
COMMENT ON COLUMN tenant_business_transactions.transaction_type IS 'Tipo: order, document, movement, sale, transfer, adjustment';
COMMENT ON COLUMN tenant_business_transactions.transaction_data IS 'Dados específicos: supplier_info, document_type, movement_reason, etc.';
COMMENT ON COLUMN tenant_business_transactions.transaction_items IS 'Array de itens: [{entity_id, quantity, price, notes}, ...]';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_org_type ON tenant_business_transactions(organization_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_external_id ON tenant_business_transactions(organization_id, transaction_type, external_id);
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_number ON tenant_business_transactions(organization_id, transaction_number);
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_status ON tenant_business_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_date ON tenant_business_transactions(organization_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_origin ON tenant_business_transactions(origin_entity_id);
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_destination ON tenant_business_transactions(destination_entity_id);

-- Índices JSONB
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_data_gin ON tenant_business_transactions USING gin(transaction_data);
CREATE INDEX IF NOT EXISTS idx_tenant_business_transactions_items_gin ON tenant_business_transactions USING gin(transaction_items);

-- RLS
ALTER TABLE tenant_business_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_business_transactions ON tenant_business_transactions
    USING (organization_id = current_user_organization_id());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tenant_business_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_business_transactions_updated_at
    BEFORE UPDATE ON tenant_business_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_business_transactions_updated_at();

-- =====================================================
-- 4. VIEWS DE COMPATIBILIDADE TEMPORÁRIAS
-- =====================================================

-- View para compatibilidade com código que usa core_products
CREATE OR REPLACE VIEW core_products_compat AS
SELECT 
    id,
    external_id,
    name as product_name,
    business_data->>'category' as category,
    business_data->>'description' as description,
    business_data->>'gtin' as gtin,
    business_data->>'unit_measure' as unit_measure,
    business_data->>'gender' as gender,
    business_data->>'brand' as brand,
    business_data->>'folder' as folder,
    business_data->>'type' as type,
    business_data->>'supplier_external_id' as supplier_external_id,
    status,
    created_at,
    updated_at
FROM tenant_business_entities
WHERE entity_type = 'product'
    AND organization_id = current_user_organization_id();

-- View para compatibilidade com código que usa core_suppliers
CREATE OR REPLACE VIEW core_suppliers_compat AS
SELECT 
    id,
    external_id,
    name as trade_name,
    business_data->>'legal_name' as legal_name,
    business_data->>'cnpj' as cnpj,
    status,
    created_at,
    updated_at,
    organization_id
FROM tenant_business_entities
WHERE entity_type = 'supplier'
    AND organization_id = current_user_organization_id();

-- View para compatibilidade com tenant_inventory_items
CREATE OR REPLACE VIEW tenant_inventory_items_compat AS
SELECT 
    id,
    organization_id as tenant_id,
    external_id as product_id,
    external_id as sku,
    name,
    business_data->>'description' as description,
    (metadata->>'current_quantity')::INTEGER as current_quantity,
    (metadata->>'reserved_quantity')::INTEGER as reserved_quantity,
    (metadata->>'current_quantity')::INTEGER - COALESCE((metadata->>'reserved_quantity')::INTEGER, 0) as available_quantity,
    business_data->>'collection' as collection,
    business_data->>'season' as season,
    business_data->>'gender' as gender,
    business_data->>'material' as material,
    (business_data->>'heel_height')::DECIMAL as heel_height,
    business_data->>'style' as style,
    business_data->>'brand_tier' as brand_tier,
    (configuration->>'cost_price')::DECIMAL as cost_price,
    (configuration->>'selling_price')::DECIMAL as selling_price,
    created_at,
    updated_at
FROM tenant_business_entities
WHERE entity_type = 'product'
    AND metadata ? 'current_quantity'; -- Só produtos com controle de estoque

-- =====================================================
-- 5. GRANTS E PERMISSÕES
-- =====================================================

-- Grants para as novas tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_business_entities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_business_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_business_transactions TO authenticated;

-- Grants para as views de compatibilidade
GRANT SELECT ON core_products_compat TO authenticated;
GRANT SELECT ON core_suppliers_compat TO authenticated;
GRANT SELECT ON tenant_inventory_items_compat TO authenticated;

-- =====================================================
-- 6. CONFIGURAÇÃO PARA DIFERENTES TIPOS DE CLIENTE
-- =====================================================

-- Função para configurar organização com tipo de negócio
CREATE OR REPLACE FUNCTION configure_organization_business_domain(
    org_id UUID,
    business_domain TEXT,
    config JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    default_config JSONB;
BEGIN
    -- Configurações padrão por domínio
    CASE business_domain
        WHEN 'fashion_retail' THEN
            default_config := '{
                "entity_types": ["product", "supplier", "location", "variant"],
                "transaction_types": ["order", "document", "movement"],
                "required_fields": {
                    "product": ["gender", "brand", "folder", "season"],
                    "variant": ["size", "color"]
                },
                "modules": ["inventory", "performance", "insights"]
            }'::JSONB;
        WHEN 'general_retail' THEN
            default_config := '{
                "entity_types": ["product", "supplier", "location"],
                "transaction_types": ["order", "sale", "movement"],
                "modules": ["performance", "insights"]
            }'::JSONB;
        ELSE
            default_config := '{
                "entity_types": ["item", "contact", "location"],
                "transaction_types": ["transaction"],
                "modules": ["performance"]
            }'::JSONB;
    END CASE;
    
    -- Atualizar configuração da organização
    UPDATE organizations 
    SET implementation_config = default_config || config,
        client_type = CASE WHEN business_domain = 'general' THEN 'standard' ELSE 'custom' END
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. EXEMPLO DE CONFIGURAÇÃO PARA BANBAN
-- =====================================================

-- Configurar Banban como fashion_retail
DO $$
DECLARE
    banban_org_id UUID;
BEGIN
    SELECT id INTO banban_org_id FROM organizations WHERE slug = 'banban';
    
    IF banban_org_id IS NOT NULL THEN
        PERFORM configure_organization_business_domain(
            banban_org_id,
            'fashion_retail',
            '{
                "business_domain": "fashion_retail",
                "industry": "fashion",
                "specialization": "shoes_and_clothing",
                "custom_fields_enabled": true,
                "advanced_inventory": true
            }'::JSONB
        );
        
        RAISE NOTICE 'Banban configurado como fashion_retail domain';
    ELSE
        RAISE NOTICE 'Organização Banban não encontrada - configuração manual necessária';
    END IF;
END $$;

-- =====================================================
-- 8. RELATÓRIO FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'FASE 1: TABELAS GENÉRICAS CRIADAS COM SUCESSO';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tabelas criadas:';
    RAISE NOTICE '• tenant_business_entities (substitui core_products, core_suppliers, core_locations)';
    RAISE NOTICE '• tenant_business_relationships (substitui relacionamentos core_*)';
    RAISE NOTICE '• tenant_business_transactions (substitui core_orders, core_documents, core_movements)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views de compatibilidade:';
    RAISE NOTICE '• core_products_compat';
    RAISE NOTICE '• core_suppliers_compat';
    RAISE NOTICE '• tenant_inventory_items_compat';
    RAISE NOTICE '';
    RAISE NOTICE 'Benefícios alcançados:';
    RAISE NOTICE '✅ Arquitetura padronizada (tenant_* pattern)';
    RAISE NOTICE '✅ Flexibilidade total via JSONB';
    RAISE NOTICE '✅ Escalabilidade infinita';
    RAISE NOTICE '✅ RLS uniforme';
    RAISE NOTICE '✅ Compatibilidade mantida';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximo passo: Executar Fase 2 (migração de dados)';
    RAISE NOTICE '===============================================';
END $$; 