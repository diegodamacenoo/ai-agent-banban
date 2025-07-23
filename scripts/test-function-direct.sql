-- Teste direto da função - verificar valores exatos
-- Execute no Supabase Dashboard

-- Testar com organização banban-fashion
SELECT 
    module_slug,
    module_name,
    can_view,
    can_access,
    status,
    implementation_key,
    component_path,
    -- Debug dos valores originais
    'Debug info:' as separator,
    assignment_id::text as debug_assignment_id,
    CASE WHEN custom_config IS NULL THEN 'NULL' ELSE 'NOT NULL' END as debug_config,
    CASE WHEN component_path = '' THEN 'EMPTY' ELSE 'NOT EMPTY' END as debug_path
FROM get_user_visible_modules('2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4')
ORDER BY module_slug;