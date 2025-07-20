-- ========================================
-- FASE 3: QUERIES DE VALIDAÇÃO DA MIGRAÇÃO
-- Data: 2025-07-11
-- Objetivo: Verificar se a migração foi executada corretamente
-- ========================================

-- ========================================
-- 1. COMPARAÇÃO ANTES/DEPOIS DA MIGRAÇÃO
-- ========================================

-- Comparar número de registros
SELECT 
    'COMPARAÇÃO DE REGISTROS' as tipo,
    '=============================' as separador;

SELECT 
    'core_modules (ANTIGO)' as tabela,
    COUNT(*) as registros,
    COUNT(*) FILTER (WHERE is_deleted = false) as ativos
FROM _migration_backup_core_modules
UNION ALL
SELECT 
    'base_modules (NOVO)' as tabela,
    COUNT(*) as registros,
    COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM base_modules
UNION ALL
SELECT 
    'module_implementations (ANTIGO)' as tabela,
    COUNT(*) as registros,
    COUNT(*) FILTER (WHERE is_available = true) as ativos
FROM _migration_backup_module_implementations
UNION ALL
SELECT 
    'module_implementations (NOVO)' as tabela,
    COUNT(*) as registros,
    COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM module_implementations
UNION ALL
SELECT 
    'tenant_modules (ANTIGO)' as tabela,
    COUNT(*) as registros,
    COUNT(*) FILTER (WHERE is_visible = true AND operational_status = 'ENABLED') as ativos
FROM _migration_backup_tenant_modules
UNION ALL
SELECT 
    'tenant_module_assignments (NOVO)' as tabela,
    COUNT(*) as registros,
    COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM tenant_module_assignments;

-- ========================================
-- 2. VERIFICAR MAPEAMENTO DE MÓDULOS
-- ========================================

SELECT 
    E'\n\nMAPEAMENTO DE MÓDULOS' as tipo,
    '=============================' as separador;

-- Verificar se todos os módulos válidos foram migrados
SELECT 
    cm.slug as modulo_antigo,
    cm.name as nome_antigo,
    cm.client_scope,
    cm.is_deleted,
    bm.slug as modulo_novo,
    bm.name as nome_novo,
    CASE 
        WHEN bm.id IS NULL THEN '❌ NÃO MIGRADO'
        ELSE '✅ MIGRADO'
    END as status_migracao
FROM _migration_backup_core_modules cm
LEFT JOIN base_modules bm ON cm.slug = bm.slug
WHERE cm.is_deleted = false
ORDER BY cm.slug;

-- ========================================
-- 3. VERIFICAR IMPLEMENTAÇÕES POR MÓDULO
-- ========================================

SELECT 
    E'\n\nIMPLEMENTAÇÕES POR MÓDULO' as tipo,
    '=============================' as separador;

SELECT 
    bm.slug as modulo,
    bm.name as nome_modulo,
    COUNT(mi.id) as total_implementacoes,
    COUNT(*) FILTER (WHERE mi.implementation_key = 'standard') as standard,
    COUNT(*) FILTER (WHERE mi.implementation_key = 'banban') as banban,
    COUNT(*) FILTER (WHERE mi.implementation_key = 'enterprise') as enterprise,
    COUNT(*) FILTER (WHERE mi.implementation_key LIKE '%-legacy') as legacy,
    COUNT(*) FILTER (WHERE mi.is_default = true) as default_impl
FROM base_modules bm
LEFT JOIN module_implementations mi ON bm.id = mi.base_module_id
GROUP BY bm.id, bm.slug, bm.name
ORDER BY bm.slug;

-- ========================================
-- 4. VERIFICAR ASSIGNMENTS POR TENANT
-- ========================================

SELECT 
    E'\n\nASSIGNMENTS POR TENANT' as tipo,
    '=============================' as separador;

SELECT 
    org.name as organizacao,
    org.slug as org_slug,
    COUNT(tma.base_module_id) as modulos_atribuidos,
    array_agg(bm.slug ORDER BY bm.slug) as modulos,
    array_agg(mi.implementation_key ORDER BY bm.slug) as implementacoes
FROM organizations org
LEFT JOIN tenant_module_assignments tma ON org.id = tma.tenant_id AND tma.is_active = true
LEFT JOIN base_modules bm ON tma.base_module_id = bm.id
LEFT JOIN module_implementations mi ON tma.implementation_id = mi.id
GROUP BY org.id, org.name, org.slug
HAVING COUNT(tma.base_module_id) > 0
ORDER BY org.name;

-- ========================================
-- 5. VERIFICAR CONFIGURAÇÕES CUSTOMIZADAS
-- ========================================

SELECT 
    E'\n\nCONFIGURAÇÕES CUSTOMIZADAS' as tipo,
    '=============================' as separador;

SELECT 
    org.name as organizacao,
    bm.slug as modulo,
    mi.implementation_key,
    tma.custom_config,
    CASE 
        WHEN tma.custom_config = '{}'::jsonb THEN '📝 Configuração Vazia'
        WHEN tma.custom_config ? 'migrated_from' THEN '🔄 Migrado do Sistema Legado'
        ELSE '⚙️ Configuração Customizada'
    END as tipo_config
FROM tenant_module_assignments tma
JOIN organizations org ON tma.tenant_id = org.id
JOIN base_modules bm ON tma.base_module_id = bm.id
JOIN module_implementations mi ON tma.implementation_id = mi.id
WHERE tma.is_active = true
ORDER BY org.name, bm.slug;

-- ========================================
-- 6. VERIFICAR INTEGRIDADE REFERENCIAL
-- ========================================

SELECT 
    E'\n\nVERIFICAÇÃO DE INTEGRIDADE' as tipo,
    '=============================' as separador;

-- Verificar implementações órfãs
SELECT 
    'Implementações sem base_module' as verificacao,
    COUNT(*) as problemas_encontrados
FROM module_implementations mi
LEFT JOIN base_modules bm ON mi.base_module_id = bm.id
WHERE bm.id IS NULL

UNION ALL

-- Verificar assignments órfãos (tenant)
SELECT 
    'Assignments com tenant inexistente' as verificacao,
    COUNT(*) as problemas_encontrados
FROM tenant_module_assignments tma
LEFT JOIN organizations org ON tma.tenant_id = org.id
WHERE org.id IS NULL

UNION ALL

-- Verificar assignments órfãos (base_module)
SELECT 
    'Assignments com base_module inexistente' as verificacao,
    COUNT(*) as problemas_encontrados
FROM tenant_module_assignments tma
LEFT JOIN base_modules bm ON tma.base_module_id = bm.id
WHERE bm.id IS NULL

UNION ALL

-- Verificar assignments órfãos (implementation)
SELECT 
    'Assignments com implementation inexistente' as verificacao,
    COUNT(*) as problemas_encontrados
FROM tenant_module_assignments tma
LEFT JOIN module_implementations mi ON tma.implementation_id = mi.id
WHERE tma.implementation_id IS NOT NULL AND mi.id IS NULL

UNION ALL

-- Verificar módulos sem implementação padrão
SELECT 
    'Módulos sem implementação padrão' as verificacao,
    COUNT(*) as problemas_encontrados
FROM base_modules bm
WHERE NOT EXISTS (
    SELECT 1 FROM module_implementations mi 
    WHERE mi.base_module_id = bm.id AND mi.is_default = true
);

-- ========================================
-- 7. VERIFICAR COMPONENT PATHS
-- ========================================

SELECT 
    E'\n\nVERIFICAÇÃO DE COMPONENT PATHS' as tipo,
    '=============================' as separador;

SELECT 
    bm.slug as modulo,
    mi.implementation_key,
    mi.component_path,
    CASE 
        WHEN mi.component_path ~ '^/implementations/[A-Za-z0-9_-]+$' THEN '✅ Formato Correto'
        ELSE '❌ Formato Incorreto'
    END as validacao_path
FROM base_modules bm
JOIN module_implementations mi ON bm.id = mi.base_module_id
ORDER BY bm.slug, mi.implementation_key;

-- ========================================
-- 8. RELATÓRIO DE COBERTURA
-- ========================================

SELECT 
    E'\n\nRELATÓRIO DE COBERTURA' as tipo,
    '=============================' as separador;

WITH cobertura_modulos AS (
    SELECT 
        bm.slug,
        COUNT(DISTINCT tma.tenant_id) as tenants_usando,
        COUNT(DISTINCT org.id) as total_tenants_sistema
    FROM base_modules bm
    LEFT JOIN tenant_module_assignments tma ON bm.id = tma.base_module_id AND tma.is_active = true
    CROSS JOIN (SELECT COUNT(DISTINCT id) as total FROM organizations) org
    GROUP BY bm.id, bm.slug, org.total
)
SELECT 
    slug as modulo,
    tenants_usando,
    total_tenants_sistema,
    ROUND(
        (tenants_usando::DECIMAL / NULLIF(total_tenants_sistema::DECIMAL, 0)) * 100, 
        2
    ) as percentual_cobertura
FROM cobertura_modulos
ORDER BY percentual_cobertura DESC, slug;

-- ========================================
-- 9. LOG DA MIGRAÇÃO
-- ========================================

SELECT 
    E'\n\nLOG DA MIGRAÇÃO' as tipo,
    '=============================' as separador;

SELECT 
    migration_step,
    status,
    executed_at,
    notes
FROM migration_log
WHERE migration_step LIKE 'PHASE3%'
ORDER BY executed_at DESC;

-- ========================================
-- 10. QUERIES PARA TESTAR FUNÇÕES HELPER
-- ========================================

SELECT 
    E'\n\nTESTE DE FUNÇÕES HELPER' as tipo,
    '=============================' as separador;

-- Testar função de implementação padrão
SELECT 
    'get_default_module_implementation(''performance'')' as funcao,
    implementation_key,
    component_path
FROM get_default_module_implementation('performance');

-- Testar função de implementação por tenant (se houver tenant Banban)
SELECT 
    'get_tenant_module_implementation(banban_org, ''performance'')' as funcao,
    implementation_key,
    component_path,
    custom_config
FROM get_tenant_module_implementation(
    (SELECT id FROM organizations WHERE slug = 'banban' OR name ILIKE '%banban%' LIMIT 1),
    'performance'
);

-- ========================================
-- RESUMO DA VALIDAÇÃO
-- ========================================

/*
CHECKLIST DE VALIDAÇÃO:
======================

✅ Comparar número de registros antes/depois
✅ Verificar mapeamento de módulos antigos → novos
✅ Verificar implementações por módulo
✅ Verificar assignments por tenant
✅ Verificar configurações customizadas
✅ Verificar integridade referencial
✅ Verificar component paths
✅ Calcular cobertura de migração
✅ Revisar log da migração
✅ Testar funções helper

PRÓXIMOS PASSOS:
===============
1. Executar este script de validação
2. Corrigir problemas encontrados (se houver)
3. Confirmar que migração está 100% correta
4. Prosseguir para Fase 4 (Frontend)
*/