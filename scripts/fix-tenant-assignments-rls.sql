-- Script para corrigir política RLS da tenant_module_assignments
-- Execute este script no Supabase Dashboard ou via CLI

-- Verificar política atual
SELECT 
    policyname,
    cmd as command,
    qual as condition
FROM pg_policies 
WHERE tablename = 'tenant_module_assignments' 
  AND policyname = 'tenant_assignments_select_policy';

-- Remover política incorreta
DROP POLICY IF EXISTS "tenant_assignments_select_policy" ON "public"."tenant_module_assignments";

-- Criar nova política seguindo padrão das outras tabelas
CREATE POLICY "tenant_assignments_select_policy" ON "public"."tenant_module_assignments"
AS PERMISSIVE FOR SELECT
TO public
USING (
  (tenant_id = get_user_organization_id()) 
  OR is_master_admin() 
  OR is_service_role()
);

-- Verificar se foi aplicada corretamente
SELECT 
    policyname,
    cmd as command,
    qual as condition
FROM pg_policies 
WHERE tablename = 'tenant_module_assignments' 
  AND policyname = 'tenant_assignments_select_policy';

-- Testar se as funções auxiliares estão funcionando
SELECT 
    get_user_organization_id() as user_org_id,
    is_master_admin() as is_master,
    auth.uid() as current_user;