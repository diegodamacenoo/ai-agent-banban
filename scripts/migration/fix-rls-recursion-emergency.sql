-- ================================================================================================
-- SCRIPT DE EMERGÊNCIA - CORRIGIR RECURSÃO INFINITA RLS
-- ================================================================================================
-- EXECUTE IMEDIATAMENTE NO DASHBOARD DO SUPABASE PARA CORRIGIR O ERRO DE RECURSÃO
-- ================================================================================================

-- REMOVER TODAS AS POLÍTICAS COM RECURSÃO
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- ================================================================================================
-- POLÍTICAS SIMPLES SEM RECURSÃO
-- ================================================================================================

-- SELECT: Política simples sem recursão
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Usuário pode ver apenas seu próprio perfil
        auth.uid() = id
    );

-- INSERT: Política para criação de perfis (crítica para convites)
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Usuário só pode criar seu próprio perfil
        auth.uid() = id
    );

-- UPDATE: Política para atualização
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- Usuário pode atualizar apenas seu próprio perfil
        auth.uid() = id
    )
    WITH CHECK (
        -- Usuário pode atualizar apenas seu próprio perfil
        auth.uid() = id
    );

-- DELETE: Política restritiva para delete
CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        -- Por enquanto, ninguém pode deletar (evitar problemas)
        false
    );

-- ================================================================================================
-- VERIFICAR SE AS POLÍTICAS FORAM CRIADAS SEM RECURSÃO
-- ================================================================================================
SELECT 
    schemaname,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ================================================================================================
-- TESTE RÁPIDO
-- ================================================================================================
-- Verificar se consegue fazer SELECT sem recursão
SELECT count(*) as total_profiles FROM public.profiles;

-- ================================================================================================
-- PRÓXIMOS PASSOS APÓS EXECUTAR ESTE SCRIPT:
-- 1. Testar se a aplicação voltou a funcionar
-- 2. Testar o processo de convite
-- 3. Se necessário, refinamos as políticas gradualmente
-- ================================================================================================ 