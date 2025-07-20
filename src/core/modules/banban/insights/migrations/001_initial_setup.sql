-- ================================================
-- MIGRATION 001: Initial Setup - BanBan Insights Module
-- Description: Cria as tabelas principais para o módulo de insights
-- Author: BanBan Development Team
-- Date: 2025-01-03
-- ================================================

DO $$
BEGIN
    -- ================================================
    -- 1. TABELA: tenant_insights_cache
    -- Purpose: Cache de insights gerados para performance
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_cache') THEN
        
        CREATE TABLE tenant_insights_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            cache_key VARCHAR(255) NOT NULL,
            insights_data JSONB NOT NULL,
            generation_context JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            hit_count INTEGER DEFAULT 0,
            version INTEGER DEFAULT 1
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_cache_tenant_created 
        ON tenant_insights_cache (tenant_id, created_at DESC);
        
        CREATE INDEX idx_tenant_insights_cache_key 
        ON tenant_insights_cache (tenant_id, cache_key);
        
        CREATE INDEX idx_tenant_insights_cache_expires 
        ON tenant_insights_cache (expires_at);
        
        -- RLS automático
        ALTER TABLE tenant_insights_cache ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_cache ON tenant_insights_cache
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_cache';
    END IF;

    -- ================================================
    -- 2. TABELA: tenant_insights_history
    -- Purpose: Histórico de insights para análise temporal
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_history') THEN
        
        CREATE TABLE tenant_insights_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            insight_id VARCHAR(255) NOT NULL,
            insight_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            financial_impact DECIMAL(15,2),
            affected_products INTEGER DEFAULT 0,
            affected_stores INTEGER DEFAULT 0,
            action_suggestions JSONB,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            resolved_at TIMESTAMPTZ,
            resolution_notes TEXT,
            version INTEGER DEFAULT 1
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_history_tenant_created 
        ON tenant_insights_history (tenant_id, created_at DESC);
        
        CREATE INDEX idx_tenant_insights_history_type 
        ON tenant_insights_history (tenant_id, insight_type);
        
        CREATE INDEX idx_tenant_insights_history_severity 
        ON tenant_insights_history (tenant_id, severity);
        
        CREATE INDEX idx_tenant_insights_history_financial 
        ON tenant_insights_history (tenant_id, financial_impact DESC);
        
        -- RLS automático
        ALTER TABLE tenant_insights_history ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_history ON tenant_insights_history
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_history';
    END IF;

    -- ================================================
    -- 3. TABELA: tenant_insights_config
    -- Purpose: Configurações específicas por tenant
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_config') THEN
        
        CREATE TABLE tenant_insights_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            config_data JSONB NOT NULL DEFAULT '{}',
            business_rules JSONB NOT NULL DEFAULT '{}',
            alert_thresholds JSONB NOT NULL DEFAULT '{}',
            notification_settings JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            version INTEGER DEFAULT 1,
            
            -- Constraint: um config por tenant
            CONSTRAINT unique_tenant_insights_config UNIQUE (tenant_id)
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_config_tenant 
        ON tenant_insights_config (tenant_id);
        
        -- RLS automático
        ALTER TABLE tenant_insights_config ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_config ON tenant_insights_config
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_config';
    END IF;

    -- ================================================
    -- 4. TABELA: tenant_insights_metrics
    -- Purpose: Métricas de performance e uso do módulo
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_metrics') THEN
        
        CREATE TABLE tenant_insights_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
            insights_generated INTEGER DEFAULT 0,
            cache_hits INTEGER DEFAULT 0,
            cache_misses INTEGER DEFAULT 0,
            avg_generation_time_ms INTEGER DEFAULT 0,
            api_calls INTEGER DEFAULT 0,
            errors_count INTEGER DEFAULT 0,
            financial_impact_calculated DECIMAL(15,2) DEFAULT 0,
            top_insight_types JSONB DEFAULT '[]',
            performance_data JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            version INTEGER DEFAULT 1,
            
            -- Constraint: uma métrica por tenant por dia
            CONSTRAINT unique_tenant_insights_metrics_date UNIQUE (tenant_id, metric_date)
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_metrics_tenant_date 
        ON tenant_insights_metrics (tenant_id, metric_date DESC);
        
        CREATE INDEX idx_tenant_insights_metrics_date 
        ON tenant_insights_metrics (metric_date DESC);
        
        -- RLS automático
        ALTER TABLE tenant_insights_metrics ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_metrics ON tenant_insights_metrics
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_metrics';
    END IF;

    -- ================================================
    -- 5. TRIGGERS PARA UPDATED_AT
    -- ================================================
    
    -- Função para atualizar updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Triggers para tabelas com updated_at
    DROP TRIGGER IF EXISTS update_tenant_insights_config_updated_at ON tenant_insights_config;
    CREATE TRIGGER update_tenant_insights_config_updated_at
        BEFORE UPDATE ON tenant_insights_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
    DROP TRIGGER IF EXISTS update_tenant_insights_metrics_updated_at ON tenant_insights_metrics;
    CREATE TRIGGER update_tenant_insights_metrics_updated_at
        BEFORE UPDATE ON tenant_insights_metrics
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- ================================================
    -- 6. DADOS INICIAIS (se necessário)
    -- ================================================
    
    -- Inserir configuração padrão para organizações existentes
    INSERT INTO tenant_insights_config (tenant_id, config_data, business_rules, alert_thresholds)
    SELECT 
        id,
        '{
            "general": {
                "enabled": true,
                "update_interval": 300,
                "max_insights_per_generation": 50
            },
            "caching": {
                "enabled": true,
                "ttl": 1800,
                "max_entries": 1000
            },
            "performance": {
                "max_concurrent_analysis": 5,
                "timeout_ms": 30000,
                "retry_attempts": 3
            }
        }'::jsonb,
        '{
            "critical_stock_level": 10,
            "low_margin_threshold": 0.31,
            "slow_moving_days_threshold": 30,
            "priority_weights": {
                "financial": 0.4,
                "urgency": 0.3,
                "impact": 0.3
            }
        }'::jsonb,
        '{
            "CRITICAL": 0.8,
            "ATTENTION": 0.6,
            "MODERATE": 0.4,
            "OPPORTUNITY": 0.2
        }'::jsonb
    FROM organizations 
    WHERE id NOT IN (SELECT tenant_id FROM tenant_insights_config)
    ON CONFLICT (tenant_id) DO NOTHING;

    RAISE NOTICE 'BanBan Insights Module - Initial setup completed successfully';
    
END $$; 
-- MIGRATION 001: Initial Setup - BanBan Insights Module
-- Description: Cria as tabelas principais para o módulo de insights
-- Author: BanBan Development Team
-- Date: 2025-01-03
-- ================================================

DO $$
BEGIN
    -- ================================================
    -- 1. TABELA: tenant_insights_cache
    -- Purpose: Cache de insights gerados para performance
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_cache') THEN
        
        CREATE TABLE tenant_insights_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            cache_key VARCHAR(255) NOT NULL,
            insights_data JSONB NOT NULL,
            generation_context JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            hit_count INTEGER DEFAULT 0,
            version INTEGER DEFAULT 1
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_cache_tenant_created 
        ON tenant_insights_cache (tenant_id, created_at DESC);
        
        CREATE INDEX idx_tenant_insights_cache_key 
        ON tenant_insights_cache (tenant_id, cache_key);
        
        CREATE INDEX idx_tenant_insights_cache_expires 
        ON tenant_insights_cache (expires_at);
        
        -- RLS automático
        ALTER TABLE tenant_insights_cache ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_cache ON tenant_insights_cache
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_cache';
    END IF;

    -- ================================================
    -- 2. TABELA: tenant_insights_history
    -- Purpose: Histórico de insights para análise temporal
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_history') THEN
        
        CREATE TABLE tenant_insights_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            insight_id VARCHAR(255) NOT NULL,
            insight_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            financial_impact DECIMAL(15,2),
            affected_products INTEGER DEFAULT 0,
            affected_stores INTEGER DEFAULT 0,
            action_suggestions JSONB,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            resolved_at TIMESTAMPTZ,
            resolution_notes TEXT,
            version INTEGER DEFAULT 1
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_history_tenant_created 
        ON tenant_insights_history (tenant_id, created_at DESC);
        
        CREATE INDEX idx_tenant_insights_history_type 
        ON tenant_insights_history (tenant_id, insight_type);
        
        CREATE INDEX idx_tenant_insights_history_severity 
        ON tenant_insights_history (tenant_id, severity);
        
        CREATE INDEX idx_tenant_insights_history_financial 
        ON tenant_insights_history (tenant_id, financial_impact DESC);
        
        -- RLS automático
        ALTER TABLE tenant_insights_history ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_history ON tenant_insights_history
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_history';
    END IF;

    -- ================================================
    -- 3. TABELA: tenant_insights_config
    -- Purpose: Configurações específicas por tenant
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_config') THEN
        
        CREATE TABLE tenant_insights_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            config_data JSONB NOT NULL DEFAULT '{}',
            business_rules JSONB NOT NULL DEFAULT '{}',
            alert_thresholds JSONB NOT NULL DEFAULT '{}',
            notification_settings JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            version INTEGER DEFAULT 1,
            
            -- Constraint: um config por tenant
            CONSTRAINT unique_tenant_insights_config UNIQUE (tenant_id)
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_config_tenant 
        ON tenant_insights_config (tenant_id);
        
        -- RLS automático
        ALTER TABLE tenant_insights_config ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_config ON tenant_insights_config
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_config';
    END IF;

    -- ================================================
    -- 4. TABELA: tenant_insights_metrics
    -- Purpose: Métricas de performance e uso do módulo
    -- ================================================
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tenant_insights_metrics') THEN
        
        CREATE TABLE tenant_insights_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
            insights_generated INTEGER DEFAULT 0,
            cache_hits INTEGER DEFAULT 0,
            cache_misses INTEGER DEFAULT 0,
            avg_generation_time_ms INTEGER DEFAULT 0,
            api_calls INTEGER DEFAULT 0,
            errors_count INTEGER DEFAULT 0,
            financial_impact_calculated DECIMAL(15,2) DEFAULT 0,
            top_insight_types JSONB DEFAULT '[]',
            performance_data JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            version INTEGER DEFAULT 1,
            
            -- Constraint: uma métrica por tenant por dia
            CONSTRAINT unique_tenant_insights_metrics_date UNIQUE (tenant_id, metric_date)
        );
        
        -- Índices obrigatórios
        CREATE INDEX idx_tenant_insights_metrics_tenant_date 
        ON tenant_insights_metrics (tenant_id, metric_date DESC);
        
        CREATE INDEX idx_tenant_insights_metrics_date 
        ON tenant_insights_metrics (metric_date DESC);
        
        -- RLS automático
        ALTER TABLE tenant_insights_metrics ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY tenant_isolation_insights_metrics ON tenant_insights_metrics
        USING (tenant_id = (SELECT id FROM organizations 
                           WHERE id = auth.jwt() ->> 'organization_id'::text));
                           
        RAISE NOTICE 'Created table: tenant_insights_metrics';
    END IF;

    -- ================================================
    -- 5. TRIGGERS PARA UPDATED_AT
    -- ================================================
    
    -- Função para atualizar updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Triggers para tabelas com updated_at
    DROP TRIGGER IF EXISTS update_tenant_insights_config_updated_at ON tenant_insights_config;
    CREATE TRIGGER update_tenant_insights_config_updated_at
        BEFORE UPDATE ON tenant_insights_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
    DROP TRIGGER IF EXISTS update_tenant_insights_metrics_updated_at ON tenant_insights_metrics;
    CREATE TRIGGER update_tenant_insights_metrics_updated_at
        BEFORE UPDATE ON tenant_insights_metrics
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- ================================================
    -- 6. DADOS INICIAIS (se necessário)
    -- ================================================
    
    -- Inserir configuração padrão para organizações existentes
    INSERT INTO tenant_insights_config (tenant_id, config_data, business_rules, alert_thresholds)
    SELECT 
        id,
        '{
            "general": {
                "enabled": true,
                "update_interval": 300,
                "max_insights_per_generation": 50
            },
            "caching": {
                "enabled": true,
                "ttl": 1800,
                "max_entries": 1000
            },
            "performance": {
                "max_concurrent_analysis": 5,
                "timeout_ms": 30000,
                "retry_attempts": 3
            }
        }'::jsonb,
        '{
            "critical_stock_level": 10,
            "low_margin_threshold": 0.31,
            "slow_moving_days_threshold": 30,
            "priority_weights": {
                "financial": 0.4,
                "urgency": 0.3,
                "impact": 0.3
            }
        }'::jsonb,
        '{
            "CRITICAL": 0.8,
            "ATTENTION": 0.6,
            "MODERATE": 0.4,
            "OPPORTUNITY": 0.2
        }'::jsonb
    FROM organizations 
    WHERE id NOT IN (SELECT tenant_id FROM tenant_insights_config)
    ON CONFLICT (tenant_id) DO NOTHING;

    RAISE NOTICE 'BanBan Insights Module - Initial setup completed successfully';
    
END $$; 