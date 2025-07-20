-- =======================================================
-- Function: test_rls
-- Description: Testa políticas RLS com diferentes roles
-- =======================================================

CREATE OR REPLACE FUNCTION test_rls(query text, role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Resetar role para o padrão
    RESET ROLE;
    
    -- Definir role para o teste
    EXECUTE format('SET ROLE %I', role);
    
    -- Executar a query e capturar o resultado
    BEGIN
        EXECUTE format('WITH query_result AS (%s) SELECT json_agg(query_result) FROM query_result', query) INTO result;
        RETURN json_build_object(
            'success', true,
            'result', COALESCE(result, '[]'::json),
            'error', null
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'result', null,
            'error', SQLERRM
        );
    END;
END;
$$;

-- Garantir que apenas service_role pode executar
REVOKE ALL ON FUNCTION test_rls FROM PUBLIC;
GRANT EXECUTE ON FUNCTION test_rls TO service_role; 