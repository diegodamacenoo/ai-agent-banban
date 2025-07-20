# =======================================================
# Script: Setup Test Environment for RLS Tests
# Description: Creates necessary functions and test data
# =======================================================

# Carregar variáveis de ambiente do arquivo .env.local
$envContent = Get-Content C:\Users\brcom\ai-agent-banban\.env.local -ErrorAction SilentlyContinue
if ($envContent) {
    $envContent | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

# Verificar se a service role key está disponível
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Error "Service role key não encontrada no arquivo .env.local"
    exit 1
}

# Configurações do Supabase
$ProjectConfig = @{
    ProjectId = "bopytcghbmuywfltmwhk"
    ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
    ApiUrl = "https://bopytcghbmuywfltmwhk.supabase.co/rest/v1"
}

# Headers para requisições
$headers = @{
    "apikey" = $ProjectConfig.ServiceRoleKey
    "Authorization" = "Bearer $($ProjectConfig.ServiceRoleKey)"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "Configurando ambiente de teste RLS..."
Write-Host "====================================="

# Criar função test_rls
$createFunctionSql = @"
CREATE OR REPLACE FUNCTION test_rls(query text, role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS `$`$
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
`$`$;

-- Garantir que apenas service_role pode executar
REVOKE ALL ON FUNCTION test_rls FROM PUBLIC;
GRANT EXECUTE ON FUNCTION test_rls TO service_role;
"@

# Criar a função test_rls via API REST
$url = "https://bopytcghbmuywfltmwhk.supabase.co/rest/v1/rpc/test_rls"
$body = @{
    query = $createFunctionSql
    role = "service_role"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "✓ Função test_rls criada com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "✗ Erro ao criar função test_rls: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nAmbiente de teste configurado com sucesso!" -ForegroundColor Green
exit 0 