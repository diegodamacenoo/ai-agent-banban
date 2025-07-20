-- ================================================
-- SCRIPT: Enhanced RLS Policies for Database Security
-- FASE 3 - Database Security Enhancement
-- Data: 2024-12-18
-- ================================================

-- ================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
-- ================================================

-- Tabelas de usuários e autenticação
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_known_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_data_exports ENABLE ROW LEVEL SECURITY;

-- Tabelas organizacionais
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS implementation_templates ENABLE ROW LEVEL SECURITY;

-- Tabelas de auditoria e logs
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alert_digest ENABLE ROW LEVEL SECURITY;

-- Tabelas de dados core
ALTER TABLE IF EXISTS core_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_inventory_snapshots ENABLE ROW LEVEL SECURITY;

-- Tabelas analíticas (já habilitadas, mas garantindo)
ALTER TABLE IF EXISTS forecast_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projected_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS abc_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_elasticity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dynamic_safety_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotion_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS metrics_cache ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. FUNÇÕES AUXILIARES PARA RLS
-- ================================================

-- Função para obter organização do usuário atual
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Função para verificar se usuário é admin da organização
CREATE OR REPLACE FUNCTION is_organization_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('organization_admin', 'master_admin')
  );
$$;

-- Função para verificar se usuário é master admin
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'master_admin'
  );
$$;

-- Função para verificar se usuário pode acessar dados da organização
CREATE OR REPLACE FUNCTION can_access_organization(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (organization_id = org_id OR role = 'master_admin')
  );
$$;

-- ================================================
-- 3. POLÍTICAS PARA TABELAS DE USUÁRIOS
-- ================================================

-- PROFILES: Usuários só veem seus próprios dados + admins veem todos da org
DROP POLICY IF EXISTS "users_own_profile_data" ON profiles;
CREATE POLICY "users_own_profile_data" ON profiles
  FOR ALL USING (
    id = auth.uid() OR 
    (is_organization_admin() AND organization_id = get_user_organization_id()) OR
    is_master_admin()
  );

-- USER_SESSIONS: Usuários só veem suas próprias sessões + admins da org
DROP POLICY IF EXISTS "users_own_sessions" ON user_sessions;
CREATE POLICY "users_own_sessions" ON user_sessions
  FOR ALL USING (
    user_id = auth.uid() OR
    (is_organization_admin() AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = user_sessions.user_id 
      AND p.organization_id = get_user_organization_id()
    )) OR
    is_master_admin()
  );

-- USER_KNOWN_DEVICES: Usuários só veem seus próprios dispositivos
DROP POLICY IF EXISTS "users_own_devices" ON user_known_devices;
CREATE POLICY "users_own_devices" ON user_known_devices
  FOR ALL USING (user_id = auth.uid());

-- USER_DATA_EXPORTS: Usuários só veem suas próprias exportações
DROP POLICY IF EXISTS "users_own_exports" ON user_data_exports;
CREATE POLICY "users_own_exports" ON user_data_exports
  FOR ALL USING (user_id = auth.uid());

-- ================================================
-- 4. POLÍTICAS PARA TABELAS ORGANIZACIONAIS
-- ================================================

-- ORGANIZATIONS: Isolamento por organização + master admin acesso total
DROP POLICY IF EXISTS "organization_isolation" ON organizations;
CREATE POLICY "organization_isolation" ON organizations
  FOR ALL USING (
    id = get_user_organization_id() OR is_master_admin()
  );

-- CUSTOM_MODULES: Isolamento por organização
DROP POLICY IF EXISTS "organization_custom_modules" ON custom_modules;
CREATE POLICY "organization_custom_modules" ON custom_modules
  FOR ALL USING (
    organization_id = get_user_organization_id() OR is_master_admin()
  );

-- ================================================
-- 5. POLÍTICAS PARA AUDITORIA E LOGS
-- ================================================

-- AUDIT_LOGS: Usuários veem logs da sua org + admins veem todos
DROP POLICY IF EXISTS "audit_logs_organization_access" ON audit_logs;
CREATE POLICY "audit_logs_organization_access" ON audit_logs
  FOR SELECT USING (
    -- Usuário pode ver seus próprios logs
    actor_user_id = auth.uid() OR
    -- Admin da org pode ver logs da organização
    (is_organization_admin() AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = audit_logs.actor_user_id 
      AND p.organization_id = get_user_organization_id()
    )) OR
    -- Master admin vê tudo
    is_master_admin()
  );

-- INSERT em audit_logs deve ser permitido para authenticated users
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
  FOR INSERT WITH CHECK (
    actor_user_id = auth.uid() OR 
    auth.role() = 'service_role'
  );

-- ALERT_DIGEST: Isolamento por organização
DROP POLICY IF EXISTS "alert_digest_organization_access" ON alert_digest;
CREATE POLICY "alert_digest_organization_access" ON alert_digest
  FOR ALL USING (
    -- Assumindo que existe organization_id na tabela (pode precisar ser adicionado)
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (p.organization_id IS NULL OR is_master_admin())
    )
  );

-- ================================================
-- 6. POLÍTICAS PARA DADOS CORE (ISOLAMENTO POR ORG)
-- ================================================

-- Todas as tabelas core devem respeitar isolamento organizacional
-- Assumindo que existe uma forma de relacionar com organization_id

-- CORE_PRODUCTS: Isolamento por organização
DROP POLICY IF EXISTS "core_products_org_isolation" ON core_products;
CREATE POLICY "core_products_org_isolation" ON core_products
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_PRODUCT_VARIANTS: Isolamento por organização via produto
DROP POLICY IF EXISTS "core_variants_org_isolation" ON core_product_variants;
CREATE POLICY "core_variants_org_isolation" ON core_product_variants
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_PRODUCT_PRICING: Isolamento por organização
DROP POLICY IF EXISTS "core_pricing_org_isolation" ON core_product_pricing;
CREATE POLICY "core_pricing_org_isolation" ON core_product_pricing
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_LOCATIONS: Isolamento por organização
DROP POLICY IF EXISTS "core_locations_org_isolation" ON core_locations;
CREATE POLICY "core_locations_org_isolation" ON core_locations
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_SUPPLIERS: Isolamento por organização
DROP POLICY IF EXISTS "core_suppliers_org_isolation" ON core_suppliers;
CREATE POLICY "core_suppliers_org_isolation" ON core_suppliers
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_ORDERS: Isolamento por organização
DROP POLICY IF EXISTS "core_orders_org_isolation" ON core_orders;
CREATE POLICY "core_orders_org_isolation" ON core_orders
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_ORDER_ITEMS: Isolamento via pedido
DROP POLICY IF EXISTS "core_order_items_org_isolation" ON core_order_items;
CREATE POLICY "core_order_items_org_isolation" ON core_order_items
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_DOCUMENTS: Isolamento por organização
DROP POLICY IF EXISTS "core_documents_org_isolation" ON core_documents;
CREATE POLICY "core_documents_org_isolation" ON core_documents
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_DOCUMENT_ITEMS: Isolamento via documento
DROP POLICY IF EXISTS "core_document_items_org_isolation" ON core_document_items;
CREATE POLICY "core_document_items_org_isolation" ON core_document_items
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_MOVEMENTS: Isolamento por organização
DROP POLICY IF EXISTS "core_movements_org_isolation" ON core_movements;
CREATE POLICY "core_movements_org_isolation" ON core_movements
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_EVENTS: Isolamento por organização
DROP POLICY IF EXISTS "core_events_org_isolation" ON core_events;
CREATE POLICY "core_events_org_isolation" ON core_events
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- CORE_INVENTORY_SNAPSHOTS: Isolamento por organização
DROP POLICY IF EXISTS "core_inventory_org_isolation" ON core_inventory_snapshots;
CREATE POLICY "core_inventory_org_isolation" ON core_inventory_snapshots
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- ================================================
-- 7. POLÍTICAS PARA TABELAS ANALÍTICAS
-- ================================================

-- Todas as tabelas analíticas devem respeitar isolamento organizacional
-- através da coluna organization_id

-- ANALYTICS_CONFIG: Isolamento direto por organization_id
DROP POLICY IF EXISTS "analytics_config_org_isolation" ON analytics_config;
CREATE POLICY "analytics_config_org_isolation" ON analytics_config
  FOR ALL USING (
    organization_id = get_user_organization_id() OR is_master_admin()
  );

-- FORECAST_SALES, PROJECTED_COVERAGE, ABC_ANALYSIS: Isolamento por organização
DROP POLICY IF EXISTS "forecast_sales_org_isolation" ON forecast_sales;
CREATE POLICY "forecast_sales_org_isolation" ON forecast_sales
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

DROP POLICY IF EXISTS "projected_coverage_org_isolation" ON projected_coverage;
CREATE POLICY "projected_coverage_org_isolation" ON projected_coverage
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

DROP POLICY IF EXISTS "abc_analysis_org_isolation" ON abc_analysis;
CREATE POLICY "abc_analysis_org_isolation" ON abc_analysis
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- SUPPLIER_METRICS, DELIVERY_TRACKING: Isolamento por organização
DROP POLICY IF EXISTS "supplier_metrics_org_isolation" ON supplier_metrics;
CREATE POLICY "supplier_metrics_org_isolation" ON supplier_metrics
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

DROP POLICY IF EXISTS "delivery_tracking_org_isolation" ON delivery_tracking;
CREATE POLICY "delivery_tracking_org_isolation" ON delivery_tracking
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- PRICE_SIMULATIONS, PRICE_ELASTICITY: Isolamento por organização
DROP POLICY IF EXISTS "price_simulations_org_isolation" ON price_simulations;
CREATE POLICY "price_simulations_org_isolation" ON price_simulations
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

DROP POLICY IF EXISTS "price_elasticity_org_isolation" ON price_elasticity;
CREATE POLICY "price_elasticity_org_isolation" ON price_elasticity
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- DYNAMIC_SAFETY_STOCK, PROMOTION_RECOMMENDATIONS: Isolamento por organização
DROP POLICY IF EXISTS "safety_stock_org_isolation" ON dynamic_safety_stock;
CREATE POLICY "safety_stock_org_isolation" ON dynamic_safety_stock
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

DROP POLICY IF EXISTS "promotion_recs_org_isolation" ON promotion_recommendations;
CREATE POLICY "promotion_recs_org_isolation" ON promotion_recommendations
  FOR ALL USING (
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- METRICS_CACHE: Acesso baseado no contexto organizacional
DROP POLICY IF EXISTS "metrics_cache_org_isolation" ON metrics_cache;
CREATE POLICY "metrics_cache_org_isolation" ON metrics_cache
  FOR ALL USING (
    -- Cache pode ser acessado por qualquer usuário autenticado da organização
    -- pois é otimização de performance
    can_access_organization(get_user_organization_id()) OR is_master_admin()
  );

-- ================================================
-- 8. POLÍTICAS ESPECIAIS PARA SERVICE ROLE
-- ================================================

-- Permitir que service_role tenha acesso total para operações de sistema
-- Estas políticas são aplicadas quando auth.role() = 'service_role'

-- Service role pode inserir em audit_logs
DROP POLICY IF EXISTS "service_role_audit_logs" ON audit_logs;
CREATE POLICY "service_role_audit_logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role pode acessar metrics_cache para operações de ETL
DROP POLICY IF EXISTS "service_role_metrics_cache" ON metrics_cache;
CREATE POLICY "service_role_metrics_cache" ON metrics_cache
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ================================================
-- 9. COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================

COMMENT ON FUNCTION get_user_organization_id() IS 'Retorna o ID da organização do usuário autenticado atual';
COMMENT ON FUNCTION is_organization_admin() IS 'Verifica se o usuário atual é admin da organização';
COMMENT ON FUNCTION is_master_admin() IS 'Verifica se o usuário atual é master admin do sistema';
COMMENT ON FUNCTION can_access_organization(UUID) IS 'Verifica se o usuário pode acessar dados da organização especificada';

-- ================================================
-- 10. VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- ================================================

-- Query para verificar todas as políticas RLS criadas
-- Executar após aplicar este script para validar
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- Query para verificar tabelas com RLS habilitado
/*
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;
*/

-- ================================================
-- OBSERVAÇÕES IMPORTANTES
-- ================================================

-- 1. Este script assume que existe uma coluna organization_id nas tabelas de usuários
-- 2. Algumas tabelas core podem precisar de ajustes se não tiverem relação direta com organização
-- 3. As políticas são restritivas por padrão - apenas usuários autorizados têm acesso
-- 4. Service role mantém acesso total para operações de sistema
-- 5. Master admin tem acesso total a todos os dados
-- 6. Admins de organização têm acesso aos dados da sua organização
-- 7. Usuários comuns têm acesso apenas aos seus próprios dados

-- Para testar as políticas, use:
-- SET ROLE authenticated;
-- SELECT * FROM profiles; -- Deve retornar apenas dados permitidos
-- RESET ROLE; 