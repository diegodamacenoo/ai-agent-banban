-- =============================================
-- Migração Inicial - BanBan Data Processing Module v2.0.0
-- Data: 2024-12-19
-- Descrição: Setup completo das tabelas para processamento de dados
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. TABELA: tenant_data_processing_events
-- Armazena todos os eventos recebidos para processamento
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'webhook',
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    
    -- Dados do evento
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    signature VARCHAR(500),
    
    -- Configurações de processamento
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    
    -- Timestamps
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT fk_tenant_data_processing_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_events
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_tenant_id ON tenant_data_processing_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_status ON tenant_data_processing_events(status);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_event_type ON tenant_data_processing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_priority ON tenant_data_processing_events(priority DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_received_at ON tenant_data_processing_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_next_retry ON tenant_data_processing_events(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_source ON tenant_data_processing_events(source);

-- Índice composto para fila de processamento
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_queue ON tenant_data_processing_events(tenant_id, status, priority DESC, received_at ASC);

-- =============================================
-- 2. TABELA: tenant_data_processing_log
-- Log detalhado de todas as operações de processamento
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL,
    
    -- Detalhes da operação
    operation VARCHAR(100) NOT NULL,
    operation_status VARCHAR(50) NOT NULL CHECK (operation_status IN ('started', 'completed', 'failed', 'skipped')),
    duration_ms INTEGER,
    
    -- Contexto da operação
    context JSONB DEFAULT '{}',
    error_details JSONB,
    stack_trace TEXT,
    
    -- Dados de processamento
    input_data JSONB,
    output_data JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_data_processing_log_event FOREIGN KEY (event_id) REFERENCES tenant_data_processing_events(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_log
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_tenant_id ON tenant_data_processing_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_event_id ON tenant_data_processing_log(event_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_operation ON tenant_data_processing_log(operation);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_status ON tenant_data_processing_log(operation_status);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_created_at ON tenant_data_processing_log(created_at DESC);

-- =============================================
-- 3. TABELA: tenant_data_processing_config
-- Configurações específicas por tenant
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE,
    
    -- Configurações gerais
    enabled BOOLEAN NOT NULL DEFAULT true,
    auto_processing BOOLEAN NOT NULL DEFAULT true,
    debug_mode BOOLEAN NOT NULL DEFAULT false,
    
    -- Configurações de fila
    max_event_queue_size INTEGER NOT NULL DEFAULT 10000 CHECK (max_event_queue_size BETWEEN 100 AND 50000),
    processing_timeout INTEGER NOT NULL DEFAULT 30000 CHECK (processing_timeout BETWEEN 5000 AND 300000),
    batch_size INTEGER NOT NULL DEFAULT 50 CHECK (batch_size BETWEEN 1 AND 1000),
    max_concurrent_processors INTEGER NOT NULL DEFAULT 5 CHECK (max_concurrent_processors BETWEEN 1 AND 20),
    
    -- Configurações de retry
    retry_attempts INTEGER NOT NULL DEFAULT 3 CHECK (retry_attempts BETWEEN 1 AND 10),
    initial_retry_delay INTEGER NOT NULL DEFAULT 1000 CHECK (initial_retry_delay BETWEEN 100 AND 60000),
    max_retry_delay INTEGER NOT NULL DEFAULT 30000 CHECK (max_retry_delay BETWEEN 1000 AND 300000),
    backoff_multiplier DECIMAL(3,2) NOT NULL DEFAULT 2.0 CHECK (backoff_multiplier BETWEEN 1.0 AND 5.0),
    
    -- Configurações de webhook
    enable_webhooks BOOLEAN NOT NULL DEFAULT true,
    signature_validation BOOLEAN NOT NULL DEFAULT true,
    timestamp_validation BOOLEAN NOT NULL DEFAULT true,
    max_event_age INTEGER NOT NULL DEFAULT 3600000,
    
    -- Configurações de validação
    enable_validation BOOLEAN NOT NULL DEFAULT true,
    strict_mode BOOLEAN NOT NULL DEFAULT false,
    max_payload_size INTEGER NOT NULL DEFAULT 1048576 CHECK (max_payload_size BETWEEN 1024 AND 10485760),
    
    -- Configurações de lote
    enable_batch_processing BOOLEAN NOT NULL DEFAULT true,
    batch_timeout INTEGER NOT NULL DEFAULT 5000 CHECK (batch_timeout BETWEEN 1000 AND 60000),
    min_batch_size INTEGER NOT NULL DEFAULT 5 CHECK (min_batch_size BETWEEN 1 AND 100),
    max_batch_size INTEGER NOT NULL DEFAULT 100 CHECK (max_batch_size BETWEEN 10 AND 1000),
    
    -- Configurações de monitoramento
    enable_metrics BOOLEAN NOT NULL DEFAULT true,
    enable_audit_logging BOOLEAN NOT NULL DEFAULT true,
    log_level VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (log_level IN ('error', 'warn', 'info', 'debug')),
    
    -- Configurações de integração
    enable_module_integration BOOLEAN NOT NULL DEFAULT true,
    insights_integration BOOLEAN NOT NULL DEFAULT true,
    performance_integration BOOLEAN NOT NULL DEFAULT true,
    inventory_integration BOOLEAN NOT NULL DEFAULT true,
    
    -- Configurações customizadas
    custom_settings JSONB DEFAULT '{}',
    allowed_event_types JSONB DEFAULT '["sale_completed", "inventory_adjustment", "transfer_completed", "product_updated"]',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_config
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_config_tenant_id ON tenant_data_processing_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_config_enabled ON tenant_data_processing_config(enabled);

-- =============================================
-- 4. TABELA: tenant_data_processing_metrics
-- Métricas de performance e monitoramento
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Identificação da métrica
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
    
    -- Valores da métrica
    value DECIMAL(15,6) NOT NULL,
    count INTEGER DEFAULT 1,
    min_value DECIMAL(15,6),
    max_value DECIMAL(15,6),
    avg_value DECIMAL(15,6),
    
    -- Dimensões e labels
    labels JSONB DEFAULT '{}',
    dimensions JSONB DEFAULT '{}',
    
    -- Contexto temporal
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    granularity VARCHAR(20) NOT NULL DEFAULT 'minute' CHECK (granularity IN ('second', 'minute', 'hour', 'day')),
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_metrics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_metrics
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_tenant_id ON tenant_data_processing_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_name ON tenant_data_processing_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_type ON tenant_data_processing_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_period ON tenant_data_processing_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_created_at ON tenant_data_processing_metrics(created_at DESC);

-- Índice composto para consultas de métricas
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_query ON tenant_data_processing_metrics(tenant_id, metric_name, period_start DESC);

-- =============================================
-- 5. TABELA: tenant_data_processing_failed_events
-- Eventos que falharam no processamento para análise
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_failed_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    original_event_id UUID NOT NULL,
    
    -- Detalhes do evento original
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Detalhes da falha
    failure_reason VARCHAR(500) NOT NULL,
    error_code VARCHAR(100),
    error_details JSONB DEFAULT '{}',
    stack_trace TEXT,
    
    -- Contexto da falha
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    can_retry BOOLEAN NOT NULL DEFAULT true,
    
    -- Status de resolução
    resolution_status VARCHAR(50) NOT NULL DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'investigating', 'resolved', 'ignored')),
    resolution_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_failed_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_data_processing_failed_events_original FOREIGN KEY (original_event_id) REFERENCES tenant_data_processing_events(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_failed_events
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_tenant_id ON tenant_data_processing_failed_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_original_id ON tenant_data_processing_failed_events(original_event_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_event_type ON tenant_data_processing_failed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_status ON tenant_data_processing_failed_events(resolution_status);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_failed_at ON tenant_data_processing_failed_events(failed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_can_retry ON tenant_data_processing_failed_events(can_retry) WHERE can_retry = true;

-- =============================================
-- 6. TABELA: tenant_data_processing_audit
-- Auditoria completa de todas as operações
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Identificação da operação
    operation_id UUID DEFAULT uuid_generate_v4(),
    operation_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    
    -- Detalhes da operação
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'process', 'validate', 'retry')),
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    -- Contexto da operação
    user_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    
    -- Resultado da operação
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    -- Timestamps
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_audit
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_tenant_id ON tenant_data_processing_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_operation_id ON tenant_data_processing_audit(operation_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_operation_type ON tenant_data_processing_audit(operation_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_entity ON tenant_data_processing_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_action ON tenant_data_processing_audit(action);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_user_id ON tenant_data_processing_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_performed_at ON tenant_data_processing_audit(performed_at DESC);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

-- Trigger para tenant_data_processing_events
CREATE OR REPLACE FUNCTION update_tenant_data_processing_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_data_processing_events_updated_at
    BEFORE UPDATE ON tenant_data_processing_events
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_data_processing_events_updated_at();

-- Trigger para tenant_data_processing_config
CREATE OR REPLACE FUNCTION update_tenant_data_processing_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_data_processing_config_updated_at
    BEFORE UPDATE ON tenant_data_processing_config
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_data_processing_config_updated_at();

-- Trigger para tenant_data_processing_failed_events
CREATE OR REPLACE FUNCTION update_tenant_data_processing_failed_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_data_processing_failed_events_updated_at
    BEFORE UPDATE ON tenant_data_processing_failed_events
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_data_processing_failed_events_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenant_data_processing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_failed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_audit ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenant_data_processing_events
CREATE POLICY tenant_data_processing_events_tenant_isolation ON tenant_data_processing_events
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_log
CREATE POLICY tenant_data_processing_log_tenant_isolation ON tenant_data_processing_log
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_config
CREATE POLICY tenant_data_processing_config_tenant_isolation ON tenant_data_processing_config
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_metrics
CREATE POLICY tenant_data_processing_metrics_tenant_isolation ON tenant_data_processing_metrics
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_failed_events
CREATE POLICY tenant_data_processing_failed_events_tenant_isolation ON tenant_data_processing_failed_events
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_audit
CREATE POLICY tenant_data_processing_audit_tenant_isolation ON tenant_data_processing_audit
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =============================================
-- INSERIR CONFIGURAÇÃO PADRÃO PARA TENANT BANBAN
-- =============================================
INSERT INTO tenant_data_processing_config (
    tenant_id,
    enabled,
    auto_processing,
    debug_mode,
    max_event_queue_size,
    processing_timeout,
    batch_size,
    max_concurrent_processors,
    retry_attempts,
    initial_retry_delay,
    max_retry_delay,
    backoff_multiplier,
    enable_webhooks,
    signature_validation,
    timestamp_validation,
    max_event_age,
    enable_validation,
    strict_mode,
    max_payload_size,
    enable_batch_processing,
    batch_timeout,
    min_batch_size,
    max_batch_size,
    enable_metrics,
    enable_audit_logging,
    log_level,
    enable_module_integration,
    insights_integration,
    performance_integration,
    inventory_integration,
    custom_settings,
    allowed_event_types
) VALUES (
    (SELECT id FROM tenants WHERE name = 'BanBan Fashion' LIMIT 1),
    true,
    true,
    false,
    10000,
    30000,
    50,
    5,
    3,
    1000,
    30000,
    2.0,
    true,
    true,
    true,
    3600000,
    true,
    false,
    1048576,
    true,
    5000,
    5,
    100,
    true,
    true,
    'info',
    true,
    true,
    true,
    true,
    '{"webhook_timeout": 15000, "max_payload_compression": true}',
    '["sale_completed", "sale_cancelled", "return_processed", "inventory_adjustment", "inventory_count", "inventory_transfer", "purchase_completed", "purchase_cancelled", "transfer_initiated", "transfer_completed", "transfer_cancelled", "product_created", "product_updated", "product_discontinued"]'
) ON CONFLICT (tenant_id) DO NOTHING;

-- =============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================
COMMENT ON TABLE tenant_data_processing_events IS 'Armazena todos os eventos recebidos para processamento pelo módulo BanBan Data Processing';
COMMENT ON TABLE tenant_data_processing_log IS 'Log detalhado de todas as operações de processamento de eventos';
COMMENT ON TABLE tenant_data_processing_config IS 'Configurações específicas por tenant para o módulo de processamento de dados';
COMMENT ON TABLE tenant_data_processing_metrics IS 'Métricas de performance e monitoramento do processamento de dados';
COMMENT ON TABLE tenant_data_processing_failed_events IS 'Eventos que falharam no processamento para análise e reprocessamento';
COMMENT ON TABLE tenant_data_processing_audit IS 'Auditoria completa de todas as operações do módulo de processamento de dados';

-- Fim da migração 
-- Migração Inicial - BanBan Data Processing Module v2.0.0
-- Data: 2024-12-19
-- Descrição: Setup completo das tabelas para processamento de dados
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. TABELA: tenant_data_processing_events
-- Armazena todos os eventos recebidos para processamento
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'webhook',
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    
    -- Dados do evento
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    signature VARCHAR(500),
    
    -- Configurações de processamento
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    
    -- Timestamps
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT fk_tenant_data_processing_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_events
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_tenant_id ON tenant_data_processing_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_status ON tenant_data_processing_events(status);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_event_type ON tenant_data_processing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_priority ON tenant_data_processing_events(priority DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_received_at ON tenant_data_processing_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_next_retry ON tenant_data_processing_events(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_source ON tenant_data_processing_events(source);

-- Índice composto para fila de processamento
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_events_queue ON tenant_data_processing_events(tenant_id, status, priority DESC, received_at ASC);

-- =============================================
-- 2. TABELA: tenant_data_processing_log
-- Log detalhado de todas as operações de processamento
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL,
    
    -- Detalhes da operação
    operation VARCHAR(100) NOT NULL,
    operation_status VARCHAR(50) NOT NULL CHECK (operation_status IN ('started', 'completed', 'failed', 'skipped')),
    duration_ms INTEGER,
    
    -- Contexto da operação
    context JSONB DEFAULT '{}',
    error_details JSONB,
    stack_trace TEXT,
    
    -- Dados de processamento
    input_data JSONB,
    output_data JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_data_processing_log_event FOREIGN KEY (event_id) REFERENCES tenant_data_processing_events(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_log
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_tenant_id ON tenant_data_processing_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_event_id ON tenant_data_processing_log(event_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_operation ON tenant_data_processing_log(operation);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_status ON tenant_data_processing_log(operation_status);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_log_created_at ON tenant_data_processing_log(created_at DESC);

-- =============================================
-- 3. TABELA: tenant_data_processing_config
-- Configurações específicas por tenant
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE,
    
    -- Configurações gerais
    enabled BOOLEAN NOT NULL DEFAULT true,
    auto_processing BOOLEAN NOT NULL DEFAULT true,
    debug_mode BOOLEAN NOT NULL DEFAULT false,
    
    -- Configurações de fila
    max_event_queue_size INTEGER NOT NULL DEFAULT 10000 CHECK (max_event_queue_size BETWEEN 100 AND 50000),
    processing_timeout INTEGER NOT NULL DEFAULT 30000 CHECK (processing_timeout BETWEEN 5000 AND 300000),
    batch_size INTEGER NOT NULL DEFAULT 50 CHECK (batch_size BETWEEN 1 AND 1000),
    max_concurrent_processors INTEGER NOT NULL DEFAULT 5 CHECK (max_concurrent_processors BETWEEN 1 AND 20),
    
    -- Configurações de retry
    retry_attempts INTEGER NOT NULL DEFAULT 3 CHECK (retry_attempts BETWEEN 1 AND 10),
    initial_retry_delay INTEGER NOT NULL DEFAULT 1000 CHECK (initial_retry_delay BETWEEN 100 AND 60000),
    max_retry_delay INTEGER NOT NULL DEFAULT 30000 CHECK (max_retry_delay BETWEEN 1000 AND 300000),
    backoff_multiplier DECIMAL(3,2) NOT NULL DEFAULT 2.0 CHECK (backoff_multiplier BETWEEN 1.0 AND 5.0),
    
    -- Configurações de webhook
    enable_webhooks BOOLEAN NOT NULL DEFAULT true,
    signature_validation BOOLEAN NOT NULL DEFAULT true,
    timestamp_validation BOOLEAN NOT NULL DEFAULT true,
    max_event_age INTEGER NOT NULL DEFAULT 3600000,
    
    -- Configurações de validação
    enable_validation BOOLEAN NOT NULL DEFAULT true,
    strict_mode BOOLEAN NOT NULL DEFAULT false,
    max_payload_size INTEGER NOT NULL DEFAULT 1048576 CHECK (max_payload_size BETWEEN 1024 AND 10485760),
    
    -- Configurações de lote
    enable_batch_processing BOOLEAN NOT NULL DEFAULT true,
    batch_timeout INTEGER NOT NULL DEFAULT 5000 CHECK (batch_timeout BETWEEN 1000 AND 60000),
    min_batch_size INTEGER NOT NULL DEFAULT 5 CHECK (min_batch_size BETWEEN 1 AND 100),
    max_batch_size INTEGER NOT NULL DEFAULT 100 CHECK (max_batch_size BETWEEN 10 AND 1000),
    
    -- Configurações de monitoramento
    enable_metrics BOOLEAN NOT NULL DEFAULT true,
    enable_audit_logging BOOLEAN NOT NULL DEFAULT true,
    log_level VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (log_level IN ('error', 'warn', 'info', 'debug')),
    
    -- Configurações de integração
    enable_module_integration BOOLEAN NOT NULL DEFAULT true,
    insights_integration BOOLEAN NOT NULL DEFAULT true,
    performance_integration BOOLEAN NOT NULL DEFAULT true,
    inventory_integration BOOLEAN NOT NULL DEFAULT true,
    
    -- Configurações customizadas
    custom_settings JSONB DEFAULT '{}',
    allowed_event_types JSONB DEFAULT '["sale_completed", "inventory_adjustment", "transfer_completed", "product_updated"]',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_config
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_config_tenant_id ON tenant_data_processing_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_config_enabled ON tenant_data_processing_config(enabled);

-- =============================================
-- 4. TABELA: tenant_data_processing_metrics
-- Métricas de performance e monitoramento
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Identificação da métrica
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
    
    -- Valores da métrica
    value DECIMAL(15,6) NOT NULL,
    count INTEGER DEFAULT 1,
    min_value DECIMAL(15,6),
    max_value DECIMAL(15,6),
    avg_value DECIMAL(15,6),
    
    -- Dimensões e labels
    labels JSONB DEFAULT '{}',
    dimensions JSONB DEFAULT '{}',
    
    -- Contexto temporal
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    granularity VARCHAR(20) NOT NULL DEFAULT 'minute' CHECK (granularity IN ('second', 'minute', 'hour', 'day')),
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_metrics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_metrics
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_tenant_id ON tenant_data_processing_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_name ON tenant_data_processing_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_type ON tenant_data_processing_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_period ON tenant_data_processing_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_created_at ON tenant_data_processing_metrics(created_at DESC);

-- Índice composto para consultas de métricas
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_metrics_query ON tenant_data_processing_metrics(tenant_id, metric_name, period_start DESC);

-- =============================================
-- 5. TABELA: tenant_data_processing_failed_events
-- Eventos que falharam no processamento para análise
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_failed_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    original_event_id UUID NOT NULL,
    
    -- Detalhes do evento original
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Detalhes da falha
    failure_reason VARCHAR(500) NOT NULL,
    error_code VARCHAR(100),
    error_details JSONB DEFAULT '{}',
    stack_trace TEXT,
    
    -- Contexto da falha
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    can_retry BOOLEAN NOT NULL DEFAULT true,
    
    -- Status de resolução
    resolution_status VARCHAR(50) NOT NULL DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'investigating', 'resolved', 'ignored')),
    resolution_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_failed_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_data_processing_failed_events_original FOREIGN KEY (original_event_id) REFERENCES tenant_data_processing_events(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_failed_events
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_tenant_id ON tenant_data_processing_failed_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_original_id ON tenant_data_processing_failed_events(original_event_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_event_type ON tenant_data_processing_failed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_status ON tenant_data_processing_failed_events(resolution_status);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_failed_at ON tenant_data_processing_failed_events(failed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_failed_events_can_retry ON tenant_data_processing_failed_events(can_retry) WHERE can_retry = true;

-- =============================================
-- 6. TABELA: tenant_data_processing_audit
-- Auditoria completa de todas as operações
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_data_processing_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Identificação da operação
    operation_id UUID DEFAULT uuid_generate_v4(),
    operation_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    
    -- Detalhes da operação
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'process', 'validate', 'retry')),
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    -- Contexto da operação
    user_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    
    -- Resultado da operação
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    -- Timestamps
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tenant_data_processing_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para tenant_data_processing_audit
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_tenant_id ON tenant_data_processing_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_operation_id ON tenant_data_processing_audit(operation_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_operation_type ON tenant_data_processing_audit(operation_type);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_entity ON tenant_data_processing_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_action ON tenant_data_processing_audit(action);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_user_id ON tenant_data_processing_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_processing_audit_performed_at ON tenant_data_processing_audit(performed_at DESC);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

-- Trigger para tenant_data_processing_events
CREATE OR REPLACE FUNCTION update_tenant_data_processing_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_data_processing_events_updated_at
    BEFORE UPDATE ON tenant_data_processing_events
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_data_processing_events_updated_at();

-- Trigger para tenant_data_processing_config
CREATE OR REPLACE FUNCTION update_tenant_data_processing_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_data_processing_config_updated_at
    BEFORE UPDATE ON tenant_data_processing_config
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_data_processing_config_updated_at();

-- Trigger para tenant_data_processing_failed_events
CREATE OR REPLACE FUNCTION update_tenant_data_processing_failed_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_data_processing_failed_events_updated_at
    BEFORE UPDATE ON tenant_data_processing_failed_events
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_data_processing_failed_events_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenant_data_processing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_failed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_processing_audit ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenant_data_processing_events
CREATE POLICY tenant_data_processing_events_tenant_isolation ON tenant_data_processing_events
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_log
CREATE POLICY tenant_data_processing_log_tenant_isolation ON tenant_data_processing_log
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_config
CREATE POLICY tenant_data_processing_config_tenant_isolation ON tenant_data_processing_config
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_metrics
CREATE POLICY tenant_data_processing_metrics_tenant_isolation ON tenant_data_processing_metrics
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_failed_events
CREATE POLICY tenant_data_processing_failed_events_tenant_isolation ON tenant_data_processing_failed_events
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Políticas RLS para tenant_data_processing_audit
CREATE POLICY tenant_data_processing_audit_tenant_isolation ON tenant_data_processing_audit
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =============================================
-- INSERIR CONFIGURAÇÃO PADRÃO PARA TENANT BANBAN
-- =============================================
INSERT INTO tenant_data_processing_config (
    tenant_id,
    enabled,
    auto_processing,
    debug_mode,
    max_event_queue_size,
    processing_timeout,
    batch_size,
    max_concurrent_processors,
    retry_attempts,
    initial_retry_delay,
    max_retry_delay,
    backoff_multiplier,
    enable_webhooks,
    signature_validation,
    timestamp_validation,
    max_event_age,
    enable_validation,
    strict_mode,
    max_payload_size,
    enable_batch_processing,
    batch_timeout,
    min_batch_size,
    max_batch_size,
    enable_metrics,
    enable_audit_logging,
    log_level,
    enable_module_integration,
    insights_integration,
    performance_integration,
    inventory_integration,
    custom_settings,
    allowed_event_types
) VALUES (
    (SELECT id FROM tenants WHERE name = 'BanBan Fashion' LIMIT 1),
    true,
    true,
    false,
    10000,
    30000,
    50,
    5,
    3,
    1000,
    30000,
    2.0,
    true,
    true,
    true,
    3600000,
    true,
    false,
    1048576,
    true,
    5000,
    5,
    100,
    true,
    true,
    'info',
    true,
    true,
    true,
    true,
    '{"webhook_timeout": 15000, "max_payload_compression": true}',
    '["sale_completed", "sale_cancelled", "return_processed", "inventory_adjustment", "inventory_count", "inventory_transfer", "purchase_completed", "purchase_cancelled", "transfer_initiated", "transfer_completed", "transfer_cancelled", "product_created", "product_updated", "product_discontinued"]'
) ON CONFLICT (tenant_id) DO NOTHING;

-- =============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================
COMMENT ON TABLE tenant_data_processing_events IS 'Armazena todos os eventos recebidos para processamento pelo módulo BanBan Data Processing';
COMMENT ON TABLE tenant_data_processing_log IS 'Log detalhado de todas as operações de processamento de eventos';
COMMENT ON TABLE tenant_data_processing_config IS 'Configurações específicas por tenant para o módulo de processamento de dados';
COMMENT ON TABLE tenant_data_processing_metrics IS 'Métricas de performance e monitoramento do processamento de dados';
COMMENT ON TABLE tenant_data_processing_failed_events IS 'Eventos que falharam no processamento para análise e reprocessamento';
COMMENT ON TABLE tenant_data_processing_audit IS 'Auditoria completa de todas as operações do módulo de processamento de dados';

-- Fim da migração 