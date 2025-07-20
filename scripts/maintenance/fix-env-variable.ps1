# Script para corrigir a variável de ambiente NEXT_PUBLIC_SITE_URL
Write-Host "=== CORREÇÃO VARIÁVEL DE AMBIENTE ===" -ForegroundColor Green

# Definir a variável para a sessão atual
$env:NEXT_PUBLIC_SITE_URL = "http://localhost:3000"

Write-Host "✅ Variável NEXT_PUBLIC_SITE_URL definida para: $env:NEXT_PUBLIC_SITE_URL" -ForegroundColor Green

Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Esta variável está definida apenas para esta sessão do PowerShell" -ForegroundColor White
Write-Host "2. Para tornar permanente, adicione ao arquivo .env.local:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_SITE_URL=http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Ou defina como variável de sistema do Windows:" -ForegroundColor White
Write-Host "   [System.Environment]::SetEnvironmentVariable('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000', 'User')" -ForegroundColor Cyan

Write-Host ""
Write-Host "Agora teste um novo convite - o redirect deve funcionar corretamente!" -ForegroundColor Green 