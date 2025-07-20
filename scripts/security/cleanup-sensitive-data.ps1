# Script para remover arquivos com dados sensíveis
Write-Host "Iniciando limpeza de dados sensíveis..."

# Criar backup dos arquivos antes de remover
$backupDir = "backup/sensitive-data-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
Write-Host "Criando backup em: $backupDir"

# Criar diretório de backup
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Arquivos de teste webhook obsoletos
$webhookTestsDir = "../scripts/tests/obsolete"
if (Test-Path $webhookTestsDir) {
    Write-Host "Movendo arquivos de teste webhook obsoletos para backup..."
    Copy-Item -Path "$webhookTestsDir/*" -Destination $backupDir -Recurse
    Remove-Item -Path "$webhookTestsDir/*" -Force
}

# Arquivo SQL com dados sensíveis
$sqlFile = "../scripts/fix-user-role-sync.sql"
if (Test-Path $sqlFile) {
    Write-Host "Movendo arquivo SQL para backup..."
    Copy-Item -Path $sqlFile -Destination $backupDir
    Remove-Item -Path $sqlFile -Force
}

Write-Host "Limpeza concluída!"
Write-Host "Backup criado em: $backupDir"
Write-Host "IMPORTANTE: Revise o backup para garantir que nenhum dado importante foi perdido"
Write-Host "Após a revisão, remova manualmente o diretório de backup" 