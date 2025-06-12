CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Tabela para armazenar perfis de acesso (roles) e suas permissões.';
COMMENT ON COLUMN public.roles.name IS 'Nome único do perfil de acesso (ex: "Administrador", "Leitor").';
COMMENT ON COLUMN public.roles.permissions IS 'Um array de strings ou objeto JSON que define as permissões específicas do perfil.';

-- Ativar RLS para a nova tabela
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Política: Apenas usuários autenticados podem ler os perfis
CREATE POLICY "Allow authenticated read access"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Política: Apenas administradores da organização podem criar, atualizar ou deletar perfis
CREATE POLICY "Allow full access for organization admins"
ON public.roles
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'organization_admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'organization_admin'
);

-- Inserir alguns perfis padrão
INSERT INTO public.roles (name, description, permissions) VALUES
('organization_admin', 'Acesso total para administrar a organização.', '["users:create", "users:read", "users:update", "users:delete", "roles:create", "roles:read", "roles:update", "roles:delete"]'::jsonb),
('standard_user', 'Acesso padrão para visualização e interação com os recursos principais.', '["dashboard:read", "reports:read"]'::jsonb),
('reader', 'Acesso limitado apenas para leitura de informações.', '["dashboard:read"]'::jsonb); 