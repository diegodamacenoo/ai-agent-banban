-- ================================================
-- MIGRATION: Analytics Tables for Advanced Dashboard
-- Data: 17/12/2024
-- Descrição: Criação de tabelas para módulos analíticos avançados
-- ================================================

-- 1. MÓDULO DE TENDÊNCIA E PREVISÃO
-- ================================================

-- Tabela para forecasts de vendas
CREATE TABLE IF NOT EXISTS forecast_sales (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid REFERENCES core_locations(id) ON DELETE CASCADE,
    forecast_date date NOT NULL,
    forecast_horizon_days integer NOT NULL CHECK (forecast_horizon_days IN (7, 14, 30)),
    predicted_sales numeric(10,2) NOT NULL DEFAULT 0,
    confidence_interval_low numeric(10,2) NOT NULL DEFAULT 0,
    confidence_interval_high numeric(10,2) NOT NULL DEFAULT 0,
    model_accuracy numeric(5,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(variant_id, location_id, forecast_date, forecast_horizon_days)
);

-- Tabela para cobertura projetada
CREATE TABLE IF NOT EXISTS projected_coverage (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES core_locations(id) ON DELETE CASCADE,
    analysis_date date NOT NULL,
    current_stock integer NOT NULL DEFAULT 0,
    avg_daily_sales numeric(8,2) NOT NULL DEFAULT 0,
    projected_days_coverage numeric(5,1) NOT NULL DEFAULT 0,
    projected_stockout_date date,
    risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    created_at timestamptz DEFAULT now(),
    UNIQUE(variant_id, location_id, analysis_date)
);

-- 2. MÓDULO DE ANÁLISE DE MIX E ROTATIVIDADE
-- ================================================

-- Tabela para análise ABC
CREATE TABLE IF NOT EXISTS abc_analysis (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid REFERENCES core_locations(id) ON DELETE CASCADE,
    revenue_contribution numeric(12,2) NOT NULL DEFAULT 0,
    stock_value numeric(12,2) NOT NULL DEFAULT 0,
    cumulative_revenue_percentage numeric(5,2) NOT NULL DEFAULT 0,
    abc_category text NOT NULL CHECK (abc_category IN ('A', 'B', 'C')),
    turnover_rate numeric(8,4) NOT NULL DEFAULT 0,
    days_of_inventory numeric(5,1) NOT NULL DEFAULT 0,
    priority_score numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(analysis_date, variant_id, location_id)
);

-- Expandir mart_stagnant_products para incluir aging detalhado
ALTER TABLE mart_stagnant_products 
ADD COLUMN IF NOT EXISTS aging_category text CHECK (aging_category IN ('fresh', 'slow', 'stagnant', 'dead'));

ALTER TABLE mart_stagnant_products 
ADD COLUMN IF NOT EXISTS priority_score numeric(5,2) DEFAULT 0;

-- 3. MÓDULO DE LOGÍSTICA E FORNECEDORES
-- ================================================

-- Tabela para métricas de fornecedores
CREATE TABLE IF NOT EXISTS supplier_metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id uuid NOT NULL REFERENCES core_suppliers(id) ON DELETE CASCADE,
    analysis_period_start date NOT NULL,
    analysis_period_end date NOT NULL,
    total_orders integer NOT NULL DEFAULT 0,
    avg_lead_time_days numeric(5,2) NOT NULL DEFAULT 0,
    sla_lead_time_days integer NOT NULL DEFAULT 0,
    lead_time_variance numeric(5,2) NOT NULL DEFAULT 0,
    fill_rate_percentage numeric(5,2) NOT NULL DEFAULT 0,
    divergence_rate_percentage numeric(5,2) NOT NULL DEFAULT 0,
    on_time_delivery_rate numeric(5,2) NOT NULL DEFAULT 0,
    quality_score numeric(5,2) NOT NULL DEFAULT 0,
    performance_score numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(supplier_id, analysis_period_start, analysis_period_end)
);

-- Tabela para tracking de entregas
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid NOT NULL REFERENCES core_orders(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES core_suppliers(id) ON DELETE CASCADE,
    expected_delivery_date date,
    actual_delivery_date date,
    lead_time_days numeric(5,2),
    delivery_status text NOT NULL CHECK (delivery_status IN ('pending', 'in_transit', 'delivered', 'delayed', 'cancelled')),
    delay_reason text,
    quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. MÓDULO DE RENTABILIDADE E PRECIFICAÇÃO
-- ================================================

-- Expandir core_product_pricing para histórico
ALTER TABLE core_product_pricing 
ADD COLUMN IF NOT EXISTS change_reason text,
ADD COLUMN IF NOT EXISTS margin_percentage numeric(5,2),
ADD COLUMN IF NOT EXISTS cost_price numeric(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_percentage numeric(5,2) DEFAULT 0;

-- Nova tabela para simulações de preço
CREATE TABLE IF NOT EXISTS price_simulations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid REFERENCES core_locations(id) ON DELETE CASCADE,
    current_price numeric(12,4) NOT NULL,
    simulated_price numeric(12,4) NOT NULL,
    price_change_percentage numeric(5,2) NOT NULL,
    current_margin_percentage numeric(5,2) NOT NULL,
    projected_margin_percentage numeric(5,2) NOT NULL,
    projected_volume_impact numeric(5,2) NOT NULL DEFAULT 0,
    projected_revenue_impact numeric(12,2) NOT NULL DEFAULT 0,
    simulation_notes text,
    created_by uuid REFERENCES auth.users(id),
    simulation_date timestamptz DEFAULT now()
);

-- Tabela para análise de elasticidade
CREATE TABLE IF NOT EXISTS price_elasticity (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid REFERENCES core_locations(id) ON DELETE CASCADE,
    price_elasticity_coefficient numeric(8,4) NOT NULL,
    confidence_level numeric(5,2) NOT NULL DEFAULT 0,
    r_squared numeric(5,4) NOT NULL DEFAULT 0,
    analysis_period_start date NOT NULL,
    analysis_period_end date NOT NULL,
    sample_size integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(variant_id, location_id, analysis_period_start, analysis_period_end)
);

-- 5. MÓDULO DE ALERTAS AVANÇADOS
-- ================================================

-- Tabela para safety stock dinâmico
CREATE TABLE IF NOT EXISTS dynamic_safety_stock (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES core_locations(id) ON DELETE CASCADE,
    analysis_date date NOT NULL,
    demand_average numeric(8,2) NOT NULL DEFAULT 0,
    demand_variance numeric(8,4) NOT NULL DEFAULT 0,
    lead_time_average numeric(5,2) NOT NULL DEFAULT 0,
    lead_time_variance numeric(5,4) NOT NULL DEFAULT 0,
    service_level_target numeric(5,2) NOT NULL DEFAULT 95.0,
    calculated_safety_stock integer NOT NULL DEFAULT 0,
    current_safety_stock integer DEFAULT 0,
    recommendation text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(variant_id, location_id, analysis_date)
);

-- Tabela para recomendações de promoção
CREATE TABLE IF NOT EXISTS promotion_recommendations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id uuid NOT NULL REFERENCES core_product_variants(id) ON DELETE CASCADE,
    location_id uuid REFERENCES core_locations(id) ON DELETE CASCADE,
    analysis_date date NOT NULL,
    reason_code text NOT NULL CHECK (reason_code IN ('slow_moving', 'excess_inventory', 'seasonal_clearance', 'margin_optimization')),
    recommended_discount_percentage numeric(5,2) NOT NULL,
    estimated_lift_percentage numeric(5,2) NOT NULL DEFAULT 0,
    recommended_duration_days integer NOT NULL DEFAULT 7,
    expected_margin_impact numeric(10,2) NOT NULL DEFAULT 0,
    expected_revenue_impact numeric(10,2) NOT NULL DEFAULT 0,
    priority_score numeric(5,2) NOT NULL DEFAULT 0,
    status text CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    UNIQUE(variant_id, location_id, analysis_date)
);

-- 6. TABELAS DE CONFIGURAÇÃO E METADADOS
-- ================================================

-- Tabela para configurações de análise
CREATE TABLE IF NOT EXISTS analytics_config (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    config_type text NOT NULL,
    config_key text NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE(organization_id, config_type, config_key)
);

-- Tabela para cache de métricas calculadas
CREATE TABLE IF NOT EXISTS metrics_cache (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key text NOT NULL UNIQUE,
    metric_type text NOT NULL,
    filters jsonb DEFAULT '{}',
    data jsonb NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índices para forecast_sales
CREATE INDEX IF NOT EXISTS idx_forecast_sales_variant_location ON forecast_sales(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_forecast_sales_date_horizon ON forecast_sales(forecast_date, forecast_horizon_days);

-- Índices para projected_coverage
CREATE INDEX IF NOT EXISTS idx_projected_coverage_variant_location ON projected_coverage(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_projected_coverage_risk_level ON projected_coverage(risk_level);
CREATE INDEX IF NOT EXISTS idx_projected_coverage_stockout_date ON projected_coverage(projected_stockout_date);

-- Índices para abc_analysis
CREATE INDEX IF NOT EXISTS idx_abc_analysis_date_category ON abc_analysis(analysis_date, abc_category);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_variant_location ON abc_analysis(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_priority_score ON abc_analysis(priority_score DESC);

-- Índices para supplier_metrics
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_supplier_period ON supplier_metrics(supplier_id, analysis_period_start);
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_performance_score ON supplier_metrics(performance_score DESC);

-- Índices para delivery_tracking
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_supplier_status ON delivery_tracking(supplier_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_expected_date ON delivery_tracking(expected_delivery_date);

-- Índices para price_simulations
CREATE INDEX IF NOT EXISTS idx_price_simulations_variant_date ON price_simulations(variant_id, simulation_date);
CREATE INDEX IF NOT EXISTS idx_price_simulations_created_by ON price_simulations(created_by);

-- Índices para price_elasticity
CREATE INDEX IF NOT EXISTS idx_price_elasticity_variant_location ON price_elasticity(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_price_elasticity_period ON price_elasticity(analysis_period_start, analysis_period_end);

-- Índices para dynamic_safety_stock
CREATE INDEX IF NOT EXISTS idx_dynamic_safety_stock_variant_location ON dynamic_safety_stock(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_safety_stock_analysis_date ON dynamic_safety_stock(analysis_date);

-- Índices para promotion_recommendations
CREATE INDEX IF NOT EXISTS idx_promotion_recommendations_variant_location ON promotion_recommendations(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_promotion_recommendations_priority_status ON promotion_recommendations(priority_score DESC, status);

-- Índices para analytics_config
CREATE INDEX IF NOT EXISTS idx_analytics_config_org_type ON analytics_config(organization_id, config_type);

-- Índices para metrics_cache
CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires_at ON metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_metric_type ON metrics_cache(metric_type);

-- ================================================
-- TRIGGERS PARA AUDIT E ATUALIZAÇÕES AUTOMÁTICAS
-- ================================================

-- Trigger para updated_at em supplier_metrics
CREATE OR REPLACE FUNCTION update_supplier_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at em delivery_tracking
CREATE OR REPLACE FUNCTION update_delivery_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at em analytics_config
CREATE OR REPLACE FUNCTION update_analytics_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trigger_supplier_metrics_updated_at ON supplier_metrics;
CREATE TRIGGER trigger_supplier_metrics_updated_at
    BEFORE UPDATE ON supplier_metrics
    FOR EACH ROW EXECUTE FUNCTION update_supplier_metrics_updated_at();

DROP TRIGGER IF EXISTS trigger_delivery_tracking_updated_at ON delivery_tracking;
CREATE TRIGGER trigger_delivery_tracking_updated_at
    BEFORE UPDATE ON delivery_tracking
    FOR EACH ROW EXECUTE FUNCTION update_delivery_tracking_updated_at();

DROP TRIGGER IF EXISTS trigger_analytics_config_updated_at ON analytics_config;
CREATE TRIGGER trigger_analytics_config_updated_at
    BEFORE UPDATE ON analytics_config
    FOR EACH ROW EXECUTE FUNCTION update_analytics_config_updated_at();

-- ================================================
-- RLS (ROW LEVEL SECURITY) - Opcional
-- ================================================

-- Habilitar RLS nas novas tabelas (seguindo padrão do projeto)
ALTER TABLE forecast_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE projected_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE abc_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_elasticity ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_safety_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;

-- ================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================================

COMMENT ON TABLE forecast_sales IS 'Armazena previsões de vendas por SKU, local e horizonte temporal';
COMMENT ON TABLE projected_coverage IS 'Calcula dias de cobertura projetada e datas de ruptura estimadas';
COMMENT ON TABLE abc_analysis IS 'Análise ABC para categorização de produtos por valor e rotatividade';
COMMENT ON TABLE supplier_metrics IS 'Métricas de performance consolidadas por fornecedor';
COMMENT ON TABLE delivery_tracking IS 'Rastreamento de entregas e cumprimento de SLAs';
COMMENT ON TABLE price_simulations IS 'Simulações de impacto de mudanças de preço';
COMMENT ON TABLE price_elasticity IS 'Coeficientes de elasticidade preço-demanda calculados';
COMMENT ON TABLE dynamic_safety_stock IS 'Cálculo dinâmico de estoque de segurança baseado em variabilidade';
COMMENT ON TABLE promotion_recommendations IS 'Recomendações de promoções baseadas em algoritmos preditivos';
COMMENT ON TABLE analytics_config IS 'Configurações específicas por organização para módulos analíticos';
COMMENT ON TABLE metrics_cache IS 'Cache de métricas calculadas para otimização de performance'; 