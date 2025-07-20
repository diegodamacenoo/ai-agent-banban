-- ================================================
-- ECA (Event-Condition-Action) Generic Tables
-- ================================================
-- Migration: 001_create_eca_tables
-- Description: Criar tabelas genéricas para arquitetura ECA baseada em /planning/banban/ECA.md
-- Author: System Migration
-- Date: 2025-01-07

-- ================================================
-- 1. TENANT BUSINESS ENTITIES
-- ================================================
-- Tabela genérica para TODAS as entidades de negócio
-- (Produtos, Fornecedores, Lojas, CDs)
CREATE TABLE IF NOT EXISTS tenant_business_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,                    -- Identificador do locatário (fixo: 'banban-org-id')
    entity_type VARCHAR(50) NOT NULL,           -- 'PRODUCT', 'SUPPLIER', 'LOCATION'
    external_id VARCHAR(255) NOT NULL,          -- Chave de negócio (SKU, CNPJ, Código da Loja)
    attributes JSONB NOT NULL DEFAULT '{}',     -- Dados específicos da entidade
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                     -- Soft delete
    
    -- Constraint de chave de negócio única por tenant
    CONSTRAINT unique_tenant_entity UNIQUE (organization_id, entity_type, external_id),
    
    -- Constraint de entity_type válido
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('PRODUCT', 'SUPPLIER', 'LOCATION'))
);

-- Índices otimizados para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_entities_tenant_type ON tenant_business_entities (organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_external_id ON tenant_business_entities (external_id);
CREATE INDEX IF NOT EXISTS idx_entities_type_active ON tenant_business_entities (entity_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entities_attributes_gin ON tenant_business_entities USING GIN (attributes);

-- ================================================
-- 2. TENANT BUSINESS TRANSACTIONS  
-- ================================================
-- Tabela genérica para TODAS as transações de negócio
-- (Pedidos, Documentos Fiscais, Movimentações)
CREATE TABLE IF NOT EXISTS tenant_business_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,                    -- Identificador do locatário
    transaction_type VARCHAR(50) NOT NULL,      -- 'ORDER_PURCHASE', 'DOCUMENT_SUPPLIER_IN', etc.
    external_id VARCHAR(255),                   -- Chave de negócio (pode ser NULL para transações internas)
    status VARCHAR(100) NOT NULL,               -- Estado atual da transação
    attributes JSONB NOT NULL DEFAULT '{}',     -- Dados específicos da transação
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                     -- Soft delete
    
    -- Constraint de chave de negócio única por tenant (quando external_id não é nulo)
    CONSTRAINT unique_tenant_transaction UNIQUE (organization_id, transaction_type, external_id),
    
    -- Constraint de transaction_type válido
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN (
        'ORDER_PURCHASE', 'DOCUMENT_SUPPLIER_IN', 'TRANSFER_OUT', 'TRANSFER_IN', 
        'DOCUMENT_SALE', 'DOCUMENT_RETURN', 'INVENTORY_MOVEMENT'
    ))
);

-- Índices otimizados para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_type ON tenant_business_transactions (organization_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON tenant_business_transactions (external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_status ON tenant_business_transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON tenant_business_transactions (transaction_type, status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON tenant_business_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_attributes_gin ON tenant_business_transactions USING GIN (attributes);

-- ================================================
-- 3. TENANT BUSINESS RELATIONSHIPS
-- ================================================
-- Tabela genérica para TODOS os relacionamentos
-- (A cola que conecta entidades e transações)
CREATE TABLE IF NOT EXISTS tenant_business_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,                    -- Identificador do locatário
    source_id UUID NOT NULL,                    -- FK para tenant_business_entities.id ou tenant_business_transactions.id
    target_id UUID NOT NULL,                    -- FK para tenant_business_entities.id ou tenant_business_transactions.id
    relationship_type VARCHAR(50) NOT NULL,     -- 'CONTAINS_ITEM', 'BASED_ON_ORDER', etc.
    attributes JSONB NOT NULL DEFAULT '{}',     -- Dados específicos do relacionamento
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                     -- Soft delete
    
    -- Constraint de relacionamento único
    CONSTRAINT unique_relationship UNIQUE (source_id, target_id, relationship_type),
    
    -- Constraint de relationship_type válido
    CONSTRAINT valid_relationship_type CHECK (relationship_type IN (
        'CONTAINS_ITEM', 'BASED_ON_ORDER', 'AFFECTS_PRODUCT', 'AT_LOCATION', 
        'CAUSED_BY_DOCUMENT', 'FROM_SUPPLIER', 'TO_CUSTOMER'
    ))
);

-- Índices otimizados para consultas de relacionamentos
CREATE INDEX IF NOT EXISTS idx_relationships_source ON tenant_business_relationships (source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON tenant_business_relationships (target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON tenant_business_relationships (relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_tenant ON tenant_business_relationships (organization_id);
CREATE INDEX IF NOT EXISTS idx_relationships_attributes_gin ON tenant_business_relationships USING GIN (attributes);

-- ================================================
-- 4. TRIGGERS PARA UPDATED_AT
-- ================================================
-- Função para atualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para tenant_business_entities
DROP TRIGGER IF EXISTS trigger_update_entities_updated_at ON tenant_business_entities;
CREATE TRIGGER trigger_update_entities_updated_at
    BEFORE UPDATE ON tenant_business_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tenant_business_transactions  
DROP TRIGGER IF EXISTS trigger_update_transactions_updated_at ON tenant_business_transactions;
CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON tenant_business_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================================
COMMENT ON TABLE tenant_business_entities IS 'Tabela genérica para todas as entidades de negócio (produtos, fornecedores, locais)';
COMMENT ON COLUMN tenant_business_entities.organization_id IS 'Identificador do locatário/organização';
COMMENT ON COLUMN tenant_business_entities.entity_type IS 'Tipo da entidade: PRODUCT, SUPPLIER, LOCATION';
COMMENT ON COLUMN tenant_business_entities.external_id IS 'Chave de negócio externa (SKU, CNPJ, Código)';
COMMENT ON COLUMN tenant_business_entities.attributes IS 'Dados específicos da entidade em formato JSON';

COMMENT ON TABLE tenant_business_transactions IS 'Tabela genérica para todas as transações de negócio';
COMMENT ON COLUMN tenant_business_transactions.transaction_type IS 'Tipo da transação: ORDER_PURCHASE, DOCUMENT_SUPPLIER_IN, etc.';
COMMENT ON COLUMN tenant_business_transactions.external_id IS 'Chave de negócio externa (pode ser NULL para transações internas)';
COMMENT ON COLUMN tenant_business_transactions.status IS 'Estado atual da transação';
COMMENT ON COLUMN tenant_business_transactions.attributes IS 'Dados específicos da transação em formato JSON';

COMMENT ON TABLE tenant_business_relationships IS 'Tabela genérica para relacionamentos entre entidades e transações';
COMMENT ON COLUMN tenant_business_relationships.source_id IS 'ID da entidade/transação origem';
COMMENT ON COLUMN tenant_business_relationships.target_id IS 'ID da entidade/transação destino';
COMMENT ON COLUMN tenant_business_relationships.relationship_type IS 'Tipo do relacionamento: CONTAINS_ITEM, BASED_ON_ORDER, etc.';
COMMENT ON COLUMN tenant_business_relationships.attributes IS 'Dados específicos do relacionamento em formato JSON';

-- ================================================
-- 6. INSERIR TENANT PADRÃO (BANBAN)
-- ================================================
-- Verificar se a tabela organizations existe, se não, criar uma entrada dummy
DO $$
BEGIN
    -- Verificar se tenant banban já existe (assumindo que há uma tabela organizations)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organizations'
    ) THEN
        -- Se não existe tabela organizations, criar uma simples para o tenant
        CREATE TABLE IF NOT EXISTS organizations (
            id UUID PRIMARY KEY,
            slug VARCHAR(100) UNIQUE NOT NULL,
            company_trading_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Inserir organização BanBan
        INSERT INTO organizations (id, slug, company_trading_name)
        VALUES ('banban-org-id'::UUID, 'banban', 'BanBan Footwear')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END
$$;

-- ================================================
-- FINAL DA MIGRAÇÃO
-- ================================================
-- Migração 001_create_eca_tables completada com sucesso