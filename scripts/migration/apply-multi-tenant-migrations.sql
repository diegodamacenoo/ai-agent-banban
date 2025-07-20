-- Script para aplicar migrações multi-tenant
-- Este script aplica todas as modificações necessárias para o sistema multi-tenant

-- 1. Verificar se as colunas multi-tenant já existem
DO $$
BEGIN
    -- Verificar se client_type já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'client_type'
    ) THEN
        -- Aplicar extensões na tabela organizations
        ALTER TABLE organizations ADD COLUMN client_type TEXT DEFAULT 'standard' CHECK (client_type IN ('custom', 'standard'));
        ALTER TABLE organizations ADD COLUMN implementation_config JSONB DEFAULT '{}';
        ALTER TABLE organizations ADD COLUMN custom_backend_url TEXT;
        ALTER TABLE organizations ADD COLUMN is_implementation_complete BOOLEAN DEFAULT false;
        ALTER TABLE organizations ADD COLUMN implementation_date TIMESTAMPTZ;
        ALTER TABLE organizations ADD COLUMN implementation_team_notes TEXT;
        
        -- Criar índices
        CREATE INDEX idx_organizations_client_type ON organizations(client_type);
        CREATE INDEX idx_organizations_implementation_status ON organizations(is_implementation_complete);
        
        RAISE NOTICE 'Colunas multi-tenant adicionadas à tabela organizations';
    ELSE
        RAISE NOTICE 'Colunas multi-tenant já existem na tabela organizations';
    END IF;
END
$$;

-- 2. Criar tabela custom_modules se não existir
CREATE TABLE IF NOT EXISTS custom_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    module_version TEXT DEFAULT '1.0.0',
    custom_code_path TEXT,
    api_endpoints JSONB DEFAULT '[]',
    configuration JSONB DEFAULT '{}',
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para custom_modules se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom_modules_org') THEN
        CREATE INDEX idx_custom_modules_org ON custom_modules(organization_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom_modules_active') THEN
        CREATE INDEX idx_custom_modules_active ON custom_modules(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_custom_modules_org_name') THEN
        CREATE UNIQUE INDEX idx_custom_modules_org_name ON custom_modules(organization_id, module_name);
    END IF;
END
$$;

-- Criar função de trigger para updated_at em custom_modules
CREATE OR REPLACE FUNCTION update_custom_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_custom_modules_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_custom_modules_updated_at
            BEFORE UPDATE ON custom_modules
            FOR EACH ROW
            EXECUTE FUNCTION update_custom_modules_updated_at();
    END IF;
END
$$;

-- 3. Criar tabela implementation_templates se não existir
CREATE TABLE IF NOT EXISTS implementation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    client_type TEXT CHECK (client_type IN ('custom', 'standard')),
    base_modules JSONB DEFAULT '[]',
    customization_points JSONB DEFAULT '{}',
    example_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para implementation_templates se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_implementation_templates_client_type') THEN
        CREATE INDEX idx_implementation_templates_client_type ON implementation_templates(client_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_implementation_templates_active') THEN
        CREATE INDEX idx_implementation_templates_active ON implementation_templates(is_active);
    END IF;
END
$$;

-- Criar função de trigger para updated_at em implementation_templates
CREATE OR REPLACE FUNCTION update_implementation_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_implementation_templates_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_implementation_templates_updated_at
            BEFORE UPDATE ON implementation_templates
            FOR EACH ROW
            EXECUTE FUNCTION update_implementation_templates_updated_at();
    END IF;
END
$$;

-- 4. Inserir dados iniciais em implementation_templates se não existirem
INSERT INTO implementation_templates (name, client_type, base_modules, description)
SELECT * FROM (VALUES
    ('Standard SaaS', 'standard', '["performance", "inventory", "alerts"]'::jsonb, 'Template padrão para clientes SaaS'),
    ('Fashion Retail', 'custom', '["fashion-performance", "size-analysis", "seasonal-trends"]'::jsonb, 'Template para varejo de moda'),
    ('Grocery Chain', 'custom', '["perishable-management", "supplier-analysis", "waste-tracking"]'::jsonb, 'Template para supermercados')
) AS new_data(name, client_type, base_modules, description)
WHERE NOT EXISTS (
    SELECT 1 FROM implementation_templates 
    WHERE implementation_templates.name = new_data.name
);

-- 5. Aplicar correção na tabela organizations se necessário
DO $$
BEGIN
    -- Verificar se a coluna id tem default gen_random_uuid()
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'id' 
        AND column_default LIKE '%gen_random_uuid%'
    ) THEN
        ALTER TABLE organizations ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Default gen_random_uuid() aplicado à coluna id da tabela organizations';
    END IF;
END
$$;

-- Relatório final
SELECT 
    'organizations' as tabela,
    COUNT(*) as registros,
    'Tabela principal' as tipo
FROM organizations

UNION ALL

SELECT 
    'custom_modules' as tabela,
    COUNT(*) as registros,
    'Módulos customizados' as tipo
FROM custom_modules

UNION ALL

SELECT 
    'implementation_templates' as tabela,
    COUNT(*) as registros,
    'Templates de implementação' as tipo
FROM implementation_templates;

-- Verificar estrutura das colunas multi-tenant
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('client_type', 'custom_backend_url', 'implementation_config', 'is_implementation_complete')
ORDER BY column_name; 