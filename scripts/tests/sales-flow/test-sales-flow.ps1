# Script de teste para o webhook de vendas
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$testFile = Join-Path $PSScriptRoot "test-sales-flow.json"
$webhookUrl = "https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-sales-flow"
$bearerToken = "BnbNwhTknprD2o25suPasEc"

Write-Host "🧪 Iniciando testes do webhook de vendas..."
Write-Host "URL: $webhookUrl"
Write-Host "Arquivo de testes: $testFile"
Write-Host "--------------------------------------------------"

# Carregar casos de teste
$testConfig = Get-Content $testFile | ConvertFrom-Json
$testCases = $testConfig.tests

# Executar cada caso de teste
foreach ($testCase in $testCases) {
    $testName = $testCase.name
    $payload = $testCase.payload | ConvertTo-Json -Depth 10

    Write-Host "📋 Executando teste: $testName"
    Write-Host "Payload:"
    Write-Host $payload
    Write-Host ""

    try {
        $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payload -ContentType "application/json" -Headers @{
            "Authorization" = "Bearer $bearerToken"
        }

        if ($response.success) {
            Write-Host "✅ [PASSOU] Teste concluído com sucesso!" -ForegroundColor Green
            Write-Host "Detalhes da resposta:"
            Write-Host ($response | ConvertTo-Json -Depth 5)
        } else {
            Write-Host "❌ [FALHOU] Teste falhou!" -ForegroundColor Red
            Write-Host "Erro:"
            Write-Host ($response | ConvertTo-Json -Depth 5)
        }
    } catch {
        Write-Host "❌ [ERRO] Falha na execução do teste:" -ForegroundColor Red
        Write-Host $_.Exception.Message
        Write-Host "Response:"
        Write-Host $_.Exception.Response
    }

    Write-Host "--------------------------------------------------"
} 