-- ================================================
-- CORREÇÃO MANUAL DE POLÍTICAS RLS - PROBLEMA DE RECURSÃO
-- ================================================
-- Data: 2025-01-13
-- Descrição: Remove dependência circular das políticas RLS da tabela profiles
-- 
-- INSTRUÇÕES:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/sxqhfxlxwdqwgqgwcfvn
-- 2. Vá para SQL Editor
-- 3. Cole e execute este script completo
-- 4. Verifique se não há erros
-- 5. Teste a aplicação
-- ================================================

-- ================================================
-- 1. CRIAR FUNÇÕES AUXILIARES SEGURAS
-- ================================================

-- Função para obter organização do usuário atual (sem dependência circular)
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Função para verificar se usuário é master admin (sem dependência circular)
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

-- ================================================
-- 2. RECRIAR POLÍTICAS RLS SEM RECURSÃO
-- ================================================

-- Dropar políticas existentes
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- IMPORTANTE: Também dropar políticas com nomes antigos que podem existir
DROP POLICY IF EXISTS "profiles_isolation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_modify" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_data" ON public.profiles;

-- ================================================
-- 3. CRIAR NOVAS POLÍTICAS SEM RECURSÃO
-- ================================================

-- Política SELECT: Visualizar perfis (SEM RECURSÃO)
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Usuário pode ver seu próprio perfil
        auth.uid() = id
        OR
        -- Usuários da mesma organização (usando função auxiliar)
        organization_id = get_user_organization_id()
        OR
        -- Master admins podem ver todos (usando função auxiliar)
        is_master_admin()
    );

-- Política INSERT: Criar perfis (para convites)
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Usuário só pode criar seu próprio perfil
        auth.uid() = id
        AND
        -- Validar que a organização existe (se fornecida)
        (
            organization_id IS NULL 
            OR 
            EXISTS (
                SELECT 1 
                FROM public.organizations 
                WHERE id = organization_id
            )
        )
    );

-- Política UPDATE: Atualizar perfis
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- Usuário pode atualizar seu próprio perfil
        auth.uid() = id
        OR
        -- Admins da organização podem atualizar perfis da mesma organização
        (
            is_organization_admin() 
            AND organization_id = get_user_organization_id()
        )
    )
    WITH CHECK (
        -- Mesmas condições para o check
        auth.uid() = id
        OR
        (
            is_organization_admin() 
            AND organization_id = get_user_organization_id()
        )
    );

-- Política DELETE: Deletar perfis (apenas admins)
CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        -- Master admins podem deletar qualquer perfil
        is_master_admin()
        OR
        -- Organization admins podem deletar perfis da mesma organização
        (
            is_organization_admin()
            AND organization_id = get_user_organization_id()
        )
    );

-- ================================================
-- 4. COMENTÁRIOS EXPLICATIVOS
-- ================================================

COMMENT ON FUNCTION get_user_organization_id() IS 
'Retorna o organization_id do usuário atual - função auxiliar para políticas RLS';

COMMENT ON FUNCTION is_master_admin() IS 
'Verifica se o usuário atual é master_admin - função auxiliar para políticas RLS';

COMMENT ON FUNCTION is_organization_admin() IS 
'Verifica se o usuário atual é admin da organização - função auxiliar para políticas RLS';

COMMENT ON POLICY "profiles_select_policy" ON public.profiles IS 
'Permite visualização de perfis: próprio perfil, mesma organização, ou master_admin (SEM RECURSÃO)';

COMMENT ON POLICY "profiles_insert_policy" ON public.profiles IS 
'Permite que usuários autenticados criem seus próprios perfis durante convites';

COMMENT ON POLICY "profiles_update_policy" ON public.profiles IS 
'Permite atualização: próprio perfil ou admins da organização';

COMMENT ON POLICY "profiles_delete_policy" ON public.profiles IS 
'Permite deleção apenas para admins (master_admin ou organization_admin)';

-- ================================================
-- 5. VERIFICAÇÃO DAS POLÍTICAS
-- ================================================

-- Listar políticas criadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ================================================
-- 6. TESTE BÁSICO
-- ================================================

-- Verificar se as funções foram criadas
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE proname IN ('get_user_organization_id', 'is_master_admin', 'is_organization_admin');

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- ✅ 3 funções auxiliares criadas
-- ✅ 4 políticas RLS recriadas sem recursão
-- ✅ Teste de consulta funcionando sem erro de política
-- ================================================ 