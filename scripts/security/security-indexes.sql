-- ================================================
-- SCRIPT: Security and Performance Indexes
-- FASE 3 - Database Security Enhancement
-- Data: 2024-12-18
-- ================================================

-- ================================================
-- 1. INDEXES DE SEGURANÇA PARA AUTENTICAÇÃO
-- ================================================

-- Indexes críticos para tabelas de usuários
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_security ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_security ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_security ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Indexes para user_sessions (performance crítica)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_accessed ON user_sessions(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at) WHERE expires_at IS NOT NULL;

-- Indexes para user_known_devices
CREATE INDEX IF NOT EXISTS idx_user_known_devices_user_id ON user_known_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_known_devices_device_id ON user_known_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_known_devices_last_used ON user_known_devices(last_used_at);

-- Indexes para user_data_exports
CREATE INDEX IF NOT EXISTS idx_user_data_exports_user_id ON user_data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_status ON user_data_exports(status);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_created_at ON user_data_exports(created_at);

-- ================================================
-- 2. INDEXES PARA AUDITORIA E COMPLIANCE
-- ================================================

-- Indexes críticos para audit_logs (performance e segurança)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_agent ON audit_logs(user_agent) WHERE user_agent IS NOT NULL;

-- Index composto para queries comuns de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_time ON audit_logs(actor_user_id, action_type, action_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_time ON audit_logs(resource_type, resource_id, action_timestamp);

-- Indexes para alert_digest
CREATE INDEX IF NOT EXISTS idx_alert_digest_severity ON alert_digest(severity);
CREATE INDEX IF NOT EXISTS idx_alert_digest_alert_ts ON alert_digest(alert_ts);
CREATE INDEX IF NOT EXISTS idx_alert_digest_created_at ON alert_digest(created_at);

-- ================================================
-- 3. INDEXES ORGANIZACIONAIS
-- ================================================

-- Indexes para organizations
CREATE INDEX IF NOT EXISTS idx_organizations_id ON organizations(id);
CREATE INDEX IF NOT EXISTS idx_organizations_company_legal_name ON organizations(company_legal_name);
CREATE INDEX IF NOT EXISTS idx_organizations_company_trading_name ON organizations(company_trading_name);
CREATE INDEX IF NOT EXISTS idx_organizations_client_type ON organizations(client_type) WHERE client_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_implementation_status ON organizations(is_implementation_complete) WHERE is_implementation_complete IS NOT NULL;

-- Indexes para custom_modules
CREATE INDEX IF NOT EXISTS idx_custom_modules_organization_id ON custom_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_modules_module_name ON custom_modules(module_name);
CREATE INDEX IF NOT EXISTS idx_custom_modules_is_active ON custom_modules(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_modules_org_name_unique ON custom_modules(organization_id, module_name);

-- ================================================
-- 4. INDEXES PARA DADOS CORE - PERFORMANCE CRÍTICA
-- ================================================

-- Indexes para core_products
CREATE INDEX IF NOT EXISTS idx_core_products_external_id ON core_products(external_id);
CREATE INDEX IF NOT EXISTS idx_core_products_category ON core_products(category);
CREATE INDEX IF NOT EXISTS idx_core_products_supplier_external_id ON core_products(supplier_external_id);
CREATE INDEX IF NOT EXISTS idx_core_products_status ON core_products(status);
CREATE INDEX IF NOT EXISTS idx_core_products_created_at ON core_products(created_at);

-- Index para busca textual (GIN para performance)
CREATE INDEX IF NOT EXISTS idx_core_products_product_name_gin ON core_products USING gin(to_tsvector('portuguese', product_name));
CREATE INDEX IF NOT EXISTS idx_core_products_description_gin ON core_products USING gin(to_tsvector('portuguese', description)) WHERE description IS NOT NULL;

-- Indexes para core_product_variants
CREATE INDEX IF NOT EXISTS idx_core_product_variants_product_id ON core_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_core_product_variants_external_id ON core_product_variants(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_product_variants_size_color ON core_product_variants(size, color);
CREATE INDEX IF NOT EXISTS idx_core_product_variants_gtin ON core_product_variants(gtin_variant) WHERE gtin_variant IS NOT NULL;

-- Indexes para core_product_pricing
CREATE INDEX IF NOT EXISTS idx_core_product_pricing_variant_id ON core_product_pricing(variant_id);
CREATE INDEX IF NOT EXISTS idx_core_product_pricing_product_id ON core_product_pricing(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_product_pricing_price_type ON core_product_pricing(price_type);
CREATE INDEX IF NOT EXISTS idx_core_product_pricing_valid_from ON core_product_pricing(valid_from);
CREATE INDEX IF NOT EXISTS idx_core_product_pricing_valid_to ON core_product_pricing(valid_to) WHERE valid_to IS NOT NULL;

-- Index para buscar preços vigentes
CREATE INDEX IF NOT EXISTS idx_core_product_pricing_current ON core_product_pricing(variant_id, price_type, valid_from) 
WHERE valid_to IS NULL OR valid_to >= CURRENT_DATE;

-- Indexes para core_locations
CREATE INDEX IF NOT EXISTS idx_core_locations_external_id ON core_locations(external_id);
CREATE INDEX IF NOT EXISTS idx_core_locations_location_type ON core_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_core_locations_name ON core_locations(name);

-- Indexes para core_suppliers
CREATE INDEX IF NOT EXISTS idx_core_suppliers_external_id ON core_suppliers(external_id);
CREATE INDEX IF NOT EXISTS idx_core_suppliers_trade_name ON core_suppliers(trade_name);
CREATE INDEX IF NOT EXISTS idx_core_suppliers_cnpj ON core_suppliers(cnpj) WHERE cnpj IS NOT NULL;

-- Index para busca textual em fornecedores
CREATE INDEX IF NOT EXISTS idx_core_suppliers_trade_name_gin ON core_suppliers USING gin(to_tsvector('portuguese', trade_name));

-- ================================================
-- 5. INDEXES PARA OPERAÇÕES (PEDIDOS/DOCUMENTOS)
-- ================================================

-- Indexes para core_orders
CREATE INDEX IF NOT EXISTS idx_core_orders_external_id ON core_orders(external_id);
CREATE INDEX IF NOT EXISTS idx_core_orders_supplier_id ON core_orders(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_orders_origin_location ON core_orders(origin_location_id) WHERE origin_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_orders_dest_location ON core_orders(dest_location_id) WHERE dest_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_orders_order_type ON core_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_core_orders_status ON core_orders(status);
CREATE INDEX IF NOT EXISTS idx_core_orders_issue_timestamp ON core_orders(issue_timestamp);

-- Index composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_core_orders_status_type_date ON core_orders(status, order_type, issue_timestamp);

-- Indexes para core_order_items
CREATE INDEX IF NOT EXISTS idx_core_order_items_order_id ON core_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_core_order_items_variant_id ON core_order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_core_order_items_item_seq ON core_order_items(order_id, item_seq);

-- Indexes para core_documents
CREATE INDEX IF NOT EXISTS idx_core_documents_external_id ON core_documents(external_id);
CREATE INDEX IF NOT EXISTS idx_core_documents_order_id ON core_documents(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_documents_origin_location ON core_documents(origin_location_id) WHERE origin_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_documents_dest_location ON core_documents(dest_location_id) WHERE dest_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_core_documents_doc_type ON core_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_core_documents_status ON core_documents(status);
CREATE INDEX IF NOT EXISTS idx_core_documents_issue_date ON core_documents(issue_date);

-- Index composto para documentos
CREATE INDEX IF NOT EXISTS idx_core_documents_status_type_date ON core_documents(status, doc_type, issue_date);

-- Indexes para core_document_items
CREATE INDEX IF NOT EXISTS idx_core_document_items_document_id ON core_document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_core_document_items_variant_id ON core_document_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_core_document_items_item_seq ON core_document_items(document_id, item_seq);

-- ================================================
-- 6. INDEXES PARA MOVIMENTAÇÕES E ESTOQUE
-- ================================================

-- Indexes para core_movements (performance crítica)
CREATE INDEX IF NOT EXISTS idx_core_movements_variant_id ON core_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_core_movements_location_id ON core_movements(location_id);
CREATE INDEX IF NOT EXISTS idx_core_movements_movement_type ON core_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_core_movements_movement_ts ON core_movements(movement_ts);
CREATE INDEX IF NOT EXISTS idx_core_movements_reference_id ON core_movements(reference_id) WHERE reference_id IS NOT NULL;

-- Indexes compostos para queries de movimentação
CREATE INDEX IF NOT EXISTS idx_core_movements_variant_location_date ON core_movements(variant_id, location_id, movement_ts);
CREATE INDEX IF NOT EXISTS idx_core_movements_location_type_date ON core_movements(location_id, movement_type, movement_ts);

-- Indexes para core_events
CREATE INDEX IF NOT EXISTS idx_core_events_entity_type ON core_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_core_events_entity_id ON core_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_core_events_event_type ON core_events(event_type);
CREATE INDEX IF NOT EXISTS idx_core_events_event_ts ON core_events(event_ts);

-- Index composto para eventos
CREATE INDEX IF NOT EXISTS idx_core_events_entity_type_id_ts ON core_events(entity_type, entity_id, event_ts);

-- Indexes para core_inventory_snapshots (performance crítica)
CREATE INDEX IF NOT EXISTS idx_core_inventory_variant_id ON core_inventory_snapshots(variant_id);
CREATE INDEX IF NOT EXISTS idx_core_inventory_location_id ON core_inventory_snapshots(location_id);
CREATE INDEX IF NOT EXISTS idx_core_inventory_snapshot_ts ON core_inventory_snapshots(snapshot_ts);

-- Index composto para snapshots atuais
CREATE INDEX IF NOT EXISTS idx_core_inventory_variant_location_ts ON core_inventory_snapshots(variant_id, location_id, snapshot_ts DESC);

-- Index para busca de estoque atual
CREATE INDEX IF NOT EXISTS idx_core_inventory_current ON core_inventory_snapshots(variant_id, location_id) 
WHERE snapshot_ts >= CURRENT_DATE - INTERVAL '1 day';

-- ================================================
-- 7. INDEXES PARA TABELAS ANALÍTICAS
-- ================================================

-- Indexes para forecast_sales
CREATE INDEX IF NOT EXISTS idx_forecast_sales_variant_location ON forecast_sales(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_forecast_sales_forecast_date ON forecast_sales(forecast_date);
CREATE INDEX IF NOT EXISTS idx_forecast_sales_horizon ON forecast_sales(forecast_horizon_days);
CREATE INDEX IF NOT EXISTS idx_forecast_sales_variant_date_horizon ON forecast_sales(variant_id, forecast_date, forecast_horizon_days);

-- Indexes para projected_coverage
CREATE INDEX IF NOT EXISTS idx_projected_coverage_variant_location ON projected_coverage(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_projected_coverage_analysis_date ON projected_coverage(analysis_date);
CREATE INDEX IF NOT EXISTS idx_projected_coverage_risk_level ON projected_coverage(risk_level);
CREATE INDEX IF NOT EXISTS idx_projected_coverage_stockout_date ON projected_coverage(projected_stockout_date) WHERE projected_stockout_date IS NOT NULL;

-- Indexes para abc_analysis
CREATE INDEX IF NOT EXISTS idx_abc_analysis_variant_location ON abc_analysis(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_analysis_date ON abc_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_abc_category ON abc_analysis(abc_category);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_priority_score ON abc_analysis(priority_score DESC);

-- Indexes para supplier_metrics
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_supplier_id ON supplier_metrics(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_analysis_period ON supplier_metrics(analysis_period_start, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_performance_score ON supplier_metrics(performance_score DESC);

-- Indexes para delivery_tracking
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_supplier_id ON delivery_tracking(supplier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery_status ON delivery_tracking(delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_expected_date ON delivery_tracking(expected_delivery_date) WHERE expected_delivery_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_actual_date ON delivery_tracking(actual_delivery_date) WHERE actual_delivery_date IS NOT NULL;

-- Indexes para price_simulations
CREATE INDEX IF NOT EXISTS idx_price_simulations_variant_id ON price_simulations(variant_id);
CREATE INDEX IF NOT EXISTS idx_price_simulations_location_id ON price_simulations(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_price_simulations_created_by ON price_simulations(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_price_simulations_simulation_date ON price_simulations(simulation_date);

-- Indexes para price_elasticity
CREATE INDEX IF NOT EXISTS idx_price_elasticity_variant_location ON price_elasticity(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_price_elasticity_analysis_period ON price_elasticity(analysis_period_start, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_price_elasticity_coefficient ON price_elasticity(price_elasticity_coefficient);

-- Indexes para dynamic_safety_stock
CREATE INDEX IF NOT EXISTS idx_dynamic_safety_stock_variant_location ON dynamic_safety_stock(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_safety_stock_analysis_date ON dynamic_safety_stock(analysis_date);

-- Indexes para promotion_recommendations
CREATE INDEX IF NOT EXISTS idx_promotion_recommendations_variant_location ON promotion_recommendations(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_promotion_recommendations_analysis_date ON promotion_recommendations(analysis_date);
CREATE INDEX IF NOT EXISTS idx_promotion_recommendations_reason_code ON promotion_recommendations(reason_code);
CREATE INDEX IF NOT EXISTS idx_promotion_recommendations_status ON promotion_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_promotion_recommendations_priority_score ON promotion_recommendations(priority_score DESC);

-- Indexes para analytics_config
CREATE INDEX IF NOT EXISTS idx_analytics_config_organization_id ON analytics_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_config_config_type ON analytics_config(config_type);
CREATE INDEX IF NOT EXISTS idx_analytics_config_org_type_key ON analytics_config(organization_id, config_type, config_key);

-- Indexes para metrics_cache
CREATE INDEX IF NOT EXISTS idx_metrics_cache_cache_key ON metrics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_metric_type ON metrics_cache(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires_at ON metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_created_at ON metrics_cache(created_at);

-- Index para limpeza de cache expirado
CREATE INDEX IF NOT EXISTS idx_metrics_cache_expired ON metrics_cache(expires_at) WHERE expires_at < NOW();

-- ================================================
-- 8. INDEXES PARA TABELAS MART (DASHBOARD)
-- ================================================

-- Indexes para mart_stagnant_products
CREATE INDEX IF NOT EXISTS idx_mart_stagnant_analysis_date ON mart_stagnant_products(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_stagnant_variant_location ON mart_stagnant_products(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_mart_stagnant_days_without_movement ON mart_stagnant_products(days_without_movement DESC);
CREATE INDEX IF NOT EXISTS idx_mart_stagnant_suggested_action ON mart_stagnant_products(suggested_action);

-- Indexes para mart_replenishment_alerts
CREATE INDEX IF NOT EXISTS idx_mart_replenishment_analysis_date ON mart_replenishment_alerts(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_replenishment_variant_location ON mart_replenishment_alerts(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_mart_replenishment_priority_level ON mart_replenishment_alerts(priority_level);
CREATE INDEX IF NOT EXISTS idx_mart_replenishment_coverage_days ON mart_replenishment_alerts(coverage_days);

-- Indexes para mart_inventory_divergences
CREATE INDEX IF NOT EXISTS idx_mart_inventory_divergences_analysis_date ON mart_inventory_divergences(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_inventory_divergences_variant_location ON mart_inventory_divergences(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_mart_inventory_divergences_severity ON mart_inventory_divergences(severity);
CREATE INDEX IF NOT EXISTS idx_mart_inventory_divergences_difference_pct ON mart_inventory_divergences(difference_percentage DESC);

-- Indexes para mart_margin_alerts
CREATE INDEX IF NOT EXISTS idx_mart_margin_alerts_analysis_date ON mart_margin_alerts(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_margin_alerts_variant_id ON mart_margin_alerts(variant_id);
CREATE INDEX IF NOT EXISTS idx_mart_margin_alerts_current_margin ON mart_margin_alerts(current_margin_pct);

-- Indexes para mart_return_spike_alerts
CREATE INDEX IF NOT EXISTS idx_mart_return_spike_analysis_date ON mart_return_spike_alerts(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_return_spike_variant_location ON mart_return_spike_alerts(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_mart_return_spike_increase_pct ON mart_return_spike_alerts(increase_percentage DESC);

-- Indexes para mart_redistribution_suggestions
CREATE INDEX IF NOT EXISTS idx_mart_redistribution_analysis_date ON mart_redistribution_suggestions(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_redistribution_variant_id ON mart_redistribution_suggestions(variant_id);
CREATE INDEX IF NOT EXISTS idx_mart_redistribution_source_location ON mart_redistribution_suggestions(source_location_id);
CREATE INDEX IF NOT EXISTS idx_mart_redistribution_target_location ON mart_redistribution_suggestions(target_location_id);
CREATE INDEX IF NOT EXISTS idx_mart_redistribution_priority_score ON mart_redistribution_suggestions(priority_score DESC);

-- Indexes para mart_daily_summary
CREATE INDEX IF NOT EXISTS idx_mart_daily_summary_analysis_date ON mart_daily_summary(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mart_daily_summary_critical_alerts ON mart_daily_summary(critical_alerts DESC);

-- ================================================
-- 9. INDEXES ESPECIAIS PARA SEGURANÇA
-- ================================================

-- Index para detectar tentativas de login suspeitas
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_login ON audit_logs(ip_address, action_timestamp) 
WHERE action_type = 'login_failed';

-- Index para monitorar atividades de admin
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_actions ON audit_logs(actor_user_id, action_type, action_timestamp)
WHERE action_type IN ('user_created', 'user_deleted', 'role_changed', 'permission_granted');

-- Index para sessões suspeitas (múltiplos IPs)
CREATE INDEX IF NOT EXISTS idx_user_sessions_security_monitoring ON user_sessions(user_id, ip_address, created_at);

-- Index para dispositivos não reconhecidos
CREATE INDEX IF NOT EXISTS idx_user_known_devices_trust_level ON user_known_devices(user_id, is_trusted, last_used_at);

-- ================================================
-- 10. INDEXES PARA PERFORMANCE DE QUERIES COMUNS
-- ================================================

-- Index para dashboard principal (produtos mais vendidos)
CREATE INDEX IF NOT EXISTS idx_core_movements_sales_performance ON core_movements(variant_id, movement_ts, qty_moved) 
WHERE movement_type = 'SALE' AND movement_ts >= CURRENT_DATE - INTERVAL '30 days';

-- Index para análise de estoque baixo
CREATE INDEX IF NOT EXISTS idx_core_inventory_low_stock ON core_inventory_snapshots(location_id, qty_on_hand, snapshot_ts) 
WHERE qty_on_hand <= 10 AND snapshot_ts >= CURRENT_DATE - INTERVAL '1 day';

-- Index para produtos sem movimento (estagnados)
CREATE INDEX IF NOT EXISTS idx_core_movements_no_movement ON core_movements(variant_id, location_id, movement_ts DESC);

-- Index para análise de fornecedores (lead time)
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_lead_time ON delivery_tracking(supplier_id, lead_time_days, actual_delivery_date) 
WHERE actual_delivery_date IS NOT NULL;

-- ================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================

COMMENT ON INDEX idx_profiles_user_id_security IS 'Index crítico para autenticação - performance de login';
COMMENT ON INDEX idx_audit_logs_actor_user_id IS 'Index para auditoria - rastreamento de ações por usuário';
COMMENT ON INDEX idx_core_inventory_variant_location_ts IS 'Index composto para consultas de estoque atual';
COMMENT ON INDEX idx_core_movements_sales_performance IS 'Index para dashboard - produtos mais vendidos';
COMMENT ON INDEX idx_audit_logs_failed_login IS 'Index de segurança - detecção de tentativas de login suspeitas';

-- ================================================
-- 12. VERIFICAÇÃO DOS INDEXES CRIADOS
-- ================================================

-- Query para verificar todos os indexes criados
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
*/

-- Query para verificar tamanho dos indexes
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
*/

-- Query para verificar uso dos indexes
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/ 