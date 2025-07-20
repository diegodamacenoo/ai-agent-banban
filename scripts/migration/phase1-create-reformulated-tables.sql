-- ================================================
-- MIGRAÇÃO FASE 1: REFORMULAÇÃO DO SISTEMA DE MÓDULOS
-- ================================================
-- Data: Janeiro 2025
-- Versão: 1.0.0
-- Objetivo: Criar novas tabelas do plano de reformulação
-- Base: docs/implementations/REFORMULAÇÃO_MODULOS.md

-- ================================================
-- 1. CRIAR CATÁLOGO GLOBAL DE MÓDULOS
-- ================================================

-- Tabela mestre de módulos disponíveis no sistema
CREATE TABLE IF NOT EXISTS core_modules (
    module_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'standard' CHECK (category IN ('standard', 'custom', 'industry')),
    
    -- Maturidade global do módulo
    maturity_status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (maturity_status IN (
        'PLANNED', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'RC', 
        'GA', 'MAINTENANCE', 'DEPRECATED', 'RETIRED'
    )),
    
    -- Pricing e monetização
    pricing_tier TEXT DEFAULT 'free' CHECK (pricing_tier IN ('free', 'basic', 'premium', 'enterprise')),
    base_price_monthly DECIMAL(10,2) DEFAULT 0.00,
    usage_based_pricing JSONB DEFAULT '{}', -- { "per_call": 0.001, "per_token": 0.0001 }
    
    -- Dependências e compatibilidade
    dependencies TEXT[] DEFAULT '{}',
    compatibility_matrix JSONB DEFAULT '{}', -- Versões do Axon suportadas
    
    -- Metadados
    author TEXT,
    vendor TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    
    -- Controle de disponibilidade
    is_available BOOLEAN DEFAULT true,
    is_internal_only BOOLEAN DEFAULT false, -- Para módulos ALPHA/BETA
    requires_approval BOOLEAN DEFAULT false, -- Para módulos premium
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deprecated_at TIMESTAMPTZ,
    retirement_date TIMESTAMPTZ
);

-- ================================================
-- 2. CRIAR VERSIONAMENTO DE MÓDULOS
-- ================================================

-- Controle de versões semânticas dos módulos
CREATE TABLE IF NOT EXISTS core_module_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id TEXT NOT NULL REFERENCES core_modules(module_id) ON DELETE CASCADE,
    version TEXT NOT NULL, -- Semver: 1.2.3
    
    -- Build e release info
    build_hash TEXT,
    release_notes TEXT,
    changelog_url TEXT,
    
    -- Scripts de migração
    upgrade_script TEXT, -- SQL ou procedimento para upgrade
    downgrade_script TEXT, -- SQL para rollback
    migration_notes TEXT,
    
    -- Status da versão
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'released', 'deprecated')),
    is_stable BOOLEAN DEFAULT false,
    is_latest BOOLEAN DEFAULT false,
    
    -- Compatibilidade
    min_axon_version TEXT, -- Versão mínima do Axon
    max_axon_version TEXT, -- Versão máxima do Axon
    breaking_changes BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(module_id, version)
);

-- ================================================
-- 3. REFORMULAR MÓDULOS POR TENANT
-- ================================================

-- Renomear tabela atual para nova estrutura
-- (Manteremos organization_modules temporariamente para compatibilidade)

CREATE TABLE IF NOT EXISTS tenant_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES core_modules(module_id) ON DELETE CASCADE,
    version_id UUID REFERENCES core_module_versions(version_id),
    
    -- Estado operacional por tenant (do plano de reformulação)
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED',           -- Tenant clicou Enable
        'PENDING_APPROVAL',    -- Aguardando aprovação humana ou crédito
        'PROVISIONING',        -- Infra, tabelas, chaves
        'ENABLED',             -- Pronto para uso
        'UPGRADING',           -- Executando scripts de upgrade
        'UP_TO_DATE',          -- Última versão GA
        'SUSPENDED',           -- Pagamento/límites
        'DISABLED',            -- Desligado pelo tenant
        'ARCHIVED',            -- Dados exportados/purgados
        'ERROR'                -- Falha de setup/upgrade
    )),
    
    -- Informações de provisioning
    provisioned_at TIMESTAMPTZ,
    last_health_check TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'warning', 'critical', 'unknown')),
    
    -- Controle de upgrade
    auto_upgrade BOOLEAN DEFAULT true,
    locked_version BOOLEAN DEFAULT false,
    upgrade_window TEXT, -- "maintenance", "immediate", "scheduled"
    
    -- Billing e usage
    billing_enabled BOOLEAN DEFAULT false,
    usage_limit JSONB DEFAULT '{}', -- {"calls_per_day": 1000, "tokens_per_month": 10000}
    current_usage JSONB DEFAULT '{}',
    
    -- Configuração específica do tenant (migrada de organization_modules)
    configuration JSONB DEFAULT '{}',
    custom_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(tenant_id, module_id)
);

-- ================================================
-- 4. CONFIGURAÇÕES DETALHADAS POR MÓDULO/TENANT
-- ================================================

-- Configurações específicas e schema validation
CREATE TABLE IF NOT EXISTS tenant_module_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_module_id UUID NOT NULL REFERENCES tenant_modules(id) ON DELETE CASCADE,
    
    -- Configuração e validação
    settings JSONB NOT NULL DEFAULT '{}',
    schema_version TEXT DEFAULT '1.0.0',
    validation_errors JSONB DEFAULT '[]',
    
    -- Metadados
    last_validated_at TIMESTAMPTZ,
    configured_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. TELEMETRIA E USAGE LOGS
-- ================================================

-- Logs de uso para billing e analytics
CREATE TABLE IF NOT EXISTS module_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_module_id UUID NOT NULL REFERENCES tenant_modules(id) ON DELETE CASCADE,
    
    -- Contexto da chamada
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    -- Métricas de uso
    request_count INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    tokens_consumed INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 1,
    data_processed_bytes BIGINT DEFAULT 0,
    
    -- Custo estimado
    estimated_cost_cents INTEGER DEFAULT 0,
    pricing_model TEXT DEFAULT 'free', -- 'free', 'per_call', 'per_token'
    
    -- Status da requisição
    http_status INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamp de uso
    used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexação por data para partitioning
    date_partition DATE GENERATED ALWAYS AS (timezone('UTC', used_at)::date) STORED
);

-- ================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índices para core_modules
CREATE INDEX IF NOT EXISTS idx_core_modules_maturity ON core_modules(maturity_status);
CREATE INDEX IF NOT EXISTS idx_core_modules_category ON core_modules(category);
CREATE INDEX IF NOT EXISTS idx_core_modules_pricing ON core_modules(pricing_tier);
CREATE INDEX IF NOT EXISTS idx_core_modules_available ON core_modules(is_available, is_internal_only);

-- Índices para core_module_versions
CREATE INDEX IF NOT EXISTS idx_module_versions_module_id ON core_module_versions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_versions_status ON core_module_versions(status);
CREATE INDEX IF NOT EXISTS idx_module_versions_latest ON core_module_versions(is_latest, is_stable);
CREATE INDEX IF NOT EXISTS idx_module_versions_released ON core_module_versions(released_at DESC);

-- Índices para tenant_modules
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant_id ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_status ON tenant_modules(status);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_health ON tenant_modules(health_status);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_billing ON tenant_modules(billing_enabled);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_health_check ON tenant_modules(last_health_check);

-- Índices para tenant_module_settings
CREATE INDEX IF NOT EXISTS idx_tenant_module_settings_tenant_module ON tenant_module_settings(tenant_module_id);
CREATE INDEX IF NOT EXISTS idx_tenant_module_settings_validated ON tenant_module_settings(last_validated_at);

-- Índices para module_usage_logs (com partitioning em mente)
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant_module ON module_usage_logs(tenant_module_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON module_usage_logs(date_partition DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_endpoint ON module_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON module_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_cost ON module_usage_logs(estimated_cost_cents) WHERE estimated_cost_cents > 0;

-- ================================================
-- 7. ROW LEVEL SECURITY
-- ================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE core_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_module_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para core_modules (público para leitura, admin para escrita)
CREATE POLICY "core_modules_public_read" ON core_modules
    FOR SELECT USING (is_available = true);

CREATE POLICY "core_modules_admin_all" ON core_modules
    FOR ALL USING (is_master_admin());

-- Políticas para core_module_versions (público para leitura, admin para escrita)
CREATE POLICY "core_module_versions_public_read" ON core_module_versions
    FOR SELECT USING (status = 'released');

CREATE POLICY "core_module_versions_admin_all" ON core_module_versions
    FOR ALL USING (is_master_admin());

-- Políticas para tenant_modules (isolamento por tenant)
CREATE POLICY "tenant_modules_isolation" ON tenant_modules
    FOR ALL USING (
        tenant_id = get_user_organization_id() OR is_master_admin()
    );

-- Políticas para tenant_module_settings (isolamento por tenant)
CREATE POLICY "tenant_module_settings_isolation" ON tenant_module_settings
    FOR ALL USING (
        tenant_module_id IN (
            SELECT id FROM tenant_modules 
            WHERE tenant_id = get_user_organization_id()
        ) OR is_master_admin()
    );

-- Políticas para module_usage_logs (isolamento por tenant)
CREATE POLICY "module_usage_logs_isolation" ON module_usage_logs
    FOR ALL USING (
        tenant_module_id IN (
            SELECT id FROM tenant_modules 
            WHERE tenant_id = get_user_organization_id()
        ) OR is_master_admin()
    );

-- ================================================
-- 8. TRIGGERS E FUNÇÕES AUXILIARES
-- ================================================

-- Trigger para updated_at em core_modules
CREATE OR REPLACE FUNCTION update_core_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_core_modules_updated_at
    BEFORE UPDATE ON core_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_core_modules_updated_at();

-- Trigger para updated_at em tenant_modules
CREATE OR REPLACE FUNCTION update_tenant_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_modules_updated_at
    BEFORE UPDATE ON tenant_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_modules_updated_at();

-- Trigger para updated_at em tenant_module_settings
CREATE OR REPLACE FUNCTION update_tenant_module_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_module_settings_updated_at
    BEFORE UPDATE ON tenant_module_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_module_settings_updated_at();

-- ================================================
-- 9. FUNÇÕES DE GESTÃO E ESTATÍSTICAS
-- ================================================

-- Função para obter estatísticas do catálogo
CREATE OR REPLACE FUNCTION get_module_catalog_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Apenas master admin pode ver stats globais
    IF NOT is_master_admin() THEN
        RAISE EXCEPTION 'Access denied - master admin required';
    END IF;

    SELECT jsonb_build_object(
        'total_modules', COUNT(*),
        'by_maturity', jsonb_build_object(
            'PLANNED', COUNT(*) FILTER (WHERE maturity_status = 'PLANNED'),
            'IN_DEVELOPMENT', COUNT(*) FILTER (WHERE maturity_status = 'IN_DEVELOPMENT'),
            'ALPHA', COUNT(*) FILTER (WHERE maturity_status = 'ALPHA'),
            'BETA', COUNT(*) FILTER (WHERE maturity_status = 'BETA'),
            'RC', COUNT(*) FILTER (WHERE maturity_status = 'RC'),
            'GA', COUNT(*) FILTER (WHERE maturity_status = 'GA'),
            'MAINTENANCE', COUNT(*) FILTER (WHERE maturity_status = 'MAINTENANCE'),
            'DEPRECATED', COUNT(*) FILTER (WHERE maturity_status = 'DEPRECATED'),
            'RETIRED', COUNT(*) FILTER (WHERE maturity_status = 'RETIRED')
        ),
        'by_category', jsonb_build_object(
            'standard', COUNT(*) FILTER (WHERE category = 'standard'),
            'custom', COUNT(*) FILTER (WHERE category = 'custom'),
            'industry', COUNT(*) FILTER (WHERE category = 'industry')
        ),
        'by_pricing', jsonb_build_object(
            'free', COUNT(*) FILTER (WHERE pricing_tier = 'free'),
            'basic', COUNT(*) FILTER (WHERE pricing_tier = 'basic'),
            'premium', COUNT(*) FILTER (WHERE pricing_tier = 'premium'),
            'enterprise', COUNT(*) FILTER (WHERE pricing_tier = 'enterprise')
        ),
        'availability', jsonb_build_object(
            'available', COUNT(*) FILTER (WHERE is_available = true),
            'internal_only', COUNT(*) FILTER (WHERE is_internal_only = true),
            'requires_approval', COUNT(*) FILTER (WHERE requires_approval = true)
        )
    ) INTO result
    FROM core_modules;

    RETURN result;
END;
$$;

-- Função para obter estatísticas de um tenant
CREATE OR REPLACE FUNCTION get_tenant_modules_stats(tenant_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Verificar acesso ao tenant
    IF NOT (
        tenant_org_id = get_user_organization_id() OR 
        is_master_admin()
    ) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;

    SELECT jsonb_build_object(
        'total_modules', COUNT(*),
        'by_status', jsonb_build_object(
            'REQUESTED', COUNT(*) FILTER (WHERE status = 'REQUESTED'),
            'PENDING_APPROVAL', COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL'),
            'PROVISIONING', COUNT(*) FILTER (WHERE status = 'PROVISIONING'),
            'ENABLED', COUNT(*) FILTER (WHERE status = 'ENABLED'),
            'UPGRADING', COUNT(*) FILTER (WHERE status = 'UPGRADING'),
            'UP_TO_DATE', COUNT(*) FILTER (WHERE status = 'UP_TO_DATE'),
            'SUSPENDED', COUNT(*) FILTER (WHERE status = 'SUSPENDED'),
            'DISABLED', COUNT(*) FILTER (WHERE status = 'DISABLED'),
            'ARCHIVED', COUNT(*) FILTER (WHERE status = 'ARCHIVED'),
            'ERROR', COUNT(*) FILTER (WHERE status = 'ERROR')
        ),
        'by_health', jsonb_build_object(
            'healthy', COUNT(*) FILTER (WHERE health_status = 'healthy'),
            'warning', COUNT(*) FILTER (WHERE health_status = 'warning'),
            'critical', COUNT(*) FILTER (WHERE health_status = 'critical'),
            'unknown', COUNT(*) FILTER (WHERE health_status = 'unknown')
        ),
        'billing', jsonb_build_object(
            'enabled', COUNT(*) FILTER (WHERE billing_enabled = true),
            'total_cost_cents', COALESCE(SUM((current_usage->>'cost_cents')::integer), 0)
        )
    ) INTO result
    FROM tenant_modules
    WHERE tenant_id = tenant_org_id;

    RETURN result;
END;
$$;

-- ================================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================================

COMMENT ON TABLE core_modules IS 'Catálogo global de módulos disponíveis no sistema Axon';
COMMENT ON TABLE core_module_versions IS 'Controle de versões semânticas dos módulos';
COMMENT ON TABLE tenant_modules IS 'Estado operacional dos módulos por tenant/organização';
COMMENT ON TABLE tenant_module_settings IS 'Configurações específicas de módulos por tenant';
COMMENT ON TABLE module_usage_logs IS 'Logs de uso para billing e telemetria';

COMMENT ON COLUMN core_modules.maturity_status IS 'Status de maturidade global: PLANNED → IN_DEVELOPMENT → ALPHA → BETA → RC → GA → MAINTENANCE → DEPRECATED → RETIRED';
COMMENT ON COLUMN tenant_modules.status IS 'Estado operacional: REQUESTED → PENDING_APPROVAL → PROVISIONING → ENABLED ↔ UPGRADING → DISABLED/SUSPENDED → ARCHIVED';
COMMENT ON COLUMN module_usage_logs.estimated_cost_cents IS 'Custo estimado em centavos para billing pay-as-you-go';

-- ================================================
-- 11. DADOS INICIAIS (SEED DATA)
-- ================================================

-- Inserir módulos básicos do sistema atual
INSERT INTO core_modules (module_id, name, slug, description, category, maturity_status, pricing_tier) VALUES
('banban-insights', 'Insights Avançados', 'insights-avancados', 'Sistema de insights com IA para análise de dados de varejo', 'custom', 'GA', 'premium'),
('banban-performance', 'Performance Analytics', 'performance-analytics', 'Análise de performance e métricas de negócio', 'custom', 'GA', 'premium'),
('banban-alerts', 'Sistema de Alertas', 'sistema-alertas', 'Alertas inteligentes baseados em regras de negócio', 'custom', 'GA', 'basic'),
('banban-inventory', 'Gestão de Estoque', 'gestao-estoque', 'Controle avançado de estoque para varejo de moda', 'custom', 'GA', 'premium'),
('banban-data-processing', 'Processamento de Dados', 'processamento-dados', 'ETL e processamento de dados em tempo real', 'custom', 'GA', 'enterprise'),

('standard-analytics', 'Analytics Padrão', 'analytics-padrao', 'Módulo básico de analytics', 'standard', 'GA', 'free'),
('standard-reports', 'Relatórios Padrão', 'relatorios-padrao', 'Sistema básico de relatórios', 'standard', 'GA', 'free'),
('standard-notifications', 'Notificações Padrão', 'notificacoes-padrao', 'Sistema básico de notificações', 'standard', 'GA', 'free'),
('standard-audit', 'Auditoria Padrão', 'auditoria-padrao', 'Sistema básico de auditoria', 'standard', 'GA', 'free')
ON CONFLICT (module_id) DO NOTHING;

-- Inserir versões iniciais
INSERT INTO core_module_versions (module_id, version, status, is_stable, is_latest, released_at) VALUES
('banban-insights', '2.1.0', 'released', true, true, NOW()),
('banban-performance', '1.8.0', 'released', true, true, NOW()),
('banban-alerts', '1.5.0', 'released', true, true, NOW()),
('banban-inventory', '2.0.0', 'released', true, true, NOW()),
('banban-data-processing', '1.3.0', 'released', true, true, NOW()),

('standard-analytics', '1.0.0', 'released', true, true, NOW()),
('standard-reports', '1.0.0', 'released', true, true, NOW()),
('standard-notifications', '1.0.0', 'released', true, true, NOW()),
('standard-audit', '1.0.0', 'released', true, true, NOW())
ON CONFLICT (module_id, version) DO NOTHING;

-- ================================================
-- 12. RELATÓRIO DE CRIAÇÃO
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'MIGRAÇÃO FASE 1 CONCLUÍDA COM SUCESSO';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tabelas criadas com % módulos base', (SELECT COUNT(*) FROM core_modules);
    RAISE NOTICE 'Próximo passo: Executar Fase 2 - Migração de dados';
    RAISE NOTICE '================================================';
END;
$$; 