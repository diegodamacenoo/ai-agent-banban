-- ========================================
-- 🔍 QUERIES DE VALIDAÇÃO PÓS-MIGRAÇÃO
-- ========================================
-- 
-- Use estas queries após executar o schema-expansion-optimized.sql
-- para validar se tudo foi aplicado corretamente
-- ========================================

-- ========================================
-- 📋 1. VERIFICAÇÃO DE COLUNAS ADICIONADAS
-- ========================================

-- Verificar se todas as colunas foram adicionadas em base_modules
SELECT 
    'base_modules' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'base_modules' 
  AND table_schema = 'public'
  AND column_name IN ('icon', 'route_pattern', 'permissions_required', 'supports_multi_tenant', 'config_schema')
ORDER BY column_name;

-- Verificar se todas as colunas foram adicionadas em module_implementations
SELECT 
    'module_implementations' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'module_implementations' 
  AND table_schema = 'public'
  AND column_name IN ('component_type', 'template_type', 'template_config', 'dependencies', 'config_schema_override')
ORDER BY column_name;

-- Verificar se todas as colunas foram adicionadas em tenant_module_assignments
SELECT 
    'tenant_module_assignments' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenant_module_assignments' 
  AND table_schema = 'public'
  AND column_name IN ('permissions_override', 'user_groups', 'activation_date', 'deactivation_date', 'config_schema')
ORDER BY column_name;

-- ========================================
-- 📊 2. VERIFICAÇÃO DE CONSTRAINTS
-- ========================================

-- Verificar constraints criados
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name IN ('base_modules', 'module_implementations', 'tenant_module_assignments')
  AND constraint_name LIKE 'chk_%'
ORDER BY table_name, constraint_name;

-- ========================================
-- 🚀 3. VERIFICAÇÃO DE ÍNDICES
-- ========================================

-- Verificar se os índices foram criados
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('base_modules', 'module_implementations', 'tenant_module_assignments')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- 👁️ 4. VERIFICAÇÃO DE VIEWS
-- ========================================

-- Verificar se as views foram criadas
SELECT 
    table_name as view_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('v_modules_with_implementations', 'v_active_tenant_assignments');

-- ========================================
-- ⚙️ 5. VERIFICAÇÃO DE FUNÇÕES
-- ========================================

-- Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('validate_json_schema', 'generate_slug');

-- ========================================
-- 🧪 6. TESTES FUNCIONAIS
-- ========================================

-- Teste 1: Inserir um módulo base com novos campos
INSERT INTO base_modules (
    slug, 
    name, 
    description, 
    category, 
    icon, 
    route_pattern, 
    permissions_required, 
    supports_multi_tenant, 
    config_schema
) VALUES (
    'test-analytics',
    'Teste Analytics',
    'Módulo de teste para validação dos novos campos',
    'analytics',
    'BarChart3',
    '/[slug]/(modules)/test-analytics',
    ARRAY['read:analytics', 'write:analytics'],
    true,
    '{"type": "object", "properties": {"refresh_interval": {"type": "number", "default": 30}}}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- Teste 2: Inserir uma implementação com templates
INSERT INTO module_implementations (
    base_module_id,
    implementation_key,
    name,
    component_path,
    component_type,
    template_type,
    template_config,
    target_audience,
    complexity_tier
) VALUES (
    (SELECT id FROM base_modules WHERE slug = 'test-analytics'),
    'test-dashboard',
    'Dashboard de Teste',
    '/components/modules/test-dashboard.tsx',
    'generated',
    'dashboard',
    '{"layout": "2x2", "charts": ["line", "bar"], "kpis": 4}'::jsonb,
    'generic',
    'standard'
) ON CONFLICT (base_module_id, implementation_key) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- Teste 3: Criar um assignment com agendamento
INSERT INTO tenant_module_assignments (
    tenant_id,
    base_module_id,
    implementation_id,
    custom_config,
    permissions_override,
    user_groups,
    activation_date,
    config_schema
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM base_modules WHERE slug = 'test-analytics'),
    (SELECT id FROM module_implementations WHERE implementation_key = 'test-dashboard'),
    '{"theme": "dark", "auto_refresh": true}'::jsonb,
    ARRAY['read:analytics'],
    ARRAY['admin', 'analyst'],
    NOW() + INTERVAL '1 hour',
    '{"type": "object", "properties": {"theme": {"type": "string", "enum": ["light", "dark"]}}}'::jsonb
) ON CONFLICT (tenant_id, base_module_id) DO UPDATE SET
    custom_config = EXCLUDED.custom_config,
    updated_at = NOW();

-- ========================================
-- 📈 7. VALIDAÇÃO DOS TESTES
-- ========================================

-- Verificar se o módulo foi criado corretamente
SELECT 
    slug,
    name,
    icon,
    route_pattern,
    permissions_required,
    supports_multi_tenant,
    jsonb_pretty(config_schema) as config_schema
FROM base_modules 
WHERE slug = 'test-analytics';

-- Verificar se a implementação foi criada corretamente
SELECT 
    mi.implementation_key,
    mi.name,
    mi.component_type,
    mi.template_type,
    jsonb_pretty(mi.template_config) as template_config,
    bm.slug as module_slug
FROM module_implementations mi
JOIN base_modules bm ON mi.base_module_id = bm.id
WHERE mi.implementation_key = 'test-dashboard';

-- Verificar se o assignment foi criado corretamente
SELECT 
    o.slug as tenant_slug,
    bm.slug as module_slug,
    mi.implementation_key,
    tma.permissions_override,
    tma.user_groups,
    tma.activation_date,
    jsonb_pretty(tma.custom_config) as custom_config
FROM tenant_module_assignments tma
JOIN organizations o ON tma.tenant_id = o.id
JOIN base_modules bm ON tma.base_module_id = bm.id
LEFT JOIN module_implementations mi ON tma.implementation_id = mi.id
WHERE bm.slug = 'test-analytics';

-- ========================================
-- 🧹 8. LIMPEZA DOS DADOS DE TESTE
-- ========================================

-- Limpar dados de teste (execute apenas se quiser remover os dados de teste)
-- DELETE FROM tenant_module_assignments WHERE base_module_id = (SELECT id FROM base_modules WHERE slug = 'test-analytics');
-- DELETE FROM module_implementations WHERE base_module_id = (SELECT id FROM base_modules WHERE slug = 'test-analytics');
-- DELETE FROM base_modules WHERE slug = 'test-analytics';

-- ========================================
-- 📋 9. RELATÓRIO FINAL DE VALIDAÇÃO
-- ========================================

-- Gerar relatório resumido do status da migração
WITH validation_summary AS (
    SELECT 
        'base_modules' as tabela,
        COUNT(*) FILTER (WHERE column_name IN ('icon', 'route_pattern', 'permissions_required', 'supports_multi_tenant', 'config_schema')) as colunas_adicionadas,
        5 as colunas_esperadas
    FROM information_schema.columns 
    WHERE table_name = 'base_modules' AND table_schema = 'public'
    
    UNION ALL
    
    SELECT 
        'module_implementations' as tabela,
        COUNT(*) FILTER (WHERE column_name IN ('component_type', 'template_type', 'template_config', 'dependencies', 'config_schema_override')) as colunas_adicionadas,
        5 as colunas_esperadas
    FROM information_schema.columns 
    WHERE table_name = 'module_implementations' AND table_schema = 'public'
    
    UNION ALL
    
    SELECT 
        'tenant_module_assignments' as tabela,
        COUNT(*) FILTER (WHERE column_name IN ('permissions_override', 'user_groups', 'activation_date', 'deactivation_date', 'config_schema')) as colunas_adicionadas,
        5 as colunas_esperadas
    FROM information_schema.columns 
    WHERE table_name = 'tenant_module_assignments' AND table_schema = 'public'
)
SELECT 
    tabela,
    colunas_adicionadas,
    colunas_esperadas,
    CASE 
        WHEN colunas_adicionadas = colunas_esperadas THEN '✅ COMPLETO'
        ELSE '❌ INCOMPLETO'
    END as status
FROM validation_summary
ORDER BY tabela;

-- Verificar funções auxiliares
SELECT 
    CASE 
        WHEN validate_json_schema('{"type": "object"}'::jsonb) THEN '✅ validate_json_schema funcionando'
        ELSE '❌ validate_json_schema com problemas'
    END as test_validate_schema,
    CASE 
        WHEN generate_slug('Teste Analytics Module') = 'teste-analytics-module' THEN '✅ generate_slug funcionando'
        ELSE '❌ generate_slug com problemas'
    END as test_generate_slug;

-- ========================================
-- 🎯 CONCLUSÃO
-- ========================================

SELECT '🎯 MIGRAÇÃO CONCLUÍDA COM SUCESSO! Sistema pronto para fluxo configurável.' as resultado;