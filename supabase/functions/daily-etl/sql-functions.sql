-- ================================================
-- STORED PROCEDURES PARA ANÁLISE DE ALERTAS
-- ================================================

-- Função para análise de produtos parados
CREATE OR REPLACE FUNCTION analyze_stagnant_products(
    p_analysis_date DATE,
    p_threshold_days INTEGER
) RETURNS INTEGER AS $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Limpar dados existentes para a data
    DELETE FROM mart_stagnant_products WHERE analysis_date = p_analysis_date;
    
    -- Inserir produtos parados
    WITH last_sales AS (
        SELECT 
            v.id as variant_id,
            l.id as location_id,
            MAX(m.movement_ts::date) as last_sale_date,
            COALESCE(s.qty_on_hand, 0) as current_stock
        FROM core_product_variants v
        CROSS JOIN core_locations l
        LEFT JOIN core_movements m ON v.id = m.variant_id 
            AND l.id = m.location_id
            AND m.movement_type = 'SALE'
            AND m.movement_ts >= CURRENT_DATE - INTERVAL '90 days'
        LEFT JOIN core_inventory_snapshots s ON v.id = s.variant_id 
            AND l.id = s.location_id
            AND s.snapshot_ts = (
                SELECT MAX(snapshot_ts) 
                FROM core_inventory_snapshots s2 
                WHERE s2.variant_id = v.id AND s2.location_id = l.id
            )
        WHERE COALESCE(s.qty_on_hand, 0) > 0
        GROUP BY v.id, l.id, s.qty_on_hand
    )
    INSERT INTO mart_stagnant_products 
    (analysis_date, variant_id, location_id, days_without_movement, last_movement_date, current_stock, suggested_action)
    SELECT 
        p_analysis_date,
        variant_id,
        location_id,
        CASE 
            WHEN last_sale_date IS NULL THEN 90
            ELSE (CURRENT_DATE - last_sale_date)::integer
        END as days_without_movement,
        last_sale_date,
        current_stock,
        CASE 
            WHEN COALESCE((CURRENT_DATE - last_sale_date)::integer, 90) > 60 THEN 'liquidation'
            WHEN COALESCE((CURRENT_DATE - last_sale_date)::integer, 90) > 30 THEN 'promotion'
            ELSE 'transfer'
        END as suggested_action
    FROM last_sales
    WHERE COALESCE((CURRENT_DATE - last_sale_date)::integer, 90) >= p_threshold_days;

    GET DIAGNOSTICS result_count = ROW_COUNT;
    RETURN result_count;
END;
$$ LANGUAGE plpgsql;

-- Função para análise de necessidades de reposição
CREATE OR REPLACE FUNCTION analyze_replenishment_needs(
    p_analysis_date DATE,
    p_min_coverage_days INTEGER
) RETURNS INTEGER AS $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Limpar dados existentes para a data
    DELETE FROM mart_replenishment_alerts WHERE analysis_date = p_analysis_date;
    
    -- Inserir alertas de reposição
    WITH sales_avg AS (
        SELECT 
            v.id as variant_id,
            l.id as location_id,
            COALESCE(s.qty_on_hand, 0) as current_stock,
            COALESCE(AVG(ABS(m.qty_change)) FILTER (WHERE m.movement_type = 'SALE'), 0) as avg_daily_sales
        FROM core_product_variants v
        CROSS JOIN core_locations l
        LEFT JOIN core_movements m ON v.id = m.variant_id 
            AND l.id = m.location_id
            AND m.movement_type = 'SALE'
            AND m.movement_ts >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN core_inventory_snapshots s ON v.id = s.variant_id 
            AND l.id = s.location_id
            AND s.snapshot_ts = (
                SELECT MAX(snapshot_ts) 
                FROM core_inventory_snapshots s2 
                WHERE s2.variant_id = v.id AND s2.location_id = l.id
            )
        GROUP BY v.id, l.id, s.qty_on_hand
    )
    INSERT INTO mart_replenishment_alerts
    (analysis_date, variant_id, location_id, current_stock, avg_daily_sales, coverage_days, min_coverage_threshold, suggested_qty, priority_level)
    SELECT 
        p_analysis_date,
        variant_id,
        location_id,
        current_stock,
        avg_daily_sales,
        CASE 
            WHEN avg_daily_sales > 0 THEN current_stock / avg_daily_sales
            ELSE 999
        END as coverage_days,
        p_min_coverage_days,
        CASE 
            WHEN avg_daily_sales > 0 THEN GREATEST(0, CEIL((p_min_coverage_days * avg_daily_sales) - current_stock))
            ELSE 0
        END as suggested_qty,
        CASE 
            WHEN avg_daily_sales > 0 AND (current_stock / avg_daily_sales) <= 3 THEN 'critical'
            WHEN avg_daily_sales > 0 AND (current_stock / avg_daily_sales) <= 7 THEN 'high'
            WHEN avg_daily_sales > 0 AND (current_stock / avg_daily_sales) <= p_min_coverage_days THEN 'medium'
            ELSE 'low'
        END as priority_level
    FROM sales_avg
    WHERE avg_daily_sales > 0 
      AND (current_stock / avg_daily_sales) <= p_min_coverage_days;

    GET DIAGNOSTICS result_count = ROW_COUNT;
    RETURN result_count;
END;
$$ LANGUAGE plpgsql;

-- Função para análise de divergências de estoque
CREATE OR REPLACE FUNCTION analyze_inventory_divergences(
    p_analysis_date DATE
) RETURNS INTEGER AS $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Limpar dados existentes para a data
    DELETE FROM mart_inventory_divergences WHERE analysis_date = p_analysis_date;
    
    -- Inserir divergências de estoque
    WITH divergences AS (
        SELECT 
            di.variant_id,
            d.dest_location_id as location_id,
            di.qty_expected,
            (di.qty_scanned_ok + di.qty_scanned_diff) as scanned_qty,
            di.qty_scanned_diff as difference_qty,
            CASE 
                WHEN di.qty_expected > 0 THEN (di.qty_scanned_diff / di.qty_expected * 100)
                ELSE 0
            END as difference_percentage,
            di.qty_scanned_diff * di.unit_price as total_value_impact
        FROM core_document_items di
        JOIN core_documents d ON di.document_id = d.id
        WHERE d.issue_date >= CURRENT_DATE - INTERVAL '7 days'
          AND di.qty_scanned_diff != 0
    )
    INSERT INTO mart_inventory_divergences
    (analysis_date, variant_id, location_id, expected_qty, scanned_qty, difference_qty, difference_percentage, total_value_impact, severity)
    SELECT 
        p_analysis_date,
        variant_id,
        location_id,
        qty_expected,
        scanned_qty,
        difference_qty,
        difference_percentage,
        total_value_impact,
        CASE 
            WHEN ABS(difference_percentage) >= 20 THEN 'high'
            WHEN ABS(difference_percentage) >= 10 THEN 'medium'
            ELSE 'low'
        END as severity
    FROM divergences;

    GET DIAGNOSTICS result_count = ROW_COUNT;
    RETURN result_count;
END;
$$ LANGUAGE plpgsql;

-- Função para análise de otimização de margem
CREATE OR REPLACE FUNCTION analyze_margin_optimization(
    p_analysis_date DATE,
    p_min_margin_pct NUMERIC
) RETURNS INTEGER AS $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Limpar dados existentes para a data
    DELETE FROM mart_margin_alerts WHERE analysis_date = p_analysis_date;
    
    -- Inserir alertas de margem
    -- Nota: Assumindo que cost_price seria calculado ou fornecido
    -- Para o mock, usaremos uma estimativa de 60% do preço de venda como custo
    WITH margin_analysis AS (
        SELECT 
            v.id as variant_id,
            pr.price_value as current_price,
            (pr.price_value * 0.6) as cost_price, -- Mock: custo = 60% do preço
            ((pr.price_value - (pr.price_value * 0.6)) / pr.price_value * 100) as current_margin_pct
        FROM core_product_variants v
        JOIN core_product_pricing pr ON v.id = pr.variant_id
        WHERE pr.valid_from <= CURRENT_DATE
          AND (pr.valid_to IS NULL OR pr.valid_to >= CURRENT_DATE)
    )
    INSERT INTO mart_margin_alerts
    (analysis_date, variant_id, current_price, cost_price, current_margin_pct, min_acceptable_margin_pct, suggested_price, potential_revenue_impact)
    SELECT 
        p_analysis_date,
        variant_id,
        current_price,
        cost_price,
        current_margin_pct,
        p_min_margin_pct,
        cost_price / (1 - (p_min_margin_pct / 100)) as suggested_price,
        (cost_price / (1 - (p_min_margin_pct / 100))) - current_price as potential_revenue_impact
    FROM margin_analysis
    WHERE current_margin_pct < p_min_margin_pct;

    GET DIAGNOSTICS result_count = ROW_COUNT;
    RETURN result_count;
END;
$$ LANGUAGE plpgsql;

-- Função para análise de picos de devolução
CREATE OR REPLACE FUNCTION analyze_return_spikes(
    p_analysis_date DATE
) RETURNS INTEGER AS $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Limpar dados existentes para a data
    DELETE FROM mart_return_spike_alerts WHERE analysis_date = p_analysis_date;
    
    -- Inserir alertas de picos de devolução
    WITH return_analysis AS (
        SELECT 
            m.variant_id,
            m.location_id,
            COUNT(*) FILTER (WHERE m.movement_ts >= CURRENT_DATE - INTERVAL '7 days') as returns_last_7_days,
            COUNT(*) FILTER (WHERE m.movement_ts >= CURRENT_DATE - INTERVAL '14 days' 
                                AND m.movement_ts < CURRENT_DATE - INTERVAL '7 days') as returns_previous_7_days,
            SUM(ABS(m.qty_change) * di.unit_price) FILTER (WHERE m.movement_ts >= CURRENT_DATE - INTERVAL '7 days') as total_return_value
        FROM core_movements m
        LEFT JOIN core_documents d ON m.reference_id = d.id
        LEFT JOIN core_document_items di ON d.id = di.document_id AND m.variant_id = di.variant_id
        WHERE m.movement_type = 'RETURN'
          AND m.movement_ts >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY m.variant_id, m.location_id
    )
    INSERT INTO mart_return_spike_alerts
    (analysis_date, variant_id, location_id, returns_last_7_days, returns_previous_7_days, increase_percentage, total_return_value, suggested_investigation)
    SELECT 
        p_analysis_date,
        variant_id,
        location_id,
        returns_last_7_days,
        returns_previous_7_days,
        CASE 
            WHEN returns_previous_7_days > 0 THEN ((returns_last_7_days - returns_previous_7_days)::NUMERIC / returns_previous_7_days * 100)
            WHEN returns_last_7_days > 0 THEN 100
            ELSE 0
        END as increase_percentage,
        COALESCE(total_return_value, 0),
        CASE 
            WHEN returns_last_7_days >= 5 THEN 'Verificar qualidade do produto'
            WHEN returns_last_7_days >= 3 THEN 'Analisar motivos de devolução'
            ELSE 'Monitorar tendência'
        END as suggested_investigation
    FROM return_analysis
    WHERE returns_last_7_days > returns_previous_7_days 
      AND returns_last_7_days >= 2;

    GET DIAGNOSTICS result_count = ROW_COUNT;
    RETURN result_count;
END;
$$ LANGUAGE plpgsql;

-- Função para sugestões de redistribuição
CREATE OR REPLACE FUNCTION suggest_redistribution(
    p_analysis_date DATE
) RETURNS INTEGER AS $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Limpar dados existentes para a data
    DELETE FROM mart_redistribution_suggestions WHERE analysis_date = p_analysis_date;
    
    -- Inserir sugestões de redistribuição
    WITH stock_levels AS (
        SELECT 
            v.id as variant_id,
            l.id as location_id,
            l.location_type,
            COALESCE(s.qty_on_hand, 0) as current_stock,
            COALESCE(AVG(ABS(m.qty_change)) FILTER (WHERE m.movement_type = 'SALE'), 0) as avg_daily_sales
        FROM core_product_variants v
        CROSS JOIN core_locations l
        LEFT JOIN core_inventory_snapshots s ON v.id = s.variant_id AND l.id = s.location_id
        LEFT JOIN core_movements m ON v.id = m.variant_id 
            AND l.id = m.location_id
            AND m.movement_type = 'SALE'
            AND m.movement_ts >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY v.id, l.id, l.location_type, s.qty_on_hand
    ),
    redistribution_opportunities AS (
        SELECT 
            source.variant_id,
            source.location_id as source_location_id,
            target.location_id as target_location_id,
            source.current_stock as source_stock,
            target.current_stock as target_stock,
            source.avg_daily_sales as source_sales,
            target.avg_daily_sales as target_sales,
            GREATEST(0, source.current_stock - (source.avg_daily_sales * 30)) as source_excess,
            GREATEST(0, (target.avg_daily_sales * 15) - target.current_stock) as target_shortage
        FROM stock_levels source
        JOIN stock_levels target ON source.variant_id = target.variant_id
        WHERE source.location_id != target.location_id
          AND source.location_type = 'store'
          AND target.location_type = 'store'
          AND source.current_stock > (source.avg_daily_sales * 30) -- Mais de 30 dias de estoque
          AND target.current_stock < (target.avg_daily_sales * 15) -- Menos de 15 dias de estoque
    )
    INSERT INTO mart_redistribution_suggestions
    (analysis_date, variant_id, source_location_id, target_location_id, source_excess_qty, target_shortage_qty, suggested_transfer_qty, priority_score, estimated_revenue_gain)
    SELECT 
        p_analysis_date,
        variant_id,
        source_location_id,
        target_location_id,
        source_excess::INTEGER,
        target_shortage::INTEGER,
        LEAST(source_excess, target_shortage)::INTEGER as suggested_transfer_qty,
        (target_sales * 10 + source_excess * 5) as priority_score,
        target_sales * LEAST(source_excess, target_shortage) * 7 as estimated_revenue_gain -- Estimativa de ganho
    FROM redistribution_opportunities
    WHERE source_excess > 0 AND target_shortage > 0;

    GET DIAGNOSTICS result_count = ROW_COUNT;
    RETURN result_count;
END;
$$ LANGUAGE plpgsql;

-- Função para contar alertas por severidade
CREATE OR REPLACE FUNCTION count_alerts_by_severity(
    p_analysis_date DATE
) RETURNS TABLE(critical INTEGER, high INTEGER, medium INTEGER, low INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN ra.priority_level = 'critical' THEN 1 ELSE 0 END), 0)::INTEGER +
        COALESCE(SUM(CASE WHEN id.severity = 'high' THEN 1 ELSE 0 END), 0)::INTEGER as critical,
        
        COALESCE(SUM(CASE WHEN ra.priority_level = 'high' THEN 1 ELSE 0 END), 0)::INTEGER +
        COALESCE(SUM(CASE WHEN id.severity = 'high' THEN 1 ELSE 0 END), 0)::INTEGER as high,
        
        COALESCE(SUM(CASE WHEN ra.priority_level = 'medium' THEN 1 ELSE 0 END), 0)::INTEGER +
        COALESCE(SUM(CASE WHEN id.severity = 'medium' THEN 1 ELSE 0 END), 0)::INTEGER as medium,
        
        COALESCE(SUM(CASE WHEN ra.priority_level = 'low' THEN 1 ELSE 0 END), 0)::INTEGER +
        COALESCE(SUM(CASE WHEN id.severity = 'low' THEN 1 ELSE 0 END), 0)::INTEGER as low
    FROM (SELECT 1) dummy -- Garantir que sempre retornamos uma linha
    LEFT JOIN mart_replenishment_alerts ra ON ra.analysis_date = p_analysis_date
    LEFT JOIN mart_inventory_divergences id ON id.analysis_date = p_analysis_date;
END;
$$ LANGUAGE plpgsql; 