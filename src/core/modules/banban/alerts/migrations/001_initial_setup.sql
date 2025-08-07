-- =====================================================
-- BanBan Alerts Module - Initial Database Setup
-- =====================================================

-- Tabela principal de alertas
CREATE TABLE IF NOT EXISTS tenant_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('CRITICAL', 'ATTENTION', 'MODERATE', 'OPPORTUNITY')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED', 'SUPPRESSED')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  threshold_value DECIMAL,
  current_value DECIMAL,
  context_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  escalation_level INTEGER DEFAULT 0,
  auto_escalate BOOLEAN DEFAULT false,
  next_escalation_at TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_tenant_id ON tenant_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_status ON tenant_alerts(status);
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_priority ON tenant_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_alert_type ON tenant_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_triggered_at ON tenant_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_next_escalation ON tenant_alerts(next_escalation_at) WHERE next_escalation_at IS NOT NULL;

-- Tabela de regras de alertas
CREATE TABLE IF NOT EXISTS tenant_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('CRITICAL', 'ATTENTION', 'MODERATE', 'OPPORTUNITY')),
  enabled BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '{}',
  thresholds JSONB NOT NULL DEFAULT '{}',
  escalation_config JSONB DEFAULT '{}',
  notification_channels JSONB DEFAULT '["dashboard"]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, name)
);

-- Índices para regras
CREATE INDEX IF NOT EXISTS idx_tenant_alert_rules_tenant_id ON tenant_alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_rules_enabled ON tenant_alert_rules(enabled) WHERE enabled = true;

-- Tabela de thresholds configuráveis
CREATE TABLE IF NOT EXISTS tenant_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  threshold_value DECIMAL NOT NULL,
  comparison_operator VARCHAR(10) NOT NULL DEFAULT '>=' CHECK (comparison_operator IN ('>', '>=', '<', '<=', '=', '!=')),
  unit VARCHAR(20),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, category, subcategory)
);

-- Índices para thresholds
CREATE INDEX IF NOT EXISTS idx_tenant_alert_thresholds_tenant_id ON tenant_alert_thresholds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_thresholds_category ON tenant_alert_thresholds(category);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_thresholds_active ON tenant_alert_thresholds(is_active) WHERE is_active = true;

-- Tabela de log de entregas
CREATE TABLE IF NOT EXISTS tenant_alert_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES tenant_alerts(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para deliveries
CREATE INDEX IF NOT EXISTS idx_tenant_alert_deliveries_tenant_id ON tenant_alert_deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_deliveries_alert_id ON tenant_alert_deliveries(alert_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_deliveries_status ON tenant_alert_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_deliveries_channel ON tenant_alert_deliveries(channel);

-- Tabela de escalações
CREATE TABLE IF NOT EXISTS tenant_alert_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES tenant_alerts(id) ON DELETE CASCADE,
  escalation_level INTEGER NOT NULL,
  escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  escalated_by VARCHAR(20) DEFAULT 'system' CHECK (escalated_by IN ('system', 'user')),
  reason TEXT,
  notification_channels JSONB DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'completed')),
  stopped_at TIMESTAMPTZ,
  stopped_by UUID REFERENCES auth.users(id),
  stop_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para escalações
CREATE INDEX IF NOT EXISTS idx_tenant_alert_escalations_tenant_id ON tenant_alert_escalations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_escalations_alert_id ON tenant_alert_escalations(alert_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_escalations_status ON tenant_alert_escalations(status);
CREATE INDEX IF NOT EXISTS idx_tenant_alert_escalations_level ON tenant_alert_escalations(escalation_level);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_tenant_alerts_updated_at 
  BEFORE UPDATE ON tenant_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_alert_rules_updated_at 
  BEFORE UPDATE ON tenant_alert_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_alert_thresholds_updated_at 
  BEFORE UPDATE ON tenant_alert_thresholds 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_alert_deliveries_updated_at 
  BEFORE UPDATE ON tenant_alert_deliveries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_alert_escalations_updated_at 
  BEFORE UPDATE ON tenant_alert_escalations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenant_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_alert_escalations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (usuários só veem dados do próprio tenant)
CREATE POLICY "tenant_alerts_policy" ON tenant_alerts
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_alert_rules_policy" ON tenant_alert_rules
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_alert_thresholds_policy" ON tenant_alert_thresholds
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_alert_deliveries_policy" ON tenant_alert_deliveries
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_alert_escalations_policy" ON tenant_alert_escalations
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- DADOS INICIAIS (THRESHOLDS PADRÃO BANBAN)
-- =====================================================

-- Inserir thresholds padrão para o cliente BanBan
-- Nota: Executar apenas se tenant específico existir
/*
INSERT INTO tenant_alert_thresholds (tenant_id, category, subcategory, threshold_value, comparison_operator, unit, description) 
VALUES 
  -- Assumindo tenant_id conhecido, ajustar conforme necessário
  ('TENANT_UUID_AQUI', 'STOCK', 'CRITICAL', 5, '<=', 'units', 'Limite crítico de estoque'),
  ('TENANT_UUID_AQUI', 'STOCK', 'LOW', 10, '<=', 'units', 'Limite baixo de estoque'),
  ('TENANT_UUID_AQUI', 'MARGIN', 'LOW', 0.31, '<', 'percentage', 'Margem mínima aceitável'),
  ('TENANT_UUID_AQUI', 'SLOW_MOVING', 'DAYS', 30, '>=', 'days', 'Dias sem venda para considerar produto parado'),
  ('TENANT_UUID_AQUI', 'OVERSTOCK', 'LEVEL', 500, '>=', 'units', 'Nível de excesso de estoque'),
  ('TENANT_UUID_AQUI', 'SEASONAL', 'OPPORTUNITY', 0.8, '>=', 'percentage', 'Threshold para oportunidades sazonais')
ON CONFLICT (tenant_id, category, subcategory) DO NOTHING;
*/

-- Comentário sobre inserção de dados:
-- Os dados iniciais devem ser inseridos via aplicação após identificar o tenant correto

COMMENT ON TABLE tenant_alerts IS 'Alertas gerados pelo sistema para cada tenant';
COMMENT ON TABLE tenant_alert_rules IS 'Regras configuráveis para geração automática de alertas';
COMMENT ON TABLE tenant_alert_thresholds IS 'Thresholds configuráveis por categoria e tenant';
COMMENT ON TABLE tenant_alert_deliveries IS 'Log de entregas de notificações de alertas';
COMMENT ON TABLE tenant_alert_escalations IS 'Histórico de escalações automáticas de alertas';