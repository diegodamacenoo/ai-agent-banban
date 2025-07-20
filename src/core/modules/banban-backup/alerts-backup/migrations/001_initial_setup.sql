-- =====================================================
-- BanBan Alerts Module - Initial Setup Migration
-- Version: 2.0.0
-- Created: 2024-12-19
-- Description: Criação das tabelas base para o sistema de alertas
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================

-- Prioridades de alertas
CREATE TYPE alert_priority_enum AS ENUM (
    'CRITICAL',
    'ATTENTION', 
    'MODERATE',
    'OPPORTUNITY'
);

-- Status de alertas
CREATE TYPE alert_status_enum AS ENUM (
    'ACTIVE',
    'ACKNOWLEDGED',
    'RESOLVED',
    'EXPIRED',
    'SUPPRESSED'
);

-- Tipos de alertas
CREATE TYPE alert_type_enum AS ENUM (
    'STOCK_CRITICAL',
    'STOCK_LOW',
    'MARGIN_LOW',
    'SLOW_MOVING',
    'OVERSTOCK',
    'SEASONAL_OPPORTUNITY',
    'SALES_DROP',
    'HIGH_RETURN_RATE',
    'UNBALANCED_MATRIX',
    'CUSTOM'
);

-- Canais de entrega
CREATE TYPE delivery_channel_enum AS ENUM (
    'EMAIL',
    'SMS',
    'PUSH_NOTIFICATION',
    'DASHBOARD',
    'WEBHOOK'
);

-- Status de entrega
CREATE TYPE delivery_status_enum AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'BOUNCED'
);

-- =====================================================
-- TABELA PRINCIPAL: tenant_alerts
-- =====================================================

CREATE TABLE tenant_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    alert_type alert_type_enum NOT NULL,
    priority alert_priority_enum NOT NULL,
    status alert_status_enum NOT NULL DEFAULT 'ACTIVE',
    
    -- Identificação do objeto que gerou o alerta
    source_module VARCHAR(100) NOT NULL,
    source_entity VARCHAR(100), -- produto, categoria, etc
    source_entity_id UUID,
    
    -- Conteúdo do alerta
    title VARCHAR(255) NOT NULL,
    description TEXT,
    message TEXT NOT NULL,
    
    -- Dados contextuais
    context_data JSONB DEFAULT '{}',
    threshold_config JSONB DEFAULT '{}',
    current_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    acknowledged_by UUID,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Agregação e deduplicação
    aggregation_key VARCHAR(255),
    parent_alert_id UUID REFERENCES tenant_alerts(id),
    aggregated_count INTEGER DEFAULT 1,
    
    -- Metadados
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}'
);

-- =====================================================
-- TABELA: tenant_alert_rules
-- =====================================================

CREATE TABLE tenant_alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Identificação da regra
    name VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type alert_type_enum NOT NULL,
    priority alert_priority_enum NOT NULL,
    
    -- Configuração da regra
    enabled BOOLEAN NOT NULL DEFAULT true,
    conditions JSONB NOT NULL DEFAULT '{}',
    thresholds JSONB NOT NULL DEFAULT '{}',
    
    -- Escopo da regra
    applies_to JSONB DEFAULT '{}', -- produtos, categorias, etc
    
    -- Configuração de entrega
    delivery_config JSONB DEFAULT '{}',
    escalation_config JSONB DEFAULT '{}',
    
    -- Auditoria
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadados
    version INTEGER NOT NULL DEFAULT 1,
    tags JSONB DEFAULT '[]'
);

-- =====================================================
-- TABELA: tenant_alert_thresholds
-- =====================================================

CREATE TABLE tenant_alert_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Configuração de thresholds
    category VARCHAR(100) NOT NULL, -- stock, margin, performance
    subcategory VARCHAR(100), -- critical, low, etc
    
    -- Valores
    threshold_value DECIMAL(15,4) NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL DEFAULT '<', -- <, >, <=, >=, =, !=
    unit VARCHAR(50), -- percentage, quantity, days, etc
    
    -- Escopo
    applies_to JSONB DEFAULT '{}',
    
    -- Configuração sazonal
    seasonal_adjustment BOOLEAN DEFAULT false,
    seasonal_multiplier DECIMAL(5,2) DEFAULT 1.0,
    
    -- Auditoria
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadados
    enabled BOOLEAN NOT NULL DEFAULT true,
    notes TEXT
);

-- =====================================================
-- TABELA: tenant_alert_deliveries
-- =====================================================

CREATE TABLE tenant_alert_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    alert_id UUID NOT NULL REFERENCES tenant_alerts(id) ON DELETE CASCADE,
    
    -- Configuração da entrega
    channel delivery_channel_enum NOT NULL,
    recipient VARCHAR(255) NOT NULL, -- email, phone, user_id
    status delivery_status_enum NOT NULL DEFAULT 'PENDING',
    
    -- Conteúdo enviado
    subject VARCHAR(500),
    content TEXT,
    template_used VARCHAR(100),
    
    -- Timestamps
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados da entrega
    delivery_metadata JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABELA: tenant_alert_escalations
-- =====================================================

CREATE TABLE tenant_alert_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    alert_id UUID NOT NULL REFERENCES tenant_alerts(id) ON DELETE CASCADE,
    
    -- Configuração da escalação
    escalation_level INTEGER NOT NULL DEFAULT 1,
    escalated_to VARCHAR(255) NOT NULL, -- email ou user_id
    escalation_reason TEXT,
    
    -- Timestamps
    escalated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuração
    auto_escalation BOOLEAN DEFAULT true,
    escalation_config JSONB DEFAULT '{}',
    
    -- Auditoria
    escalated_by UUID, -- NULL para escalações automáticas
    acknowledged_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices principais para tenant_alerts
CREATE INDEX idx_tenant_alerts_tenant_id ON tenant_alerts(tenant_id);
CREATE INDEX idx_tenant_alerts_status ON tenant_alerts(status);
CREATE INDEX idx_tenant_alerts_priority ON tenant_alerts(priority);
CREATE INDEX idx_tenant_alerts_type ON tenant_alerts(alert_type);
CREATE INDEX idx_tenant_alerts_triggered_at ON tenant_alerts(triggered_at);
CREATE INDEX idx_tenant_alerts_aggregation_key ON tenant_alerts(aggregation_key);
CREATE INDEX idx_tenant_alerts_source ON tenant_alerts(source_module, source_entity);

-- Índices compostos para queries comuns
CREATE INDEX idx_tenant_alerts_active ON tenant_alerts(tenant_id, status) WHERE status = 'ACTIVE';
CREATE INDEX idx_tenant_alerts_priority_status ON tenant_alerts(tenant_id, priority, status);
CREATE INDEX idx_tenant_alerts_type_priority ON tenant_alerts(tenant_id, alert_type, priority);

-- Índices para tenant_alert_rules
CREATE INDEX idx_tenant_alert_rules_tenant_id ON tenant_alert_rules(tenant_id);
CREATE INDEX idx_tenant_alert_rules_enabled ON tenant_alert_rules(enabled);
CREATE INDEX idx_tenant_alert_rules_type ON tenant_alert_rules(alert_type);

-- Índices para tenant_alert_thresholds
CREATE INDEX idx_tenant_alert_thresholds_tenant_id ON tenant_alert_thresholds(tenant_id);
CREATE INDEX idx_tenant_alert_thresholds_category ON tenant_alert_thresholds(category, subcategory);
CREATE INDEX idx_tenant_alert_thresholds_enabled ON tenant_alert_thresholds(enabled);

-- Índices para tenant_alert_deliveries
CREATE INDEX idx_tenant_alert_deliveries_alert_id ON tenant_alert_deliveries(alert_id);
CREATE INDEX idx_tenant_alert_deliveries_status ON tenant_alert_deliveries(status);
CREATE INDEX idx_tenant_alert_deliveries_channel ON tenant_alert_deliveries(channel);
CREATE INDEX idx_tenant_alert_deliveries_scheduled ON tenant_alert_deliveries(scheduled_at);

-- Índices para tenant_alert_escalations
CREATE INDEX idx_tenant_alert_escalations_alert_id ON tenant_alert_escalations(alert_id);
CREATE INDEX idx_tenant_alert_escalations_level ON tenant_alert_escalations(escalation_level);
CREATE INDEX idx_tenant_alert_escalations_escalated_at ON tenant_alert_escalations(escalated_at);

-- Índices de busca textual
CREATE INDEX idx_tenant_alerts_title_search ON tenant_alerts USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_tenant_alerts_message_search ON tenant_alerts USING gin(to_tsvector('portuguese', message));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at em tenant_alerts
CREATE OR REPLACE FUNCTION update_tenant_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_alerts_updated_at
    BEFORE UPDATE ON tenant_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_rules
CREATE TRIGGER trigger_tenant_alert_rules_updated_at
    BEFORE UPDATE ON tenant_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_thresholds
CREATE TRIGGER trigger_tenant_alert_thresholds_updated_at
    BEFORE UPDATE ON tenant_alert_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_deliveries
CREATE TRIGGER trigger_tenant_alert_deliveries_updated_at
    BEFORE UPDATE ON tenant_alert_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_escalations
CREATE TRIGGER trigger_tenant_alert_escalations_updated_at
    BEFORE UPDATE ON tenant_alert_escalations
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenant_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_escalations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenant_alerts
CREATE POLICY tenant_alerts_tenant_isolation ON tenant_alerts
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_rules
CREATE POLICY tenant_alert_rules_tenant_isolation ON tenant_alert_rules
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_thresholds
CREATE POLICY tenant_alert_thresholds_tenant_isolation ON tenant_alert_thresholds
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_deliveries
CREATE POLICY tenant_alert_deliveries_tenant_isolation ON tenant_alert_deliveries
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_escalations
CREATE POLICY tenant_alert_escalations_tenant_isolation ON tenant_alert_escalations
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- DADOS PADRÃO
-- =====================================================

-- Inserir configurações padrão de thresholds para novos tenants
-- Essa função será chamada quando um novo tenant for criado
CREATE OR REPLACE FUNCTION create_default_alert_thresholds(p_tenant_id UUID, p_created_by UUID)
RETURNS VOID AS $$
BEGIN
    -- Thresholds de estoque
    INSERT INTO tenant_alert_thresholds (tenant_id, category, subcategory, threshold_value, comparison_operator, unit, created_by) VALUES
    (p_tenant_id, 'stock', 'critical', 5, '<=', 'quantity', p_created_by),
    (p_tenant_id, 'stock', 'low', 10, '<=', 'quantity', p_created_by),
    (p_tenant_id, 'stock', 'overstock', 500, '>=', 'quantity', p_created_by),
    
    -- Thresholds de margem
    (p_tenant_id, 'margin', 'low', 0.31, '<=', 'percentage', p_created_by),
    (p_tenant_id, 'margin', 'negative', 0, '<=', 'percentage', p_created_by),
    
    -- Thresholds de performance
    (p_tenant_id, 'performance', 'slow_moving', 30, '>=', 'days', p_created_by),
    (p_tenant_id, 'performance', 'sales_drop', 0.3, '>=', 'percentage', p_created_by),
    (p_tenant_id, 'performance', 'return_rate', 0.15, '>=', 'percentage', p_created_by);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE tenant_alerts IS 'Tabela principal para armazenar todos os alertas gerados no sistema';
COMMENT ON TABLE tenant_alert_rules IS 'Regras configuráveis para geração automática de alertas';
COMMENT ON TABLE tenant_alert_thresholds IS 'Thresholds configuráveis por tenant para diferentes tipos de alertas';
COMMENT ON TABLE tenant_alert_deliveries IS 'Log de entregas de alertas através de diferentes canais';
COMMENT ON TABLE tenant_alert_escalations IS 'Histórico de escalações de alertas não tratados';

COMMENT ON COLUMN tenant_alerts.aggregation_key IS 'Chave para agrupar alertas similares e evitar spam';
COMMENT ON COLUMN tenant_alerts.context_data IS 'Dados contextuais específicos do alerta em formato JSON';
COMMENT ON COLUMN tenant_alerts.threshold_config IS 'Configuração do threshold que gerou o alerta';
COMMENT ON COLUMN tenant_alert_rules.conditions IS 'Condições em formato JSON para disparo da regra';
COMMENT ON COLUMN tenant_alert_rules.applies_to IS 'Escopo de aplicação da regra (produtos, categorias, etc)';

-- =====================================================
-- FINAL
-- =====================================================

-- Verificar se a migração foi aplicada com sucesso
DO $$
BEGIN
    RAISE NOTICE 'BanBan Alerts Module - Initial Setup Migration completed successfully';
    RAISE NOTICE 'Tables created: tenant_alerts, tenant_alert_rules, tenant_alert_thresholds, tenant_alert_deliveries, tenant_alert_escalations';
    RAISE NOTICE 'Enums created: alert_priority_enum, alert_status_enum, alert_type_enum, delivery_channel_enum, delivery_status_enum';
    RAISE NOTICE 'Indexes, triggers, and RLS policies applied';
END $$; 
-- BanBan Alerts Module - Initial Setup Migration
-- Version: 2.0.0
-- Created: 2024-12-19
-- Description: Criação das tabelas base para o sistema de alertas
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================

-- Prioridades de alertas
CREATE TYPE alert_priority_enum AS ENUM (
    'CRITICAL',
    'ATTENTION', 
    'MODERATE',
    'OPPORTUNITY'
);

-- Status de alertas
CREATE TYPE alert_status_enum AS ENUM (
    'ACTIVE',
    'ACKNOWLEDGED',
    'RESOLVED',
    'EXPIRED',
    'SUPPRESSED'
);

-- Tipos de alertas
CREATE TYPE alert_type_enum AS ENUM (
    'STOCK_CRITICAL',
    'STOCK_LOW',
    'MARGIN_LOW',
    'SLOW_MOVING',
    'OVERSTOCK',
    'SEASONAL_OPPORTUNITY',
    'SALES_DROP',
    'HIGH_RETURN_RATE',
    'UNBALANCED_MATRIX',
    'CUSTOM'
);

-- Canais de entrega
CREATE TYPE delivery_channel_enum AS ENUM (
    'EMAIL',
    'SMS',
    'PUSH_NOTIFICATION',
    'DASHBOARD',
    'WEBHOOK'
);

-- Status de entrega
CREATE TYPE delivery_status_enum AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'BOUNCED'
);

-- =====================================================
-- TABELA PRINCIPAL: tenant_alerts
-- =====================================================

CREATE TABLE tenant_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    alert_type alert_type_enum NOT NULL,
    priority alert_priority_enum NOT NULL,
    status alert_status_enum NOT NULL DEFAULT 'ACTIVE',
    
    -- Identificação do objeto que gerou o alerta
    source_module VARCHAR(100) NOT NULL,
    source_entity VARCHAR(100), -- produto, categoria, etc
    source_entity_id UUID,
    
    -- Conteúdo do alerta
    title VARCHAR(255) NOT NULL,
    description TEXT,
    message TEXT NOT NULL,
    
    -- Dados contextuais
    context_data JSONB DEFAULT '{}',
    threshold_config JSONB DEFAULT '{}',
    current_value DECIMAL(15,4),
    threshold_value DECIMAL(15,4),
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    acknowledged_by UUID,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Agregação e deduplicação
    aggregation_key VARCHAR(255),
    parent_alert_id UUID REFERENCES tenant_alerts(id),
    aggregated_count INTEGER DEFAULT 1,
    
    -- Metadados
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}'
);

-- =====================================================
-- TABELA: tenant_alert_rules
-- =====================================================

CREATE TABLE tenant_alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Identificação da regra
    name VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type alert_type_enum NOT NULL,
    priority alert_priority_enum NOT NULL,
    
    -- Configuração da regra
    enabled BOOLEAN NOT NULL DEFAULT true,
    conditions JSONB NOT NULL DEFAULT '{}',
    thresholds JSONB NOT NULL DEFAULT '{}',
    
    -- Escopo da regra
    applies_to JSONB DEFAULT '{}', -- produtos, categorias, etc
    
    -- Configuração de entrega
    delivery_config JSONB DEFAULT '{}',
    escalation_config JSONB DEFAULT '{}',
    
    -- Auditoria
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadados
    version INTEGER NOT NULL DEFAULT 1,
    tags JSONB DEFAULT '[]'
);

-- =====================================================
-- TABELA: tenant_alert_thresholds
-- =====================================================

CREATE TABLE tenant_alert_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Configuração de thresholds
    category VARCHAR(100) NOT NULL, -- stock, margin, performance
    subcategory VARCHAR(100), -- critical, low, etc
    
    -- Valores
    threshold_value DECIMAL(15,4) NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL DEFAULT '<', -- <, >, <=, >=, =, !=
    unit VARCHAR(50), -- percentage, quantity, days, etc
    
    -- Escopo
    applies_to JSONB DEFAULT '{}',
    
    -- Configuração sazonal
    seasonal_adjustment BOOLEAN DEFAULT false,
    seasonal_multiplier DECIMAL(5,2) DEFAULT 1.0,
    
    -- Auditoria
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadados
    enabled BOOLEAN NOT NULL DEFAULT true,
    notes TEXT
);

-- =====================================================
-- TABELA: tenant_alert_deliveries
-- =====================================================

CREATE TABLE tenant_alert_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    alert_id UUID NOT NULL REFERENCES tenant_alerts(id) ON DELETE CASCADE,
    
    -- Configuração da entrega
    channel delivery_channel_enum NOT NULL,
    recipient VARCHAR(255) NOT NULL, -- email, phone, user_id
    status delivery_status_enum NOT NULL DEFAULT 'PENDING',
    
    -- Conteúdo enviado
    subject VARCHAR(500),
    content TEXT,
    template_used VARCHAR(100),
    
    -- Timestamps
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados da entrega
    delivery_metadata JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABELA: tenant_alert_escalations
-- =====================================================

CREATE TABLE tenant_alert_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    alert_id UUID NOT NULL REFERENCES tenant_alerts(id) ON DELETE CASCADE,
    
    -- Configuração da escalação
    escalation_level INTEGER NOT NULL DEFAULT 1,
    escalated_to VARCHAR(255) NOT NULL, -- email ou user_id
    escalation_reason TEXT,
    
    -- Timestamps
    escalated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuração
    auto_escalation BOOLEAN DEFAULT true,
    escalation_config JSONB DEFAULT '{}',
    
    -- Auditoria
    escalated_by UUID, -- NULL para escalações automáticas
    acknowledged_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices principais para tenant_alerts
CREATE INDEX idx_tenant_alerts_tenant_id ON tenant_alerts(tenant_id);
CREATE INDEX idx_tenant_alerts_status ON tenant_alerts(status);
CREATE INDEX idx_tenant_alerts_priority ON tenant_alerts(priority);
CREATE INDEX idx_tenant_alerts_type ON tenant_alerts(alert_type);
CREATE INDEX idx_tenant_alerts_triggered_at ON tenant_alerts(triggered_at);
CREATE INDEX idx_tenant_alerts_aggregation_key ON tenant_alerts(aggregation_key);
CREATE INDEX idx_tenant_alerts_source ON tenant_alerts(source_module, source_entity);

-- Índices compostos para queries comuns
CREATE INDEX idx_tenant_alerts_active ON tenant_alerts(tenant_id, status) WHERE status = 'ACTIVE';
CREATE INDEX idx_tenant_alerts_priority_status ON tenant_alerts(tenant_id, priority, status);
CREATE INDEX idx_tenant_alerts_type_priority ON tenant_alerts(tenant_id, alert_type, priority);

-- Índices para tenant_alert_rules
CREATE INDEX idx_tenant_alert_rules_tenant_id ON tenant_alert_rules(tenant_id);
CREATE INDEX idx_tenant_alert_rules_enabled ON tenant_alert_rules(enabled);
CREATE INDEX idx_tenant_alert_rules_type ON tenant_alert_rules(alert_type);

-- Índices para tenant_alert_thresholds
CREATE INDEX idx_tenant_alert_thresholds_tenant_id ON tenant_alert_thresholds(tenant_id);
CREATE INDEX idx_tenant_alert_thresholds_category ON tenant_alert_thresholds(category, subcategory);
CREATE INDEX idx_tenant_alert_thresholds_enabled ON tenant_alert_thresholds(enabled);

-- Índices para tenant_alert_deliveries
CREATE INDEX idx_tenant_alert_deliveries_alert_id ON tenant_alert_deliveries(alert_id);
CREATE INDEX idx_tenant_alert_deliveries_status ON tenant_alert_deliveries(status);
CREATE INDEX idx_tenant_alert_deliveries_channel ON tenant_alert_deliveries(channel);
CREATE INDEX idx_tenant_alert_deliveries_scheduled ON tenant_alert_deliveries(scheduled_at);

-- Índices para tenant_alert_escalations
CREATE INDEX idx_tenant_alert_escalations_alert_id ON tenant_alert_escalations(alert_id);
CREATE INDEX idx_tenant_alert_escalations_level ON tenant_alert_escalations(escalation_level);
CREATE INDEX idx_tenant_alert_escalations_escalated_at ON tenant_alert_escalations(escalated_at);

-- Índices de busca textual
CREATE INDEX idx_tenant_alerts_title_search ON tenant_alerts USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_tenant_alerts_message_search ON tenant_alerts USING gin(to_tsvector('portuguese', message));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at em tenant_alerts
CREATE OR REPLACE FUNCTION update_tenant_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_alerts_updated_at
    BEFORE UPDATE ON tenant_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_rules
CREATE TRIGGER trigger_tenant_alert_rules_updated_at
    BEFORE UPDATE ON tenant_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_thresholds
CREATE TRIGGER trigger_tenant_alert_thresholds_updated_at
    BEFORE UPDATE ON tenant_alert_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_deliveries
CREATE TRIGGER trigger_tenant_alert_deliveries_updated_at
    BEFORE UPDATE ON tenant_alert_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- Trigger para updated_at em tenant_alert_escalations
CREATE TRIGGER trigger_tenant_alert_escalations_updated_at
    BEFORE UPDATE ON tenant_alert_escalations
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_alerts_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenant_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_escalations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenant_alerts
CREATE POLICY tenant_alerts_tenant_isolation ON tenant_alerts
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_rules
CREATE POLICY tenant_alert_rules_tenant_isolation ON tenant_alert_rules
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_thresholds
CREATE POLICY tenant_alert_thresholds_tenant_isolation ON tenant_alert_thresholds
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_deliveries
CREATE POLICY tenant_alert_deliveries_tenant_isolation ON tenant_alert_deliveries
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas RLS para tenant_alert_escalations
CREATE POLICY tenant_alert_escalations_tenant_isolation ON tenant_alert_escalations
    FOR ALL USING (
        tenant_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- DADOS PADRÃO
-- =====================================================

-- Inserir configurações padrão de thresholds para novos tenants
-- Essa função será chamada quando um novo tenant for criado
CREATE OR REPLACE FUNCTION create_default_alert_thresholds(p_tenant_id UUID, p_created_by UUID)
RETURNS VOID AS $$
BEGIN
    -- Thresholds de estoque
    INSERT INTO tenant_alert_thresholds (tenant_id, category, subcategory, threshold_value, comparison_operator, unit, created_by) VALUES
    (p_tenant_id, 'stock', 'critical', 5, '<=', 'quantity', p_created_by),
    (p_tenant_id, 'stock', 'low', 10, '<=', 'quantity', p_created_by),
    (p_tenant_id, 'stock', 'overstock', 500, '>=', 'quantity', p_created_by),
    
    -- Thresholds de margem
    (p_tenant_id, 'margin', 'low', 0.31, '<=', 'percentage', p_created_by),
    (p_tenant_id, 'margin', 'negative', 0, '<=', 'percentage', p_created_by),
    
    -- Thresholds de performance
    (p_tenant_id, 'performance', 'slow_moving', 30, '>=', 'days', p_created_by),
    (p_tenant_id, 'performance', 'sales_drop', 0.3, '>=', 'percentage', p_created_by),
    (p_tenant_id, 'performance', 'return_rate', 0.15, '>=', 'percentage', p_created_by);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE tenant_alerts IS 'Tabela principal para armazenar todos os alertas gerados no sistema';
COMMENT ON TABLE tenant_alert_rules IS 'Regras configuráveis para geração automática de alertas';
COMMENT ON TABLE tenant_alert_thresholds IS 'Thresholds configuráveis por tenant para diferentes tipos de alertas';
COMMENT ON TABLE tenant_alert_deliveries IS 'Log de entregas de alertas através de diferentes canais';
COMMENT ON TABLE tenant_alert_escalations IS 'Histórico de escalações de alertas não tratados';

COMMENT ON COLUMN tenant_alerts.aggregation_key IS 'Chave para agrupar alertas similares e evitar spam';
COMMENT ON COLUMN tenant_alerts.context_data IS 'Dados contextuais específicos do alerta em formato JSON';
COMMENT ON COLUMN tenant_alerts.threshold_config IS 'Configuração do threshold que gerou o alerta';
COMMENT ON COLUMN tenant_alert_rules.conditions IS 'Condições em formato JSON para disparo da regra';
COMMENT ON COLUMN tenant_alert_rules.applies_to IS 'Escopo de aplicação da regra (produtos, categorias, etc)';

-- =====================================================
-- FINAL
-- =====================================================

-- Verificar se a migração foi aplicada com sucesso
DO $$
BEGIN
    RAISE NOTICE 'BanBan Alerts Module - Initial Setup Migration completed successfully';
    RAISE NOTICE 'Tables created: tenant_alerts, tenant_alert_rules, tenant_alert_thresholds, tenant_alert_deliveries, tenant_alert_escalations';
    RAISE NOTICE 'Enums created: alert_priority_enum, alert_status_enum, alert_type_enum, delivery_channel_enum, delivery_status_enum';
    RAISE NOTICE 'Indexes, triggers, and RLS policies applied';
END $$; 