# Script para aplicar migrações na ordem correta
$ErrorActionPreference = "Stop"

# Importar configurações
. "$PSScriptRoot/../config/config.ps1"

Write-Host "🚀 Iniciando aplicação das migrações..." -ForegroundColor Cyan

# Criar diretório de logs se não existir
if (-not (Test-Path $config.logPath)) {
    New-Item -ItemType Directory -Path $config.logPath -Force
}

# Validar ambiente
Write-Host "🔍 Validando ambiente..." -ForegroundColor Yellow
Test-Environment

# Ordem das migrações
$migrations = @(
    # Estrutura base
    "20240726152000_current_schema_from_linked_project.sql",
    
    # Módulos e configurações
    "20240327000000_add_archived_at_to_core_modules.sql",
    "20240328000001_add_is_available_to_modules.sql",
    "20240328000002_fix_profiles_rls.sql",
    "20240328000003_fix_profiles_rls_policies.sql",
    "20240328000004_add_service_role_function.sql",
    "20240328000005_fix_profiles_rls_with_service_role.sql",
    "20240329000000_create_module_approval_requests.sql",
    
    # Widgets e Dashboard
    "20250630000000_create_dashboard_widgets_tables.sql",
    "20250630000001_create_widget_registration_logs.sql",
    "20250630000002_create_widget_registration_triggers.sql",
    "20250630000003_create_dashboard_widget_rpcs.sql",
    "20250630000004_create_banban_widget_rpcs.sql"
)

# Aplicar migrações
foreach ($migration in $migrations) {
    $migrationPath = Join-Path $config.migrationsPath $migration
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "⚠️ Migração não encontrada: $migration" -ForegroundColor Yellow
        continue
    }

    Write-Host "📦 Aplicando migração: $migration" -ForegroundColor Yellow
    
    $migrationContent = Get-Content $migrationPath -Raw
    $result = Invoke-Sqlcmd -ServerInstance $config.dbServer -Database $config.dbName -Query $migrationContent -ErrorAction Stop
    Write-Host "✅ Migração aplicada com sucesso: $migration" -ForegroundColor Green
}

Write-Host "🎉 Todas as migrações foram aplicadas com sucesso!" -ForegroundColor Green

# Registrar widgets
Write-Host "📦 Registrando widgets..." -ForegroundColor Yellow
$registerWidgetsPath = Join-Path $config.scriptsPath "register-banban-widgets.sql"

if (Test-Path $registerWidgetsPath) {
    $registerWidgetsContent = Get-Content $registerWidgetsPath -Raw
    $result = Invoke-Sqlcmd -ServerInstance $config.dbServer -Database $config.dbName -Query $registerWidgetsContent -ErrorAction Stop
    Write-Host "✅ Widgets registrados com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Arquivo de registro de widgets não encontrado" -ForegroundColor Yellow
}

# Publicar widgets
Write-Host "📦 Publicando widgets..." -ForegroundColor Yellow
$env:NODE_ENV = "development"
$publishWidgetsPath = Join-Path $config.scriptsPath "publish_widgets.ts"

if (Test-Path $publishWidgetsPath) {
    npx ts-node $publishWidgetsPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao publicar widgets via script TypeScript" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Widgets publicados com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Script de publicação de widgets não encontrado" -ForegroundColor Yellow
}

Write-Host "🎉 Processo concluído com sucesso!" -ForegroundColor Green 