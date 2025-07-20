# =====================================================
# SCRIPT: Execução da Fase 3 da Migração
# Objetivo: Migrar tabelas core_ restantes para sistema genérico
# Data: 2025-01-15
# =====================================================

# Importar configurações
. "$PSScriptRoot/../config/config.ps1"

# Funções de Suporte
function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "AVISO: $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "ERRO: $Message" -ForegroundColor Red
}

# Verificar ambiente
Write-Step "Verificando ambiente"
try {
    $env:PGPASSWORD = $DB_PASSWORD
    $testConnection = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\conninfo"
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao conectar ao banco de dados"
    }
    Write-Success "Conexão com banco de dados OK"
} catch {
    Write-Error "Falha ao verificar ambiente: $_"
    exit 1
}

# Criar backup completo
Write-Step "Criando backup completo do banco"
$backupFile = "backups/pre_phase3_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
try {
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $backupFile
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao criar backup"
    }
    Write-Success "Backup criado em: $backupFile"
} catch {
    Write-Error "Falha ao criar backup: $_"
    exit 1
}

# Executar migração
Write-Step "Executando migração Fase 3"
try {
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$PSScriptRoot/phase3-migrate-remaining-core.sql"
    if ($LASTEXITCODE -ne 0) {
        throw "Erro durante a migração"
    }
    Write-Success "Migração executada com sucesso"
    
    # Salvar log
    $logFile = "logs/phase3-migration-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    $result | Out-File $logFile
    Write-Success "Log salvo em: $logFile"
} catch {
    Write-Error "Falha na migração: $_"
    Write-Warning "Restaurando backup..."
    
    try {
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $backupFile
        Write-Success "Backup restaurado com sucesso"
    } catch {
        Write-Error "ERRO CRÍTICO: Falha ao restaurar backup: $_"
        Write-Error "Backup disponível em: $backupFile"
        Write-Error "Restauração manual necessária!"
    }
    exit 1
}

# Validação final
Write-Step "Executando validação final"
$validationQuery = @"
SELECT 
    (SELECT COUNT(*) FROM tenant_business_entities WHERE entity_type = 'pricing') as pricing_count,
    (SELECT COUNT(*) FROM tenant_business_entities WHERE entity_type = 'inventory_snapshot') as snapshot_count,
    (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'document') as document_count,
    (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'order') as order_count,
    (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'movement') as movement_count,
    (SELECT COUNT(*) FROM tenant_business_transactions WHERE transaction_type = 'event') as event_count;
"@

try {
    $validation = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$validationQuery" -t
    Write-Success "Validação final concluída"
    Write-Host "`nResultados da migração:"
    Write-Host $validation
} catch {
    Write-Error "Falha na validação final: $_"
    exit 1
}

Write-Success "`nMigração Fase 3 concluída com sucesso!" 