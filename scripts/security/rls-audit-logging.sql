-- RLS Audit Logging Implementation
-- Este script implementa o sistema de logging para operações críticas RLS

-- Criar tipo ENUM para operações
CREATE TYPE rls_operation_type AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'POLICY_VIOLATION'
);

-- Criar tipo ENUM para entidades
CREATE TYPE rls_entity_type AS ENUM (
    'core_suppliers',
    'core_locations',
    'core_products'
);

-- Criar tabela de audit logs específica para RLS
CREATE TABLE IF NOT EXISTS rls_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    operation_type rls_operation_type NOT NULL,
    entity_type rls_entity_type NOT NULL,
    entity_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    request_id UUID DEFAULT gen_random_uuid()
);

-- Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_rls_audit_logs_user_id ON rls_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rls_audit_logs_organization_id ON rls_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_rls_audit_logs_timestamp ON rls_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rls_audit_logs_operation_entity ON rls_audit_logs(operation_type, entity_type);

-- Aplicar RLS na tabela de audit logs
ALTER TABLE rls_audit_logs ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se o usuário pode acessar logs
CREATE OR REPLACE FUNCTION can_access_audit_logs()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND (role IN ('organization_admin', 'master_admin'))
    );
END;
$$;

-- Política RLS para audit logs (apenas leitura para admins)
CREATE POLICY audit_logs_isolation_policy ON rls_audit_logs
    TO authenticated
    USING (
        (organization_id = get_user_organization_id() AND can_access_audit_logs())
        OR is_master_admin()
    );

-- Função para registrar tentativas de operação
CREATE OR REPLACE FUNCTION log_rls_operation(
    p_operation_type rls_operation_type,
    p_entity_type rls_entity_type,
    p_entity_id TEXT,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_organization_id UUID;
    v_ip_address TEXT;
    v_user_agent TEXT;
BEGIN
    -- Obter informações do usuário atual
    SELECT 
        id,
        organization_id 
    INTO 
        v_user_id,
        v_organization_id
    FROM profiles 
    WHERE id = auth.uid();

    -- Obter informações da requisição
    v_ip_address := COALESCE(
        current_setting('request.headers', true)::json->>'x-real-ip',
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        'unknown'
    );
    
    v_user_agent := COALESCE(
        current_setting('request.headers', true)::json->>'user-agent',
        'unknown'
    );

    -- Inserir log
    INSERT INTO rls_audit_logs (
        user_id,
        organization_id,
        operation_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        success,
        error_message
    ) VALUES (
        v_user_id,
        v_organization_id,
        p_operation_type,
        p_entity_type,
        p_entity_id,
        p_old_data,
        p_new_data,
        v_ip_address,
        v_user_agent,
        p_success,
        p_error_message
    );
END;
$$;

-- Função para registrar violações de política
CREATE OR REPLACE FUNCTION log_rls_policy_violation(
    p_entity_type rls_entity_type,
    p_entity_id TEXT,
    p_error_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM log_rls_operation(
        'POLICY_VIOLATION'::rls_operation_type,
        p_entity_type,
        p_entity_id,
        NULL,
        NULL,
        false,
        p_error_message
    );
END;
$$;

-- Triggers para logging automático

-- Suppliers
CREATE OR REPLACE FUNCTION trg_log_suppliers_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_rls_operation(
            'INSERT'::rls_operation_type,
            'core_suppliers'::rls_entity_type,
            NEW.external_id,
            NULL,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_rls_operation(
            'UPDATE'::rls_operation_type,
            'core_suppliers'::rls_entity_type,
            NEW.external_id,
            row_to_json(OLD)::jsonb,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_rls_operation(
            'DELETE'::rls_operation_type,
            'core_suppliers'::rls_entity_type,
            OLD.external_id,
            row_to_json(OLD)::jsonb,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_suppliers_audit
    AFTER INSERT OR UPDATE OR DELETE ON core_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION trg_log_suppliers_changes();

-- Locations
CREATE OR REPLACE FUNCTION trg_log_locations_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_rls_operation(
            'INSERT'::rls_operation_type,
            'core_locations'::rls_entity_type,
            NEW.external_id,
            NULL,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_rls_operation(
            'UPDATE'::rls_operation_type,
            'core_locations'::rls_entity_type,
            NEW.external_id,
            row_to_json(OLD)::jsonb,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_rls_operation(
            'DELETE'::rls_operation_type,
            'core_locations'::rls_entity_type,
            OLD.external_id,
            row_to_json(OLD)::jsonb,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_locations_audit
    AFTER INSERT OR UPDATE OR DELETE ON core_locations
    FOR EACH ROW
    EXECUTE FUNCTION trg_log_locations_changes();

-- Products
CREATE OR REPLACE FUNCTION trg_log_products_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_rls_operation(
            'INSERT'::rls_operation_type,
            'core_products'::rls_entity_type,
            NEW.external_id,
            NULL,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_rls_operation(
            'UPDATE'::rls_operation_type,
            'core_products'::rls_entity_type,
            NEW.external_id,
            row_to_json(OLD)::jsonb,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_rls_operation(
            'DELETE'::rls_operation_type,
            'core_products'::rls_entity_type,
            OLD.external_id,
            row_to_json(OLD)::jsonb,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_products_audit
    AFTER INSERT OR UPDATE OR DELETE ON core_products
    FOR EACH ROW
    EXECUTE FUNCTION trg_log_products_changes();

-- Função para consultar logs
CREATE OR REPLACE FUNCTION get_rls_audit_logs(
    p_start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '7 days'),
    p_end_date TIMESTAMPTZ DEFAULT NOW(),
    p_entity_type rls_entity_type DEFAULT NULL,
    p_operation_type rls_operation_type DEFAULT NULL,
    p_success BOOLEAN DEFAULT NULL
)
RETURNS SETOF rls_audit_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM rls_audit_logs
    WHERE timestamp BETWEEN p_start_date AND p_end_date
    AND (p_entity_type IS NULL OR entity_type = p_entity_type)
    AND (p_operation_type IS NULL OR operation_type = p_operation_type)
    AND (p_success IS NULL OR success = p_success)
    AND (
        (organization_id = get_user_organization_id() AND can_access_audit_logs())
        OR is_master_admin()
    )
    ORDER BY timestamp DESC;
$$; 