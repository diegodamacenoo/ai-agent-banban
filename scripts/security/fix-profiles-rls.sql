-- Script para corrigir as políticas RLS da tabela profiles
BEGIN;

-- Primeiro, remover as políticas existentes
DROP POLICY IF EXISTS "profiles_insert_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_select_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_update_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_delete_policy" ON "public"."profiles";

-- Criar novas políticas
-- Política de SELECT: usuários podem ver seus próprios perfis, perfis da mesma organização, ou master_admin pode ver todos
CREATE POLICY "profiles_select_policy" ON "public"."profiles"
FOR SELECT TO authenticated
USING (
  auth.uid() = id 
  OR organization_id = public.get_user_organization_id() 
  OR public.is_master_admin()
);

-- Política de INSERT: permitir que admins criem perfis para sua organização
CREATE POLICY "profiles_insert_policy" ON "public"."profiles"
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = id AND organization_id IS NULL) -- usuário criando próprio perfil
  OR 
  (public.is_organization_admin() AND organization_id = public.get_user_organization_id()) -- admin criando perfil
  OR
  public.is_master_admin() -- master admin pode criar qualquer perfil
);

-- Política de UPDATE: usuários podem atualizar seus próprios perfis, admins podem atualizar perfis de sua organização
CREATE POLICY "profiles_update_policy" ON "public"."profiles"
FOR UPDATE TO authenticated
USING (
  auth.uid() = id 
  OR (public.is_organization_admin() AND organization_id = public.get_user_organization_id())
  OR public.is_master_admin()
)
WITH CHECK (
  auth.uid() = id 
  OR (public.is_organization_admin() AND organization_id = public.get_user_organization_id())
  OR public.is_master_admin()
);

-- Política de DELETE: apenas admins podem deletar perfis de sua organização
CREATE POLICY "profiles_delete_policy" ON "public"."profiles"
FOR DELETE TO authenticated
USING (
  public.is_master_admin()
  OR (public.is_organization_admin() AND organization_id = public.get_user_organization_id())
);

-- Adicionar comentários explicativos
COMMENT ON POLICY "profiles_select_policy" ON "public"."profiles" 
IS 'Usuários podem ver seus próprios perfis, perfis da mesma organização, ou master_admin pode ver todos';

COMMENT ON POLICY "profiles_insert_policy" ON "public"."profiles" 
IS 'Admins podem criar perfis para sua organização, usuários podem criar próprio perfil durante convite';

COMMENT ON POLICY "profiles_update_policy" ON "public"."profiles" 
IS 'Usuários podem atualizar próprio perfil, admins podem atualizar perfis de sua organização';

COMMENT ON POLICY "profiles_delete_policy" ON "public"."profiles" 
IS 'Apenas admins podem deletar perfis de sua organização';

COMMIT; 