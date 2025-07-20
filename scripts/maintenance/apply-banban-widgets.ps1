# Script para aplicar migrações e publicar widgets do BanBan
$ErrorActionPreference = "Stop"

# Importar configurações
. "$PSScriptRoot/../config/config.ps1"

Write-Host "🚀 Iniciando processo de publicação dos widgets do BanBan..." -ForegroundColor Cyan

try {
    # Aplicar migração das RPCs
    Write-Host "📦 Aplicando migração das RPCs..." -ForegroundColor Yellow
    $rpcMigrationPath = "../../supabase/migrations/20250630000004_create_banban_widget_rpcs.sql"
    
    if (-not (Test-Path $rpcMigrationPath)) {
        throw "Arquivo de migração não encontrado: $rpcMigrationPath"
    }

    $rpcMigrationContent = Get-Content $rpcMigrationPath -Raw
    $result = Invoke-Sqlcmd -ServerInstance $config.dbServer -Database $config.dbName -Query $rpcMigrationContent -ErrorAction Stop
    Write-Host "✅ Migração das RPCs aplicada com sucesso!" -ForegroundColor Green

    # Registrar widgets no banco
    Write-Host "📦 Registrando widgets no banco de dados..." -ForegroundColor Yellow
    $registerWidgetsPath = "../../scripts/register-banban-widgets.sql"
    
    if (-not (Test-Path $registerWidgetsPath)) {
        throw "Arquivo de registro de widgets não encontrado: $registerWidgetsPath"
    }

    $registerWidgetsContent = Get-Content $registerWidgetsPath -Raw
    $result = Invoke-Sqlcmd -ServerInstance $config.dbServer -Database $config.dbName -Query $registerWidgetsContent -ErrorAction Stop
    Write-Host "✅ Widgets registrados com sucesso!" -ForegroundColor Green

    # Publicar widgets via script TypeScript
    Write-Host "📦 Publicando widgets..." -ForegroundColor Yellow
    $env:NODE_ENV = "development"
    npx ts-node ../../scripts/publish_widgets.ts
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao publicar widgets via script TypeScript"
    }
    Write-Host "✅ Widgets publicados com sucesso!" -ForegroundColor Green

    Write-Host "🎉 Processo de publicação dos widgets concluído com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro durante o processo: $_" -ForegroundColor Red
    exit 1
} 