param (
    [string]$Flow
)

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$configFile = Join-Path $PSScriptRoot "webhook-test-config.json"
$config = Get-Content $configFile | ConvertFrom-Json

if (-not $config.PSObject.Properties.Name.Contains($Flow)) {
    Write-Host "Flow '$Flow' não encontrado no arquivo de configuração."
    exit 1
}

$flowConfig = $config.$Flow
$webhookUrl = $flowConfig.url
$testFile = Join-Path $PSScriptRoot $flowConfig.test_file
$bearerToken = "BnbNwhTknprD2o25suPasEc"

Write-Host "Iniciando testes para o fluxo: $Flow"
Write-Host "URL do Webhook: $webhookUrl"
Write-Host "Arquivo de Teste: $testFile"
Write-Host "--------------------------------------------------"

$testCases = Get-Content $testFile | ConvertFrom-Json

foreach ($testCase in $testCases) {
    $testName = $testCase.name
    $payload = $testCase.payload | ConvertTo-Json -Depth 10

    Write-Host "Executando teste: $testName"

    try {
        $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payload -ContentType "application/json" -Headers @{
            "Authorization" = "Bearer $bearerToken"
        }

        $status = $response.success
        if ($status) {
            Write-Host "  [PASSOU] - Resposta: $($response | ConvertTo-Json -Depth 10 -Compress)" -ForegroundColor Green
        } else {
            Write-Host "  [FALHOU] - Resposta: $($response | ConvertTo-Json -Depth 10 -Compress)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [ERRO] - Falha na requisição: $_" -ForegroundColor Red
    }
    Write-Host ""
} 