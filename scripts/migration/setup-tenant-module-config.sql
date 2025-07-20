-- Script para configurar sistema de módulos multi-tenant
-- Data: 20 de Junho de 2025

-- 1. Criar tabela de configuração de módulos por tenant
CREATE TABLE IF NOT EXISTS tenant_module_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_type TEXT NOT NULL CHECK (client_type IN ('standard', 'custom')),
    industry_type TEXT NOT NULL DEFAULT 'generic' CHECK (industry_type IN ('fashion', 'grocery', 'healthcare', 'manufacturing', 'automotive', 'generic')),
    
    -- Configuração dos módulos ativos
    active_modules JSONB NOT NULL DEFAULT '{}',
    
    -- Customizações específicas do tenant
    customizations JSONB NOT NULL DEFAULT '{}',
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir um config por organização
    UNIQUE(organization_id)
);

-- 2. Criar tabela de definições de módulos disponíveis
CREATE TABLE IF NOT EXISTS module_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('base', 'industry', 'custom')),
    industry_type TEXT CHECK (industry_type IN ('fashion', 'grocery', 'healthcare', 'manufacturing', 'automotive', 'generic')),
    inherits_from TEXT REFERENCES module_definitions(name),
    version TEXT NOT NULL DEFAULT '1.0.0',
    
    -- Configuração do módulo
    endpoints JSONB NOT NULL DEFAULT '[]',
    features JSONB NOT NULL DEFAULT '[]',
    dependencies JSONB NOT NULL DEFAULT '[]',
    
    -- Metadados
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_module_configs_org_id ON tenant_module_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_module_configs_client_type ON tenant_module_configs(client_type);
CREATE INDEX IF NOT EXISTS idx_tenant_module_configs_industry ON tenant_module_configs(industry_type);
CREATE INDEX IF NOT EXISTS idx_module_definitions_type ON module_definitions(type);
CREATE INDEX IF NOT EXISTS idx_module_definitions_industry ON module_definitions(industry_type);

-- 4. Inserir definições de módulos base
INSERT INTO module_definitions (name, type, endpoints, features, description) VALUES
(
    'performance-base',
    'base',
    '["business-metrics", "summary", "calculate"]'::jsonb,
    '["basic_analytics", "standard_reports", "kpi_tracking"]'::jsonb,
    'Módulo base de performance com métricas fundamentais'
),
(
    'insights-base',
    'base',
    '["generate", "list", "feedback"]'::jsonb,
    '["basic_insights", "alert_system", "notifications"]'::jsonb,
    'Módulo base de insights com funcionalidades essenciais'
),
(
    'catalog-base',
    'base',
    '["products", "variants", "search"]'::jsonb,
    '["product_crud", "basic_search", "inventory_status"]'::jsonb,
    'Módulo base de catálogo com gestão de produtos'
),
(
    'events-base',
    'base',
    '["list", "search", "audit"]'::jsonb,
    '["event_logging", "audit_trail", "system_monitoring"]'::jsonb,
    'Módulo base de eventos e auditoria'
),
(
    'webhooks-base',
    'base',
    '["process", "status", "logs"]'::jsonb,
    '["webhook_processing", "integration_management", "flow_control"]'::jsonb,
    'Módulo base de webhooks e integrações'
)
ON CONFLICT (name) DO NOTHING;

-- 5. Inserir módulos específicos da indústria fashion
INSERT INTO module_definitions (name, type, industry_type, inherits_from, endpoints, features, description) VALUES
(
    'fashion-performance',
    'industry',
    'fashion',
    'performance-base',
    '["size-analysis", "seasonal-trends", "color-performance", "margin-by-category"]'::jsonb,
    '["size_analytics", "seasonal_forecasting", "color_trends", "category_margins"]'::jsonb,
    'Módulo de performance especializado para varejo de moda'
),
(
    'fashion-insights',
    'industry',
    'fashion',
    'insights-base',
    '["trend-predictions", "style-recommendations", "seasonal-alerts"]'::jsonb,
    '["trend_analysis", "style_ai", "seasonal_intelligence"]'::jsonb,
    'Módulo de insights especializado para moda'
),
(
    'fashion-catalog',
    'industry',
    'fashion',
    'catalog-base',
    '["variant-management", "size-color-matrix", "collection-grouping"]'::jsonb,
    '["variant_tracking", "size_management", "collection_organization"]'::jsonb,
    'Módulo de catálogo especializado para produtos de moda'
)
ON CONFLICT (name) DO NOTHING;

-- 6. Inserir módulos específicos da indústria grocery
INSERT INTO module_definitions (name, type, industry_type, inherits_from, endpoints, features, description) VALUES
(
    'grocery-performance',
    'industry',
    'grocery',
    'performance-base',
    '["perishable-analysis", "waste-tracking", "supplier-scorecard", "freshness-metrics"]'::jsonb,
    '["expiration_tracking", "waste_analytics", "supplier_performance", "freshness_monitoring"]'::jsonb,
    'Módulo de performance para supermercados e grocery'
),
(
    'grocery-insights',
    'industry',
    'grocery',
    'insights-base',
    '["expiration-alerts", "demand-forecasting", "waste-optimization"]'::jsonb,
    '["expiration_intelligence", "demand_prediction", "waste_reduction"]'::jsonb,
    'Módulo de insights para gestão de perecíveis'
),
(
    'grocery-catalog',
    'industry',
    'grocery',
    'catalog-base',
    '["expiration-tracking", "batch-management", "supplier-linking"]'::jsonb,
    '["batch_control", "expiration_management", "supplier_integration"]'::jsonb,
    'Módulo de catálogo para produtos perecíveis'
)
ON CONFLICT (name) DO NOTHING;

-- 7. Inserir módulos customizados do BanBan
INSERT INTO module_definitions (name, type, industry_type, inherits_from, endpoints, features, description) VALUES
(
    'banban-performance',
    'custom',
    'fashion',
    'fashion-performance',
    '["advanced-forecasting", "ai-recommendations", "custom-kpis", "predictive-analytics"]'::jsonb,
    '["ai_insights", "predictive_analytics", "custom_dashboards", "advanced_forecasting"]'::jsonb,
    'Módulo de performance customizado para BanBan com IA avançada'
),
(
    'banban-insights',
    'custom',
    'fashion',
    'fashion-insights',
    '["ai-powered-insights", "custom-dashboards", "advanced-alerts"]'::jsonb,
    '["ai_engine", "custom_ui", "intelligent_alerts", "contextual_analytics"]'::jsonb,
    'Módulo de insights customizado para BanBan com IA'
),
(
    'banban-catalog',
    'custom',
    'fashion',
    'fashion-catalog',
    '["smart-categorization", "auto-tagging", "ml-recommendations"]'::jsonb,
    '["ml_categorization", "auto_tagging", "recommendation_engine"]'::jsonb,
    'Módulo de catálogo customizado para BanBan com ML'
)
ON CONFLICT (name) DO NOTHING;

-- 8. Configurar tenant BanBan (customizado)
INSERT INTO tenant_module_configs (
    organization_id,
    client_type,
    industry_type,
    active_modules,
    customizations
)
SELECT 
    o.id,
    'custom',
    'fashion',
    '{
        "performance": {
            "type": "custom",
            "name": "banban-performance",
            "version": "2.1.0",
            "inheritsFrom": "fashion-performance"
        },
        "insights": {
            "type": "custom",
            "name": "banban-insights",
            "version": "1.5.0",
            "inheritsFrom": "fashion-insights"
        },
        "catalog": {
            "type": "custom",
            "name": "banban-catalog",
            "version": "1.8.0",
            "inheritsFrom": "fashion-catalog"
        },
        "events": {
            "type": "base",
            "name": "events-base",
            "version": "1.0.0"
        },
        "webhooks": {
            "type": "base",
            "name": "webhooks-base",
            "version": "1.0.0"
        }
    }'::jsonb,
    '{
        "banban-performance": {
            "endpoints": [
                "/api/v1/performance/advanced-forecasting",
                "/api/v1/performance/ai-recommendations",
                "/api/v1/performance/custom-kpis"
            ],
            "features": ["ai_insights", "predictive_analytics", "custom_dashboards"],
            "business_rules": {
                "margin_calculation": "advanced",
                "forecast_horizon": "90_days",
                "ai_recommendations": true
            }
        },
        "banban-insights": {
            "endpoints": [
                "/api/v1/insights/ai-powered-insights",
                "/api/v1/insights/custom-dashboards"
            ],
            "features": ["ai_engine", "contextual_analytics"],
            "business_rules": {
                "ai_confidence_threshold": 0.85,
                "insight_refresh_interval": "15_minutes"
            }
        }
    }'::jsonb
FROM organizations o
WHERE o.company_trading_name = 'Teste Org'
   OR o.company_legal_name LIKE '%BanBan%'
   OR o.client_type = 'custom'
LIMIT 1
ON CONFLICT (organization_id) DO UPDATE SET
    active_modules = EXCLUDED.active_modules,
    customizations = EXCLUDED.customizations,
    updated_at = NOW();

-- 9. Configurar tenant padrão (standard)
INSERT INTO tenant_module_configs (
    organization_id,
    client_type,
    industry_type,
    active_modules,
    customizations
)
SELECT 
    o.id,
    'standard',
    'generic',
    '{
        "performance": {
            "type": "base",
            "name": "performance-base",
            "version": "1.0.0"
        },
        "insights": {
            "type": "base",
            "name": "insights-base",
            "version": "1.0.0"
        },
        "catalog": {
            "type": "base",
            "name": "catalog-base",
            "version": "1.0.0"
        },
        "events": {
            "type": "base",
            "name": "events-base",
            "version": "1.0.0"
        },
        "webhooks": {
            "type": "base",
            "name": "webhooks-base",
            "version": "1.0.0"
        }
    }'::jsonb,
    '{}'::jsonb
FROM organizations o
WHERE o.client_type = 'standard'
   OR o.company_trading_name = 'SaaS Padrão'
LIMIT 1
ON CONFLICT (organization_id) DO NOTHING;

-- 10. Criar função para resolver módulos de um tenant
CREATE OR REPLACE FUNCTION resolve_tenant_modules(tenant_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    config_record tenant_module_configs;
    resolved_modules JSONB := '{}';
    module_name TEXT;
    module_config JSONB;
    module_def module_definitions;
    parent_modules JSONB;
BEGIN
    -- Buscar configuração do tenant
    SELECT * INTO config_record
    FROM tenant_module_configs
    WHERE organization_id = tenant_org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant configuration not found for organization %', tenant_org_id;
    END IF;
    
    -- Resolver cada módulo
    FOR module_name, module_config IN
        SELECT * FROM jsonb_each(config_record.active_modules)
    LOOP
        -- Buscar definição do módulo
        SELECT * INTO module_def
        FROM module_definitions
        WHERE name = (module_config->>'name')
        AND is_active = true;
        
        IF FOUND THEN
            -- Resolver herança recursivamente
            parent_modules := '{}';
            IF module_def.inherits_from IS NOT NULL THEN
                parent_modules := resolve_module_inheritance(module_def.inherits_from);
            END IF;
            
            -- Combinar módulo atual com herança
            resolved_modules := resolved_modules || jsonb_build_object(
                module_name,
                jsonb_build_object(
                    'definition', to_jsonb(module_def),
                    'config', module_config,
                    'inheritance', parent_modules,
                    'customizations', COALESCE(config_record.customizations->module_name, '{}')
                )
            );
        END IF;
    END LOOP;
    
    RETURN resolved_modules;
END;
$$;

-- 11. Criar função auxiliar para resolver herança
CREATE OR REPLACE FUNCTION resolve_module_inheritance(module_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    module_def module_definitions;
    parent_modules JSONB := '{}';
BEGIN
    SELECT * INTO module_def
    FROM module_definitions
    WHERE name = module_name
    AND is_active = true;
    
    IF FOUND THEN
        IF module_def.inherits_from IS NOT NULL THEN
            parent_modules := resolve_module_inheritance(module_def.inherits_from);
        END IF;
        
        RETURN parent_modules || to_jsonb(module_def);
    END IF;
    
    RETURN '{}';
END;
$$;

-- 12. Relatório de configuração
SELECT 
    'tenant_module_configs' as tabela,
    COUNT(*) as registros,
    'Configurações de módulos por tenant' as descricao
FROM tenant_module_configs

UNION ALL

SELECT 
    'module_definitions' as tabela,
    COUNT(*) as registros,
    'Definições de módulos disponíveis' as descricao
FROM module_definitions;

-- 13. Verificar configurações criadas
SELECT 
    o.company_trading_name,
    tmc.client_type,
    tmc.industry_type,
    jsonb_pretty(tmc.active_modules) as modules_config
FROM tenant_module_configs tmc
JOIN organizations o ON o.id = tmc.organization_id
ORDER BY tmc.client_type, o.company_trading_name;

-- 14. Testar resolução de módulos para BanBan
SELECT 
    'BanBan Module Resolution' as title,
    jsonb_pretty(resolve_tenant_modules(o.id)) as resolved_modules
FROM organizations o
JOIN tenant_module_configs tmc ON tmc.organization_id = o.id
WHERE tmc.client_type = 'custom'
LIMIT 1; 