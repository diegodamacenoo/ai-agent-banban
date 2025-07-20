# Script para configurar o banco de dados multi-tenant no Supabase
Write-Host "Configurando banco de dados multi-tenant..." -ForegroundColor Yellow

# Verificar se o Supabase CLI está disponível
if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g supabase
}

# Aplicar migrações SQL
Write-Host "Aplicando migrações SQL..." -ForegroundColor Green

$sqlCommands = @"
-- 1. Verificar e adicionar colunas multi-tenant
DO `$`$
BEGIN
    -- Verificar se client_type já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'client_type'
    ) THEN
        -- Aplicar extensões na tabela organizations
        ALTER TABLE organizations ADD COLUMN client_type TEXT DEFAULT 'standard' CHECK (client_type IN ('custom', 'standard'));
        ALTER TABLE organizations ADD COLUMN implementation_config JSONB DEFAULT '{}';
        ALTER TABLE organizations ADD COLUMN custom_backend_url TEXT;
        ALTER TABLE organizations ADD COLUMN is_implementation_complete BOOLEAN DEFAULT false;
        ALTER TABLE organizations ADD COLUMN implementation_date TIMESTAMPTZ;
        ALTER TABLE organizations ADD COLUMN implementation_team_notes TEXT;
        
        -- Criar índices
        CREATE INDEX idx_organizations_client_type ON organizations(client_type);
        CREATE INDEX idx_organizations_implementation_status ON organizations(is_implementation_complete);
        
        RAISE NOTICE 'Colunas multi-tenant adicionadas à tabela organizations';
    ELSE
        RAISE NOTICE 'Colunas multi-tenant já existem na tabela organizations';
    END IF;
END
`$`$;

-- 2. Criar organização de teste se não existir
INSERT INTO organizations (
  company_legal_name,
  company_trading_name,
  client_type,
  custom_backend_url,
  implementation_config,
  is_implementation_complete,
  implementation_date,
  implementation_team_notes
) 
SELECT 
  'Teste Organização Ltda',
  'Teste Org Multi-Tenant',
  'custom',
  'http://localhost:4000',
  '{"enabled_modules": ["analytics", "performance", "inventory"], "custom_features": ["advanced_reporting", "real_time_sync"]}',
  true,
  NOW(),
  'Organização criada automaticamente para testes de integração multi-tenant'
WHERE NOT EXISTS (
  SELECT 1 FROM organizations 
  WHERE company_trading_name = 'Teste Org Multi-Tenant'
);

-- 3. Criar organização padrão também para testes
INSERT INTO organizations (
  company_legal_name,
  company_trading_name,
  client_type,
  implementation_config,
  is_implementation_complete
) 
SELECT 
  'SaaS Padrão Ltda',
  'SaaS Padrão',
  'standard',
  '{"enabled_standard_modules": ["analytics", "reports", "alerts", "dashboard"]}',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM organizations 
  WHERE company_trading_name = 'SaaS Padrão'
);

-- 4. Verificar organizações criadas
SELECT 
  id,
  company_legal_name,
  company_trading_name,
  client_type,
  custom_backend_url,
  is_implementation_complete
FROM organizations
WHERE company_trading_name IN ('Teste Org Multi-Tenant', 'SaaS Padrão')
ORDER BY client_type;
"@

# Criar arquivo SQL temporário
$tempSqlFile = "temp-multi-tenant-setup.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

try {
    Write-Host "Executando SQL no Supabase..." -ForegroundColor Green
    supabase db reset --debug
    supabase db push --debug
    
    Write-Host "Aplicando configurações multi-tenant..." -ForegroundColor Green
    supabase db exec -f apply-multi-tenant-migrations.sql
    
    Write-Host "Configuração concluída com sucesso!" -ForegroundColor White -BackgroundColor Green
} catch {
    Write-Host "Erro ao executar SQL: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Tente executar manualmente no Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host $sqlCommands -ForegroundColor Cyan
} finally {
    # Limpar arquivo temporário
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile -Force
    }
}

Write-Host "`nPróximos passos:" -ForegroundColor Yellow
Write-Host "1. Teste novamente o componente multi-tenant" -ForegroundColor White
Write-Host "2. Verifique se as organizações foram criadas corretamente" -ForegroundColor White
Write-Host "3. Execute os testes de integração" -ForegroundColor White 