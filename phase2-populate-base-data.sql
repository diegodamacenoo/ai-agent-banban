-- ========================================
-- FASE 2: POPULAR DADOS BASE 
-- Data: 2025-07-12 (Corrigido)
-- Objetivo: Inserir módulos base e implementações padrão com sintaxe corrigida.
-- ========================================

-- Registrar início da população de dados
INSERT INTO migration_log (migration_step, status, notes) 
VALUES ('PHASE2_POPULATE_START', 'STARTED', 'Iniciando população dos dados base');

-- ========================================
-- 1. INSERIR MÓDULOS BASE
-- ========================================

INSERT INTO base_modules (slug, name, description, category) VALUES
('performance', 'Performance Analytics', 'Dashboard de performance e métricas de KPIs', 'analytics'),
('insights', 'Smart Insights', 'Intelligence e relatórios automatizados com análises inteligentes', 'intelligence'),
('alerts', 'Alert Management', 'Sistema de alertas e notificações em tempo real', 'monitoring'),
('inventory', 'Inventory Management', 'Gestão e controle de estoque com análises avançadas', 'operations'),
('analytics', 'General Analytics', 'Análises gerais e dashboards estatísticos', 'analytics');

-- Verificar inserção dos módulos base
DO $$
DECLARE
    inserted_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inserted_count FROM base_modules;
    
    INSERT INTO migration_log (migration_step, status, notes)
    VALUES ('PHASE2_BASE_MODULES_INSERTED', 'SUCCESS', 'Inseridos ' || inserted_count || ' módulos base');
END $$;

-- ========================================
-- 2. INSERIR IMPLEMENTAÇÕES PADRÃO (STANDARD)
-- ========================================

INSERT INTO module_implementations (
    base_module_id, 
    implementation_key, 
    display_name, 
    component_path, 
    target_audience,
    complexity_tier,
    is_default
) 
SELECT 
    bm.id,
    'standard',
    'Standard ' || bm.name,
    '/implementations/Standard' || REPLACE(INITCAP(bm.slug), '-', '') || 'Implementation',
    'generic',
    'standard',
    true
FROM base_modules bm;

-- Verificar inserção das implementações padrão
DO $$
DECLARE
    impl_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO impl_count 
    FROM module_implementations 
    WHERE implementation_key = 'standard';
    
    INSERT INTO migration_log (migration_step, status, notes)
    VALUES ('PHASE2_STANDARD_IMPLEMENTATIONS', 'SUCCESS', 'Inseridas ' || impl_count || ' implementações padrão');
END $$;

-- ========================================
-- 3. INSERIR IMPLEMENTAÇÕES BANBAN 
-- ========================================

INSERT INTO module_implementations (
    base_module_id, 
    implementation_key, 
    display_name, 
    component_path, 
    target_audience,
    complexity_tier,
    is_default
) VALUES
((SELECT id FROM base_modules WHERE slug = 'performance'), 'banban', 'Banban Performance Fashion', '/implementations/BanbanPerformanceImplementation', 'client-specific', 'advanced', false),
((SELECT id FROM base_modules WHERE slug = 'insights'), 'banban', 'Banban Smart Insights', '/implementations/BanbanInsightsImplementation', 'client-specific', 'advanced', false),
((SELECT id FROM base_modules WHERE slug = 'analytics'), 'banban', 'Banban Analytics Fashion', '/implementations/BanbanAnalyticsImplementation', 'client-specific', 'advanced', false),
((SELECT id FROM base_modules WHERE slug = 'alerts'), 'banban', 'Banban Alerts Manager', '/implementations/BanbanAlertsImplementation', 'client-specific', 'standard', false),
((SELECT id FROM base_modules WHERE slug = 'inventory'), 'banban', 'Banban Inventory Analytics', '/implementations/BanbanInventoryImplementation', 'client-specific', 'advanced', false);

-- Verificar inserção das implementações Banban
DO $$
DECLARE
    banban_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO banban_count 
    FROM module_implementations 
    WHERE implementation_key = 'banban';
    
    INSERT INTO migration_log (migration_step, status, notes)
    VALUES ('PHASE2_BANBAN_IMPLEMENTATIONS', 'SUCCESS', 'Inseridas ' || banban_count || ' implementações Banban');
END $$;

-- ========================================
-- 4. INSERIR IMPLEMENTAÇÕES ENTERPRISE
-- ========================================

INSERT INTO module_implementations (
    base_module_id, 
    implementation_key, 
    display_name, 
    component_path, 
    target_audience,
    complexity_tier,
    is_default
) 
SELECT 
    bm.id,
    'enterprise',
    'Enterprise ' || bm.name,
    '/implementations/Enterprise' || REPLACE(INITCAP(bm.slug), '-', '') || 'Implementation',
    'enterprise',
    'enterprise',
    false
FROM base_modules bm;

-- Verificar inserção das implementações Enterprise
DO $$
DECLARE
    enterprise_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO enterprise_count 
    FROM module_implementations 
    WHERE implementation_key = 'enterprise';
    
    INSERT INTO migration_log (migration_step, status, notes)
    VALUES ('PHASE2_ENTERPRISE_IMPLEMENTATIONS', 'SUCCESS', 'Inseridas ' || enterprise_count || ' implementações Enterprise');
END $$;

-- ========================================
-- 5. VALIDAÇÕES E VERIFICAÇÕES
-- ========================================

DO $$
DECLARE
    base_modules_count INTEGER;
    implementations_count INTEGER;
    expected_implementations INTEGER;
BEGIN
    SELECT COUNT(*) INTO base_modules_count FROM base_modules;
    SELECT COUNT(*) INTO implementations_count FROM module_implementations;
    expected_implementations := base_modules_count * 3;
    
    IF implementations_count = expected_implementations THEN
        INSERT INTO migration_log (migration_step, status, notes)
        VALUES ('PHASE2_DATA_VALIDATION', 'SUCCESS', 'Validação OK: ' || base_modules_count || ' módulos base e ' || implementations_count || ' implementações (' || expected_implementations || ' esperadas)');
    ELSE
        INSERT INTO migration_log (migration_step, status, notes)
        VALUES ('PHASE2_DATA_VALIDATION', 'WARNING', 'Validação: ' || base_modules_count || ' módulos base, ' || implementations_count || ' implementações, esperadas: ' || expected_implementations);
    END IF;
END $$;

-- ========================================
-- 6. CRIAR DADOS DE EXEMPLO PARA TESTES
-- ========================================

DO $$
DECLARE
    banban_org_id UUID;
BEGIN
    SELECT id INTO banban_org_id 
    FROM organizations 
    WHERE slug = 'banban' OR company_trading_name ILIKE '%banban%' OR company_legal_name ILIKE '%banban%'
    LIMIT 1;
    
    IF banban_org_id IS NOT NULL THEN
        INSERT INTO tenant_module_assignments (tenant_id, base_module_id, implementation_id, custom_config) VALUES 
        (banban_org_id, (SELECT id FROM base_modules WHERE slug = 'performance'), (SELECT id FROM module_implementations WHERE implementation_key = 'banban' AND base_module_id = (SELECT id FROM base_modules WHERE slug = 'performance')), '{"theme": "banban", "specialization": "fashion", "advanced_features": true}'::jsonb),
        (banban_org_id, (SELECT id FROM base_modules WHERE slug = 'insights'), (SELECT id FROM module_implementations WHERE implementation_key = 'banban' AND base_module_id = (SELECT id FROM base_modules WHERE slug = 'insights')), '{"enabled": true, "features": ["dashboard", "analytics", "reports"]}'::jsonb);
        
        INSERT INTO migration_log (migration_step, status, notes) VALUES ('PHASE2_SAMPLE_ASSIGNMENTS', 'SUCCESS', 'Criados assignments de exemplo para organização Banban: ' || banban_org_id);
    ELSE
        INSERT INTO migration_log (migration_step, status, notes) VALUES ('PHASE2_SAMPLE_ASSIGNMENTS', 'SKIPPED', 'Organização Banban não encontrada, pulando criação de assignments de exemplo');
    END IF;
END $$;

-- ========================================
-- 7. VERIFICAÇÃO FINAL E RELATÓRIO
-- ========================================

DO $$
DECLARE
    summary_report TEXT;
BEGIN
    SELECT INTO summary_report
        'RELATÓRIO FINAL FASE 2:' || E'\n' ||
        '========================' || E'\n' ||
        'Módulos Base: ' || (SELECT COUNT(*) FROM base_modules) || E'\n' ||
        'Implementações Total: ' || (SELECT COUNT(*) FROM module_implementations) || E'\n' ||
        '  - Standard: ' || (SELECT COUNT(*) FROM module_implementations WHERE implementation_key = 'standard') || E'\n' ||
        '  - Banban: ' || (SELECT COUNT(*) FROM module_implementations WHERE implementation_key = 'banban') || E'\n' ||
        '  - Enterprise: ' || (SELECT COUNT(*) FROM module_implementations WHERE implementation_key = 'enterprise') || E'\n' ||
        'Assignments: ' || (SELECT COUNT(*) FROM tenant_module_assignments) || E'\n' ||
        'Views Criadas: 2' || E'\n' ||
        'Funções Helper: 2';
    
    INSERT INTO migration_log (migration_step, status, notes)
    VALUES ('PHASE2_COMPLETE', 'SUCCESS', summary_report);
END $$;

-- ========================================
-- 8. QUERIES DE VERIFICAÇÃO PARA DEBUG
-- ========================================

-- Query para ver todos os módulos com implementações
-- SELECT * FROM v_modules_with_implementations ORDER BY module_category, module_slug, implementation_key;

-- Query para ver assignments
-- SELECT * FROM v_tenant_module_assignments_full;

-- Query para testar função helper
-- SELECT * FROM get_default_module_implementation('performance');
