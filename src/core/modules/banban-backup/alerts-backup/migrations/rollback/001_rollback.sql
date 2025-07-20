-- =====================================================
-- BanBan Alerts Module - Rollback Migration 001
-- Version: 2.0.0
-- Created: 2024-12-19
-- Description: Rollback da migração inicial do sistema de alertas
-- =====================================================

-- Desabilitar RLS antes de remover as tabelas
ALTER TABLE IF EXISTS tenant_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_thresholds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_escalations DISABLE ROW LEVEL SECURITY;

-- Remover políticas RLS
DROP POLICY IF EXISTS tenant_alerts_tenant_isolation ON tenant_alerts;
DROP POLICY IF EXISTS tenant_alert_rules_tenant_isolation ON tenant_alert_rules;
DROP POLICY IF EXISTS tenant_alert_thresholds_tenant_isolation ON tenant_alert_thresholds;
DROP POLICY IF EXISTS tenant_alert_deliveries_tenant_isolation ON tenant_alert_deliveries;
DROP POLICY IF EXISTS tenant_alert_escalations_tenant_isolation ON tenant_alert_escalations;

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_tenant_alerts_updated_at ON tenant_alerts;
DROP TRIGGER IF EXISTS trigger_tenant_alert_rules_updated_at ON tenant_alert_rules;
DROP TRIGGER IF EXISTS trigger_tenant_alert_thresholds_updated_at ON tenant_alert_thresholds;
DROP TRIGGER IF EXISTS trigger_tenant_alert_deliveries_updated_at ON tenant_alert_deliveries;
DROP TRIGGER IF EXISTS trigger_tenant_alert_escalations_updated_at ON tenant_alert_escalations;

-- Remover função de trigger
DROP FUNCTION IF EXISTS update_tenant_alerts_updated_at();

-- Remover função de dados padrão
DROP FUNCTION IF EXISTS create_default_alert_thresholds(UUID, UUID);

-- Remover índices (serão removidos automaticamente com as tabelas, mas listamos para clareza)
DROP INDEX IF EXISTS idx_tenant_alerts_tenant_id;
DROP INDEX IF EXISTS idx_tenant_alerts_status;
DROP INDEX IF EXISTS idx_tenant_alerts_priority;
DROP INDEX IF EXISTS idx_tenant_alerts_type;
DROP INDEX IF EXISTS idx_tenant_alerts_triggered_at;
DROP INDEX IF EXISTS idx_tenant_alerts_aggregation_key;
DROP INDEX IF EXISTS idx_tenant_alerts_source;
DROP INDEX IF EXISTS idx_tenant_alerts_active;
DROP INDEX IF EXISTS idx_tenant_alerts_priority_status;
DROP INDEX IF EXISTS idx_tenant_alerts_type_priority;
DROP INDEX IF EXISTS idx_tenant_alerts_title_search;
DROP INDEX IF EXISTS idx_tenant_alerts_message_search;

DROP INDEX IF EXISTS idx_tenant_alert_rules_tenant_id;
DROP INDEX IF EXISTS idx_tenant_alert_rules_enabled;
DROP INDEX IF EXISTS idx_tenant_alert_rules_type;

DROP INDEX IF EXISTS idx_tenant_alert_thresholds_tenant_id;
DROP INDEX IF EXISTS idx_tenant_alert_thresholds_category;
DROP INDEX IF EXISTS idx_tenant_alert_thresholds_enabled;

DROP INDEX IF EXISTS idx_tenant_alert_deliveries_alert_id;
DROP INDEX IF EXISTS idx_tenant_alert_deliveries_status;
DROP INDEX IF EXISTS idx_tenant_alert_deliveries_channel;
DROP INDEX IF EXISTS idx_tenant_alert_deliveries_scheduled;

DROP INDEX IF EXISTS idx_tenant_alert_escalations_alert_id;
DROP INDEX IF EXISTS idx_tenant_alert_escalations_level;
DROP INDEX IF EXISTS idx_tenant_alert_escalations_escalated_at;

-- Remover tabelas (em ordem reversa devido às foreign keys)
DROP TABLE IF EXISTS tenant_alert_escalations;
DROP TABLE IF EXISTS tenant_alert_deliveries;
DROP TABLE IF EXISTS tenant_alert_thresholds;
DROP TABLE IF EXISTS tenant_alert_rules;
DROP TABLE IF EXISTS tenant_alerts;

-- Remover ENUMs
DROP TYPE IF EXISTS delivery_status_enum;
DROP TYPE IF EXISTS delivery_channel_enum;
DROP TYPE IF EXISTS alert_type_enum;
DROP TYPE IF EXISTS alert_status_enum;
DROP TYPE IF EXISTS alert_priority_enum;

-- Verificar se o rollback foi executado com sucesso
DO $$
BEGIN
    RAISE NOTICE 'BanBan Alerts Module - Rollback Migration 001 completed successfully';
    RAISE NOTICE 'All tables, indexes, triggers, functions, and enums have been removed';
END $$; 
-- BanBan Alerts Module - Rollback Migration 001
-- Version: 2.0.0
-- Created: 2024-12-19
-- Description: Rollback da migração inicial do sistema de alertas
-- =====================================================

-- Desabilitar RLS antes de remover as tabelas
ALTER TABLE IF EXISTS tenant_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_thresholds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenant_alert_escalations DISABLE ROW LEVEL SECURITY;

-- Remover políticas RLS
DROP POLICY IF EXISTS tenant_alerts_tenant_isolation ON tenant_alerts;
DROP POLICY IF EXISTS tenant_alert_rules_tenant_isolation ON tenant_alert_rules;
DROP POLICY IF EXISTS tenant_alert_thresholds_tenant_isolation ON tenant_alert_thresholds;
DROP POLICY IF EXISTS tenant_alert_deliveries_tenant_isolation ON tenant_alert_deliveries;
DROP POLICY IF EXISTS tenant_alert_escalations_tenant_isolation ON tenant_alert_escalations;

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_tenant_alerts_updated_at ON tenant_alerts;
DROP TRIGGER IF EXISTS trigger_tenant_alert_rules_updated_at ON tenant_alert_rules;
DROP TRIGGER IF EXISTS trigger_tenant_alert_thresholds_updated_at ON tenant_alert_thresholds;
DROP TRIGGER IF EXISTS trigger_tenant_alert_deliveries_updated_at ON tenant_alert_deliveries;
DROP TRIGGER IF EXISTS trigger_tenant_alert_escalations_updated_at ON tenant_alert_escalations;

-- Remover função de trigger
DROP FUNCTION IF EXISTS update_tenant_alerts_updated_at();

-- Remover função de dados padrão
DROP FUNCTION IF EXISTS create_default_alert_thresholds(UUID, UUID);

-- Remover índices (serão removidos automaticamente com as tabelas, mas listamos para clareza)
DROP INDEX IF EXISTS idx_tenant_alerts_tenant_id;
DROP INDEX IF EXISTS idx_tenant_alerts_status;
DROP INDEX IF EXISTS idx_tenant_alerts_priority;
DROP INDEX IF EXISTS idx_tenant_alerts_type;
DROP INDEX IF EXISTS idx_tenant_alerts_triggered_at;
DROP INDEX IF EXISTS idx_tenant_alerts_aggregation_key;
DROP INDEX IF EXISTS idx_tenant_alerts_source;
DROP INDEX IF EXISTS idx_tenant_alerts_active;
DROP INDEX IF EXISTS idx_tenant_alerts_priority_status;
DROP INDEX IF EXISTS idx_tenant_alerts_type_priority;
DROP INDEX IF EXISTS idx_tenant_alerts_title_search;
DROP INDEX IF EXISTS idx_tenant_alerts_message_search;

DROP INDEX IF EXISTS idx_tenant_alert_rules_tenant_id;
DROP INDEX IF EXISTS idx_tenant_alert_rules_enabled;
DROP INDEX IF EXISTS idx_tenant_alert_rules_type;

DROP INDEX IF EXISTS idx_tenant_alert_thresholds_tenant_id;
DROP INDEX IF EXISTS idx_tenant_alert_thresholds_category;
DROP INDEX IF EXISTS idx_tenant_alert_thresholds_enabled;

DROP INDEX IF EXISTS idx_tenant_alert_deliveries_alert_id;
DROP INDEX IF EXISTS idx_tenant_alert_deliveries_status;
DROP INDEX IF EXISTS idx_tenant_alert_deliveries_channel;
DROP INDEX IF EXISTS idx_tenant_alert_deliveries_scheduled;

DROP INDEX IF EXISTS idx_tenant_alert_escalations_alert_id;
DROP INDEX IF EXISTS idx_tenant_alert_escalations_level;
DROP INDEX IF EXISTS idx_tenant_alert_escalations_escalated_at;

-- Remover tabelas (em ordem reversa devido às foreign keys)
DROP TABLE IF EXISTS tenant_alert_escalations;
DROP TABLE IF EXISTS tenant_alert_deliveries;
DROP TABLE IF EXISTS tenant_alert_thresholds;
DROP TABLE IF EXISTS tenant_alert_rules;
DROP TABLE IF EXISTS tenant_alerts;

-- Remover ENUMs
DROP TYPE IF EXISTS delivery_status_enum;
DROP TYPE IF EXISTS delivery_channel_enum;
DROP TYPE IF EXISTS alert_type_enum;
DROP TYPE IF EXISTS alert_status_enum;
DROP TYPE IF EXISTS alert_priority_enum;

-- Verificar se o rollback foi executado com sucesso
DO $$
BEGIN
    RAISE NOTICE 'BanBan Alerts Module - Rollback Migration 001 completed successfully';
    RAISE NOTICE 'All tables, indexes, triggers, functions, and enums have been removed';
END $$; 