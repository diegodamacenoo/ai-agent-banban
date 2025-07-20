-- ================================================
-- BANBAN PERFORMANCE MODULE - INITIAL SETUP
-- ================================================
-- Migration: 001_initial_setup.sql
-- Description: Criação das tabelas iniciais para o módulo de performance BanBan
-- Author: BanBan Development Team
-- Created: 2025-01-03
-- Version: 2.1.0

-- ================================================
-- TENANT PERFORMANCE METRICS
-- ================================================
-- Tabela principal para armazenar métricas de performance por tenant

CREATE TABLE IF NOT EXISTS tenant_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação da métrica
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'inventory_turnover',
        'fashion_metrics', 
        'seasonal_analysis',
        'brand_performance',
        'margin_analysis',
        'abc_analysis',
        'gmroi_calculation',
        'size_color_matrix',
        'collection_performance'
    )),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    
    -- Dimensões de análise
    dimension_type VARCHAR(50) CHECK (dimension_type IN ('sku', 'category', 'brand', 'store', 'company')),
    dimension_value VARCHAR(255),
    
    -- Valores da métrica
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    
    -- Metadados temporais
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Contexto adicional
    context_data JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_period CHECK (period_end > period_start),
    CONSTRAINT valid_metric_value CHECK (metric_value >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_tenant_id 
    ON tenant_performance_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_type_period 
    ON tenant_performance_metrics(tenant_id, metric_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_dimension 
    ON tenant_performance_metrics(tenant_id, dimension_type, dimension_value);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_created_at 
    ON tenant_performance_metrics(created_at DESC);

-- ================================================
-- TENANT PERFORMANCE CACHE
-- ================================================
-- Tabela para cache de cálculos de performance frequentes

CREATE TABLE IF NOT EXISTS tenant_performance_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação do cache
    cache_key VARCHAR(255) NOT NULL,
    cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN (
        'dashboard_metrics',
        'executive_summary',
        'trend_analysis',
        'comparison_data',
        'forecast_data'
    )),
    
    -- Dados em cache
    cached_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- TTL e invalidação
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle de versão
    version INTEGER DEFAULT 1,
    checksum VARCHAR(64),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at > created_at),
    CONSTRAINT unique_cache_key UNIQUE (tenant_id, cache_key)
);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_tenant_performance_cache_tenant_key 
    ON tenant_performance_cache(tenant_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_cache_expires_at 
    ON tenant_performance_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_cache_type 
    ON tenant_performance_cache(tenant_id, cache_type);

-- ================================================
-- TENANT PERFORMANCE CONFIG
-- ================================================
-- Tabela para configurações específicas de performance por tenant

CREATE TABLE IF NOT EXISTS tenant_performance_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Configurações gerais
    config_section VARCHAR(50) NOT NULL CHECK (config_section IN (
        'general',
        'performance_metrics',
        'thresholds',
        'caching',
        'performance',
        'notifications',
        'security',
        'integrations',
        'custom'
    )),
    
    -- Dados de configuração
    config_data JSONB NOT NULL DEFAULT '{}',
    
    -- Validação e schema
    schema_version VARCHAR(10) DEFAULT '1.0',
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB,
    
    -- Controle de mudanças
    is_active BOOLEAN DEFAULT true,
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unique_tenant_config_section UNIQUE (tenant_id, config_section)
);

-- Índices para configurações
CREATE INDEX IF NOT EXISTS idx_tenant_performance_config_tenant_id 
    ON tenant_performance_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_config_section 
    ON tenant_performance_config(tenant_id, config_section);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_config_active 
    ON tenant_performance_config(tenant_id, is_active);

-- ================================================
-- TENANT PERFORMANCE ALERTS
-- ================================================
-- Tabela para alertas de performance gerados

CREATE TABLE IF NOT EXISTS tenant_performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação do alerta
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'low_stock',
        'low_margin',
        'slow_moving',
        'high_performance',
        'critical_turnover',
        'seasonal_variation',
        'threshold_breach',
        'performance_degradation'
    )),
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'error', 'critical')),
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    
    -- Contexto do alerta
    metric_type VARCHAR(50),
    metric_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    dimension_type VARCHAR(50),
    dimension_value VARCHAR(255),
    
    -- Dados adicionais
    alert_data JSONB DEFAULT '{}',
    recommendations TEXT[],
    
    -- Status do alerta
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Notificações
    notification_sent BOOLEAN DEFAULT false,
    notification_channels TEXT[],
    notification_attempts INTEGER DEFAULT 0,
    last_notification_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_threshold_comparison CHECK (
        (metric_value IS NULL OR threshold_value IS NULL) OR 
        (metric_value != threshold_value)
    )
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_tenant_id 
    ON tenant_performance_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_type_level 
    ON tenant_performance_alerts(tenant_id, alert_type, alert_level);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_status 
    ON tenant_performance_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_created_at 
    ON tenant_performance_alerts(created_at DESC);

-- ================================================
-- RLS POLICIES
-- ================================================
-- Políticas de Row Level Security para todas as tabelas

-- Tenant Performance Metrics
ALTER TABLE tenant_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_metrics_tenant_isolation" ON tenant_performance_metrics
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Tenant Performance Cache
ALTER TABLE tenant_performance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_cache_tenant_isolation" ON tenant_performance_cache
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Tenant Performance Config
ALTER TABLE tenant_performance_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_config_tenant_isolation" ON tenant_performance_config
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Tenant Performance Alerts
ALTER TABLE tenant_performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_alerts_tenant_isolation" ON tenant_performance_alerts
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- ================================================
-- TRIGGERS
-- ================================================
-- Triggers para auditoria e manutenção automática

-- Trigger para updated_at em tenant_performance_metrics
CREATE OR REPLACE FUNCTION update_tenant_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_metrics_updated_at
    BEFORE UPDATE ON tenant_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_metrics_updated_at();

-- Trigger para updated_at em tenant_performance_cache
CREATE OR REPLACE FUNCTION update_tenant_performance_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_accessed_at = NOW();
    NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_cache_updated_at
    BEFORE UPDATE ON tenant_performance_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_cache_updated_at();

-- Trigger para updated_at em tenant_performance_config
CREATE OR REPLACE FUNCTION update_tenant_performance_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_config_updated_at
    BEFORE UPDATE ON tenant_performance_config
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_config_updated_at();

-- Trigger para updated_at em tenant_performance_alerts
CREATE OR REPLACE FUNCTION update_tenant_performance_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_alerts_updated_at
    BEFORE UPDATE ON tenant_performance_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_alerts_updated_at();

-- ================================================
-- FUNCTIONS
-- ================================================
-- Funções auxiliares para o módulo de performance

-- Função para limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_performance_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tenant_performance_cache 
    WHERE expires_at < NOW() OR invalidated_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas de performance
CREATE OR REPLACE FUNCTION calculate_performance_metrics(
    p_tenant_id UUID,
    p_metric_type VARCHAR(50),
    p_period_start TIMESTAMP WITH TIME ZONE,
    p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    metric_name VARCHAR(100),
    metric_value DECIMAL(15,4),
    dimension_type VARCHAR(50),
    dimension_value VARCHAR(255)
) AS $$
BEGIN
    -- Implementação base - será expandida conforme necessário
    RETURN QUERY
    SELECT 
        'base_metric'::VARCHAR(100) as metric_name,
        0.0::DECIMAL(15,4) as metric_value,
        'company'::VARCHAR(50) as dimension_type,
        'default'::VARCHAR(255) as dimension_value
    WHERE FALSE; -- Placeholder
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMMENTS
-- ================================================
-- Documentação das tabelas e colunas

COMMENT ON TABLE tenant_performance_metrics IS 'Métricas de performance calculadas por tenant';
COMMENT ON TABLE tenant_performance_cache IS 'Cache de cálculos de performance para otimização';
COMMENT ON TABLE tenant_performance_config IS 'Configurações específicas de performance por tenant';
COMMENT ON TABLE tenant_performance_alerts IS 'Alertas de performance gerados automaticamente';

-- ================================================
-- GRANTS
-- ================================================
-- Permissões para roles específicos

-- Permissões para authenticated users
GRANT SELECT, INSERT, UPDATE ON tenant_performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_performance_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tenant_performance_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tenant_performance_alerts TO authenticated;

-- Permissões para service role
GRANT ALL ON tenant_performance_metrics TO service_role;
GRANT ALL ON tenant_performance_cache TO service_role;
GRANT ALL ON tenant_performance_config TO service_role;
GRANT ALL ON tenant_performance_alerts TO service_role;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Log da migração
DO $$
BEGIN
    RAISE NOTICE 'BanBan Performance Module - Migration 001_initial_setup completed successfully';
    RAISE NOTICE 'Created tables: tenant_performance_metrics, tenant_performance_cache, tenant_performance_config, tenant_performance_alerts';
    RAISE NOTICE 'Created indexes, RLS policies, triggers, and functions';
    RAISE NOTICE 'Module version: 2.1.0';
END $$; 
-- BANBAN PERFORMANCE MODULE - INITIAL SETUP
-- ================================================
-- Migration: 001_initial_setup.sql
-- Description: Criação das tabelas iniciais para o módulo de performance BanBan
-- Author: BanBan Development Team
-- Created: 2025-01-03
-- Version: 2.1.0

-- ================================================
-- TENANT PERFORMANCE METRICS
-- ================================================
-- Tabela principal para armazenar métricas de performance por tenant

CREATE TABLE IF NOT EXISTS tenant_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação da métrica
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'inventory_turnover',
        'fashion_metrics', 
        'seasonal_analysis',
        'brand_performance',
        'margin_analysis',
        'abc_analysis',
        'gmroi_calculation',
        'size_color_matrix',
        'collection_performance'
    )),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    
    -- Dimensões de análise
    dimension_type VARCHAR(50) CHECK (dimension_type IN ('sku', 'category', 'brand', 'store', 'company')),
    dimension_value VARCHAR(255),
    
    -- Valores da métrica
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    
    -- Metadados temporais
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Contexto adicional
    context_data JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_period CHECK (period_end > period_start),
    CONSTRAINT valid_metric_value CHECK (metric_value >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_tenant_id 
    ON tenant_performance_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_type_period 
    ON tenant_performance_metrics(tenant_id, metric_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_dimension 
    ON tenant_performance_metrics(tenant_id, dimension_type, dimension_value);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_metrics_created_at 
    ON tenant_performance_metrics(created_at DESC);

-- ================================================
-- TENANT PERFORMANCE CACHE
-- ================================================
-- Tabela para cache de cálculos de performance frequentes

CREATE TABLE IF NOT EXISTS tenant_performance_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação do cache
    cache_key VARCHAR(255) NOT NULL,
    cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN (
        'dashboard_metrics',
        'executive_summary',
        'trend_analysis',
        'comparison_data',
        'forecast_data'
    )),
    
    -- Dados em cache
    cached_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- TTL e invalidação
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle de versão
    version INTEGER DEFAULT 1,
    checksum VARCHAR(64),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at > created_at),
    CONSTRAINT unique_cache_key UNIQUE (tenant_id, cache_key)
);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_tenant_performance_cache_tenant_key 
    ON tenant_performance_cache(tenant_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_cache_expires_at 
    ON tenant_performance_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_cache_type 
    ON tenant_performance_cache(tenant_id, cache_type);

-- ================================================
-- TENANT PERFORMANCE CONFIG
-- ================================================
-- Tabela para configurações específicas de performance por tenant

CREATE TABLE IF NOT EXISTS tenant_performance_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Configurações gerais
    config_section VARCHAR(50) NOT NULL CHECK (config_section IN (
        'general',
        'performance_metrics',
        'thresholds',
        'caching',
        'performance',
        'notifications',
        'security',
        'integrations',
        'custom'
    )),
    
    -- Dados de configuração
    config_data JSONB NOT NULL DEFAULT '{}',
    
    -- Validação e schema
    schema_version VARCHAR(10) DEFAULT '1.0',
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB,
    
    -- Controle de mudanças
    is_active BOOLEAN DEFAULT true,
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unique_tenant_config_section UNIQUE (tenant_id, config_section)
);

-- Índices para configurações
CREATE INDEX IF NOT EXISTS idx_tenant_performance_config_tenant_id 
    ON tenant_performance_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_config_section 
    ON tenant_performance_config(tenant_id, config_section);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_config_active 
    ON tenant_performance_config(tenant_id, is_active);

-- ================================================
-- TENANT PERFORMANCE ALERTS
-- ================================================
-- Tabela para alertas de performance gerados

CREATE TABLE IF NOT EXISTS tenant_performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identificação do alerta
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'low_stock',
        'low_margin',
        'slow_moving',
        'high_performance',
        'critical_turnover',
        'seasonal_variation',
        'threshold_breach',
        'performance_degradation'
    )),
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'error', 'critical')),
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    
    -- Contexto do alerta
    metric_type VARCHAR(50),
    metric_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    dimension_type VARCHAR(50),
    dimension_value VARCHAR(255),
    
    -- Dados adicionais
    alert_data JSONB DEFAULT '{}',
    recommendations TEXT[],
    
    -- Status do alerta
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Notificações
    notification_sent BOOLEAN DEFAULT false,
    notification_channels TEXT[],
    notification_attempts INTEGER DEFAULT 0,
    last_notification_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_threshold_comparison CHECK (
        (metric_value IS NULL OR threshold_value IS NULL) OR 
        (metric_value != threshold_value)
    )
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_tenant_id 
    ON tenant_performance_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_type_level 
    ON tenant_performance_alerts(tenant_id, alert_type, alert_level);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_status 
    ON tenant_performance_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_performance_alerts_created_at 
    ON tenant_performance_alerts(created_at DESC);

-- ================================================
-- RLS POLICIES
-- ================================================
-- Políticas de Row Level Security para todas as tabelas

-- Tenant Performance Metrics
ALTER TABLE tenant_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_metrics_tenant_isolation" ON tenant_performance_metrics
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Tenant Performance Cache
ALTER TABLE tenant_performance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_cache_tenant_isolation" ON tenant_performance_cache
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Tenant Performance Config
ALTER TABLE tenant_performance_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_config_tenant_isolation" ON tenant_performance_config
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Tenant Performance Alerts
ALTER TABLE tenant_performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_performance_alerts_tenant_isolation" ON tenant_performance_alerts
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- ================================================
-- TRIGGERS
-- ================================================
-- Triggers para auditoria e manutenção automática

-- Trigger para updated_at em tenant_performance_metrics
CREATE OR REPLACE FUNCTION update_tenant_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_metrics_updated_at
    BEFORE UPDATE ON tenant_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_metrics_updated_at();

-- Trigger para updated_at em tenant_performance_cache
CREATE OR REPLACE FUNCTION update_tenant_performance_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_accessed_at = NOW();
    NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_cache_updated_at
    BEFORE UPDATE ON tenant_performance_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_cache_updated_at();

-- Trigger para updated_at em tenant_performance_config
CREATE OR REPLACE FUNCTION update_tenant_performance_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_config_updated_at
    BEFORE UPDATE ON tenant_performance_config
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_config_updated_at();

-- Trigger para updated_at em tenant_performance_alerts
CREATE OR REPLACE FUNCTION update_tenant_performance_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_performance_alerts_updated_at
    BEFORE UPDATE ON tenant_performance_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_performance_alerts_updated_at();

-- ================================================
-- FUNCTIONS
-- ================================================
-- Funções auxiliares para o módulo de performance

-- Função para limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_performance_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tenant_performance_cache 
    WHERE expires_at < NOW() OR invalidated_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas de performance
CREATE OR REPLACE FUNCTION calculate_performance_metrics(
    p_tenant_id UUID,
    p_metric_type VARCHAR(50),
    p_period_start TIMESTAMP WITH TIME ZONE,
    p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    metric_name VARCHAR(100),
    metric_value DECIMAL(15,4),
    dimension_type VARCHAR(50),
    dimension_value VARCHAR(255)
) AS $$
BEGIN
    -- Implementação base - será expandida conforme necessário
    RETURN QUERY
    SELECT 
        'base_metric'::VARCHAR(100) as metric_name,
        0.0::DECIMAL(15,4) as metric_value,
        'company'::VARCHAR(50) as dimension_type,
        'default'::VARCHAR(255) as dimension_value
    WHERE FALSE; -- Placeholder
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMMENTS
-- ================================================
-- Documentação das tabelas e colunas

COMMENT ON TABLE tenant_performance_metrics IS 'Métricas de performance calculadas por tenant';
COMMENT ON TABLE tenant_performance_cache IS 'Cache de cálculos de performance para otimização';
COMMENT ON TABLE tenant_performance_config IS 'Configurações específicas de performance por tenant';
COMMENT ON TABLE tenant_performance_alerts IS 'Alertas de performance gerados automaticamente';

-- ================================================
-- GRANTS
-- ================================================
-- Permissões para roles específicos

-- Permissões para authenticated users
GRANT SELECT, INSERT, UPDATE ON tenant_performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_performance_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tenant_performance_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tenant_performance_alerts TO authenticated;

-- Permissões para service role
GRANT ALL ON tenant_performance_metrics TO service_role;
GRANT ALL ON tenant_performance_cache TO service_role;
GRANT ALL ON tenant_performance_config TO service_role;
GRANT ALL ON tenant_performance_alerts TO service_role;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Log da migração
DO $$
BEGIN
    RAISE NOTICE 'BanBan Performance Module - Migration 001_initial_setup completed successfully';
    RAISE NOTICE 'Created tables: tenant_performance_metrics, tenant_performance_cache, tenant_performance_config, tenant_performance_alerts';
    RAISE NOTICE 'Created indexes, RLS policies, triggers, and functions';
    RAISE NOTICE 'Module version: 2.1.0';
END $$; 