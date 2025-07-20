-- Arquivo: scripts/analysis/verify-tenant-module-status.sql
-- Descrição: Verifica o estado operacional de todos os módulos para uma organização específica.
-- Versão 2 (Simplificada) - Compatível com o SQL Editor do Supabase.

-- Instruções:
-- 1. Substitua o UUID '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4' pelo ID da organização que você está depurando, se for diferente.
-- 2. Execute esta consulta diretamente no SQL Editor do Supabase.

SELECT
    tm.organization_id,
    tm.module_id,
    cm.slug AS module_slug,
    cm.name AS module_name,
    tm.operational_status,
    tm.is_visible,
    tm.installed_at,
    tm.last_accessed_at
FROM
    public.tenant_modules tm
JOIN
    public.core_modules cm ON tm.module_id = cm.id
WHERE
    tm.organization_id = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';