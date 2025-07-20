# ================================================
# SCRIPT DE LIMPEZA DE MÓDULOS FANTASMAS
# ================================================
# Este script remove registros de módulos que não existem fisicamente
# no sistema de arquivos, mas aparecem na interface admin.

Write-Host " Iniciando limpeza de módulos fantasmas..." -ForegroundColor Cyan

# Lista de módulos fantasmas conhecidos
$ghostModules = @(
    "banban-analytics",
    "banban-components"
)

Write-Host " Módulos a serem removidos:" -ForegroundColor Yellow
foreach ($module in $ghostModules) {
    Write-Host "   - $module"
}

Write-Host "`n ATENÇÃO: Este script irá remover registros de módulos do banco de dados." -ForegroundColor Red
Write-Host "   Isso afetará a interface admin e pode afetar funcionalidades relacionadas." -ForegroundColor Red
Write-Host "   Certifique-se de ter um backup do banco de dados antes de continuar." -ForegroundColor Red

$confirmation = Read-Host "`nDeseja continuar? (S/N)"
if ($confirmation -ne "S") {
    Write-Host "`n Operação cancelada pelo usuário." -ForegroundColor Red
    exit
}

Write-Host "`n Verificando existência dos módulos no sistema de arquivos..." -ForegroundColor Cyan

# Verificar se os módulos existem fisicamente
foreach ($module in $ghostModules) {
    $modulePath = Join-Path -Path "src\core\modules" -ChildPath $module
    $exists = Test-Path $modulePath
    
    if ($exists) {
        Write-Host "    O módulo $module existe fisicamente em $modulePath" -ForegroundColor Yellow
        Write-Host "      Este script não irá remover módulos que existem fisicamente." -ForegroundColor Yellow
        $ghostModules = $ghostModules | Where-Object { $_ -ne $module }
    }
    else {
        Write-Host "    Confirmado: $module não existe fisicamente" -ForegroundColor Green
    }
}

if ($ghostModules.Count -eq 0) {
    Write-Host "`n Nenhum módulo fantasma para remover." -ForegroundColor Red
    exit
}

Write-Host "`n Gerando SQL para limpeza..." -ForegroundColor Cyan

$sql = @"
-- SQL para remover módulos fantasmas
-- Gerado em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

-- Remover registros de módulos fantasmas da tabela organization_modules
DELETE FROM organization_modules
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));

-- Remover registros de módulos fantasmas da tabela core_modules
DELETE FROM core_modules
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));

-- Remover registros de módulos fantasmas da tabela tenant_modules
DELETE FROM tenant_modules
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));

-- Remover registros de módulos fantasmas da tabela module_lifecycle
DELETE FROM module_lifecycle
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));

-- Verificação após limpeza
SELECT ''Registros restantes em organization_modules'' as tabela, COUNT(*) as contagem
FROM organization_modules
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));

SELECT ''Registros restantes em core_modules'' as tabela, COUNT(*) as contagem
FROM core_modules
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));

SELECT ''Registros restantes em tenant_modules'' as tabela, COUNT(*) as contagem
FROM tenant_modules
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));

SELECT ''Registros restantes em module_lifecycle'' as tabela, COUNT(*) as contagem
FROM module_lifecycle
WHERE module_id IN ($(($ghostModules | ForEach-Object { "''$_''" }) -join ", "));
"@

# Salvar SQL em arquivo
$sqlFilePath = "scripts/cleanup-ghost-modules.sql"
$sql | Out-File -FilePath $sqlFilePath -Encoding utf8

Write-Host "`n SQL gerado com sucesso em: $sqlFilePath" -ForegroundColor Green
Write-Host "   Execute este SQL no seu banco de dados para remover os módulos fantasmas." -ForegroundColor Green

Write-Host "`n Instruções:" -ForegroundColor Cyan
Write-Host "   1. Revise o arquivo SQL gerado" -ForegroundColor White
Write-Host "   2. Execute o SQL no seu banco de dados" -ForegroundColor White
Write-Host "   3. Reinicie o servidor para limpar o cache" -ForegroundColor White
Write-Host "   4. Verifique se os módulos fantasmas não aparecem mais na interface admin" -ForegroundColor White

Write-Host "`n Dica: Para executar o SQL via CLI, use:" -ForegroundColor Yellow
Write-Host "   psql -h localhost -U postgres -d seu_banco -f $sqlFilePath" -ForegroundColor White

Write-Host "`n Processo concluído!" -ForegroundColor Cyan
