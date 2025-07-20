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
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (
                p.organization_id = profiles.organization_id
                OR p.role = 'master_admin'
            )
        )
    ); 