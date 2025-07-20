-- Phase 1: Core Tables RLS Implementation
-- Este script implementa as políticas RLS e funções auxiliares para as tabelas core

-- Funções Auxiliares
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'master_admin'
  );
$$;

CREATE OR REPLACE FUNCTION can_manage_core_data()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND (
            role IN ('organization_admin', 'master_admin')
            OR role = 'editor'
        )
    );
END;
$$;

-- Habilitar RLS nas tabelas
ALTER TABLE core_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_products ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS suppliers_isolation_policy ON core_suppliers;
DROP POLICY IF EXISTS locations_isolation_policy ON core_locations;
DROP POLICY IF EXISTS products_isolation_policy ON core_products;

-- Criar políticas RLS
CREATE POLICY suppliers_isolation_policy ON core_suppliers
    TO authenticated
    USING ((organization_id = get_user_organization_id()) OR is_master_admin())
    WITH CHECK ((organization_id = get_user_organization_id()) AND can_manage_core_data());

CREATE POLICY locations_isolation_policy ON core_locations
    TO authenticated
    USING ((organization_id = get_user_organization_id()) OR is_master_admin())
    WITH CHECK ((organization_id = get_user_organization_id()) AND can_manage_core_data());

CREATE POLICY products_isolation_policy ON core_products
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM core_suppliers s
            WHERE s.external_id = core_products.supplier_external_id
            AND (s.organization_id = get_user_organization_id() OR is_master_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM core_suppliers s
            WHERE s.external_id = core_products.supplier_external_id
            AND s.organization_id = get_user_organization_id()
            AND can_manage_core_data()
        )
    );

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_core_suppliers_organization_id ON core_suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_locations_organization_id ON core_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_suppliers_external_id ON core_suppliers(external_id);
CREATE INDEX IF NOT EXISTS idx_core_products_supplier_external_id ON core_products(supplier_external_id);

-- Verificar se as políticas foram criadas
DO $$
BEGIN
    RAISE NOTICE 'Verificando políticas RLS criadas:';
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'core_suppliers' 
        AND policyname = 'suppliers_isolation_policy'
    ) THEN
        RAISE NOTICE 'Política suppliers_isolation_policy criada com sucesso';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'core_locations' 
        AND policyname = 'locations_isolation_policy'
    ) THEN
        RAISE NOTICE 'Política locations_isolation_policy criada com sucesso';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'core_products' 
        AND policyname = 'products_isolation_policy'
    ) THEN
        RAISE NOTICE 'Política products_isolation_policy criada com sucesso';
    END IF;
END;
$$; 