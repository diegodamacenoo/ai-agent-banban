-- ================================================================================================
-- SCRIPT PARA CORRIGIR POLÍTICAS RLS - PROFILES (CONVITES)
-- ================================================================================================
-- Este script corrige as políticas RLS que impedem usuários convidados de criar seus perfis
-- EXECUTE NO DASHBOARD DO SUPABASE: Settings -> Database -> SQL Editor
-- ================================================================================================

-- Habilitar RLS na tabela profiles (se não estiver já)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes para recriá-las corretamente
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- ================================================================================================
-- POLÍTICA SELECT: Visualizar perfis
-- ================================================================================================
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Usuário pode ver seu próprio perfil
        auth.uid() = id
        OR
        -- Usuário pode ver perfis da mesma organização
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
        OR
        -- Master admins podem ver todos os perfis
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'master_admin'
        )
    );

-- ================================================================================================
-- POLÍTICA INSERT: Criar perfis (CRÍTICA PARA CONVITES)
-- ================================================================================================
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- CHAVE: Usuário só pode criar seu próprio perfil (auth.uid() = id)
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

-- ================================================================================================
-- POLÍTICA UPDATE: Atualizar perfis
-- ================================================================================================
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- Usuário pode atualizar seu próprio perfil
        auth.uid() = id
        OR
        -- Organization admins podem atualizar perfis da mesma organização
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.organization_id = profiles.organization_id
            AND p.role IN ('organization_admin', 'master_admin')
        )
    )
    WITH CHECK (
        -- Mesmas condições para o check
        auth.uid() = id
        OR
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.organization_id = profiles.organization_id
            AND p.role IN ('organization_admin', 'master_admin')
        )
    );

-- ================================================================================================
-- POLÍTICA DELETE: Deletar perfis (apenas admins)
-- ================================================================================================
CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        -- Master admins podem deletar qualquer perfil
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'master_admin'
        )
        OR
        -- Organization admins podem deletar perfis da mesma organização
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.organization_id = profiles.organization_id
            AND p.role = 'organization_admin'
        )
    );

-- ================================================================================================
-- COMENTÁRIOS EXPLICATIVOS
-- ================================================================================================
COMMENT ON POLICY "profiles_insert_policy" ON public.profiles IS 
'CRÍTICO: Permite que usuários autenticados criem seus próprios perfis durante o processo de convite (auth.uid() = id)';

COMMENT ON POLICY "profiles_select_policy" ON public.profiles IS 
'Permite visualização de perfis dentro da mesma organização ou próprio perfil';

COMMENT ON POLICY "profiles_update_policy" ON public.profiles IS 
'Permite que usuários atualizem seus próprios perfis ou admins atualizem perfis da organização';

COMMENT ON POLICY "profiles_delete_policy" ON public.profiles IS 
'Permite que apenas admins deletem perfis (master_admin ou organization_admin)';

-- ================================================================================================
-- VERIFICAÇÃO: Listar políticas criadas
-- ================================================================================================
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ================================================================================================
-- FIM DO SCRIPT
-- ================================================================================================
-- Após executar este script, teste novamente o processo de convite
-- O erro "new row violates row-level security policy" deve ser resolvido
-- ================================================================================================ 