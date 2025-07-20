# Script para configurar o sistema de gerenciamento de secrets
Write-Host "Configurando sistema de gerenciamento de secrets..."

# 1. Gerar chave de criptografia se não existir
$envFile = ".env.local"
if (!(Test-Path $envFile) -or !(Get-Content $envFile | Select-String "ENCRYPTION_KEY=")) {
    Write-Host "Gerando nova chave de criptografia..."
    # Gerar 32 bytes aleatórios e converter para hex
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $encryptionKey = [System.BitConverter]::ToString($bytes) -replace '-'
    Add-Content $envFile "ENCRYPTION_KEY=$encryptionKey"
    Write-Host "Chave gerada e salva em $envFile"
}

# 2. Executar limpeza de dados sensíveis
Write-Host "Executando limpeza de dados sensíveis..."
& ./cleanup-sensitive-data.ps1

# 3. Status da migração
Write-Host "Migracao ja aplicada via MCP Supabase"

Write-Host "Sistema de gerenciamento de secrets configurado com sucesso!"
Write-Host ""
Write-Host "IMPORTANTE:"
Write-Host "1. Faca backup da chave de criptografia em local seguro"
Write-Host "2. Configure a chave em todas as instancias da aplicacao"
Write-Host "3. Revise e remova o backup dos dados sensiveis" 