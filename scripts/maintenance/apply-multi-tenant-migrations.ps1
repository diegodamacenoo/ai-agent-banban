# Script para aplicar migracoes multi-tenant via API REST do Supabase
Write-Host "Aplicando Migracoes Multi-Tenant" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Verificar se arquivo .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "Arquivo .env.local nao encontrado" -ForegroundColor Red
    exit 1
}

# Ler variaveis do arquivo
$envContent = Get-Content ".env.local"
$supabaseUrl = ""
$supabaseKey = ""

foreach ($line in $envContent) {
    if ($line -match "NEXT_PUBLIC_SUPABASE_URL=(.+)") {
        $supabaseUrl = $matches[1]
    }
    if ($line -match "SUPABASE_SERVICE_ROLE_KEY=(.+)") {
        $supabaseKey = $matches[1]
    }
}

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "Variaveis de ambiente do Supabase nao encontradas" -ForegroundColor Red
    exit 1
}

Write-Host "Configuracoes do Supabase carregadas" -ForegroundColor Green

# Verificar se as colunas multi-tenant ja existem
Write-Host "Verificando status das migracoes..." -ForegroundColor Cyan

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

try {
    # Testar se as colunas multi-tenant existem
    $testUrl = "$supabaseUrl/rest/v1/organizations?select=id,name,client_type,custom_backend_url,implementation_config"
    $testUrl += "&limit=1"
    
    $testResponse = Invoke-RestMethod -Uri $testUrl -Headers $headers -Method Get
    
    Write-Host "Colunas multi-tenant ja estao funcionando!" -ForegroundColor Green
    Write-Host "Exemplo de organizacao:" -ForegroundColor Gray
    $testResponse | ConvertTo-Json -Depth 2
    
} catch {
    Write-Host "Colunas multi-tenant nao existem. Aplicando migracoes..." -ForegroundColor Yellow
    
    # Aplicar migracoes via INSERT direto
    try {
        # Testar se podemos adicionar as colunas via ALTER TABLE
        Write-Host "INSTRUCOES MANUAIS:" -ForegroundColor Yellow
        Write-Host "1. Acesse o Supabase Dashboard" -ForegroundColor White
        Write-Host "2. Va para SQL Editor" -ForegroundColor White
        Write-Host "3. Execute o arquivo: scripts/apply-multi-tenant-migrations.sql" -ForegroundColor White
        Write-Host "4. Depois teste novamente o componente" -ForegroundColor White
        
        Write-Host ""
        Write-Host "Ou execute manualmente os seguintes comandos SQL:" -ForegroundColor Yellow
        
        $sqlCommands = @"
-- Adicionar colunas multi-tenant
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'standard' CHECK (client_type IN ('custom', 'standard'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS implementation_config JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_backend_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_implementation_complete BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS implementation_date TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS implementation_team_notes TEXT;

-- Criar indices
CREATE INDEX IF NOT EXISTS idx_organizations_client_type ON organizations(client_type);
CREATE INDEX IF NOT EXISTS idx_organizations_implementation_status ON organizations(is_implementation_complete);
"@
        
        Write-Host $sqlCommands -ForegroundColor Gray
        
    } catch {
        Write-Host "Erro ao tentar aplicar migracoes:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Verificacao concluida!" -ForegroundColor Cyan 