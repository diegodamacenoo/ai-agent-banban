# Teste de Validacao - Purchase Flow
# Testa casos negativos e validacoes do webhook

# Importar configuracoes
. "$PSScriptRoot\..\config.ps1"

Write-Host "Iniciando testes de validacao do Purchase Flow..." -ForegroundColor Cyan

$testResults = @()
$webhook_url = $WEBHOOKS["purchase-flow"]

# Teste 1: Sem token de autenticacao
Write-Host "`nTeste 1: Sem token de autenticacao" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $webhook_url -Method POST -Body '{"test": "no_auth"}' -ContentType "application/json" -TimeoutSec 30
    $testResults += @{ Test = "No Auth"; Status = "FALHOU"; Details = "Deveria ter retornado erro 401" }
    Write-Host "FALHOU: Deveria ter retornado erro 401" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        $testResults += @{ Test = "No Auth"; Status = "PASSOU"; Details = "Erro 401 como esperado" }
        Write-Host "PASSOU: Erro 401 como esperado" -ForegroundColor Green
    } else {
        $testResults += @{ Test = "No Auth"; Status = "FALHOU"; Details = "Erro inesperado: $($_.Exception.Message)" }
        Write-Host "FALHOU: Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 2: Token invalido
Write-Host "`nTeste 2: Token de autenticacao invalido" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer token_invalido"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri $webhook_url -Method POST -Headers $headers -Body '{"test": "invalid_token"}' -TimeoutSec 30
    $testResults += @{ Test = "Invalid Token"; Status = "FALHOU"; Details = "Deveria ter retornado erro 401" }
    Write-Host "FALHOU: Deveria ter retornado erro 401" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        $testResults += @{ Test = "Invalid Token"; Status = "PASSOU"; Details = "Erro 401 como esperado" }
        Write-Host "PASSOU: Erro 401 como esperado" -ForegroundColor Green
    } else {
        $testResults += @{ Test = "Invalid Token"; Status = "FALHOU"; Details = "Erro inesperado: $($_.Exception.Message)" }
        Write-Host "FALHOU: Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 3: Evento nao implementado
Write-Host "`nTeste 3: Tipo de evento nao implementado" -ForegroundColor Yellow
try {
    $payload = @{
        event_type = "evento_inexistente"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        data = @{
            test = "evento_inexistente"
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $webhook_url -Method POST -Headers $HEADERS -Body $payload -TimeoutSec 30
    $testResults += @{ Test = "Unknown Event"; Status = "FALHOU"; Details = "Deveria ter retornado erro 500" }
    Write-Host "FALHOU: Deveria ter retornado erro 500" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 500) {
        $testResults += @{ Test = "Unknown Event"; Status = "PASSOU"; Details = "Erro 500 como esperado" }
        Write-Host "PASSOU: Erro 500 como esperado" -ForegroundColor Green
    } else {
        $testResults += @{ Test = "Unknown Event"; Status = "FALHOU"; Details = "Erro inesperado: $($_.Exception.Message)" }
        Write-Host "FALHOU: Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 4: Dados incompletos para purchase_order_created
Write-Host "`nTeste 4: Dados incompletos para purchase_order_created" -ForegroundColor Yellow
try {
    $payload = @{
        event_type = "purchase_order_created"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        data = @{
            purchase_order = @{
                order_number = "PO-INCOMPLETE-001"
            }
            # items ausente - deve falhar
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $webhook_url -Method POST -Headers $HEADERS -Body $payload -TimeoutSec 30
    $testResults += @{ Test = "Incomplete Data"; Status = "FALHOU"; Details = "Deveria ter retornado erro 500" }
    Write-Host "FALHOU: Deveria ter retornado erro 500" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 500) {
        $testResults += @{ Test = "Incomplete Data"; Status = "PASSOU"; Details = "Erro 500 como esperado" }
        Write-Host "PASSOU: Erro 500 como esperado" -ForegroundColor Green
    } else {
        $testResults += @{ Test = "Incomplete Data"; Status = "FALHOU"; Details = "Erro inesperado: $($_.Exception.Message)" }
        Write-Host "FALHOU: Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 5: Pedido nao encontrado para aprovacao
Write-Host "`nTeste 5: Pedido nao encontrado para aprovacao" -ForegroundColor Yellow
try {
    $payload = @{
        event_type = "purchase_order_approved"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        data = @{
            purchase_order = @{
                order_number = "PO-INEXISTENTE-999"
                approved_by = "Sistema"
                approval_date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            }
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $webhook_url -Method POST -Headers $HEADERS -Body $payload -TimeoutSec 30
    $testResults += @{ Test = "Order Not Found"; Status = "FALHOU"; Details = "Deveria ter retornado erro 500" }
    Write-Host "FALHOU: Deveria ter retornado erro 500" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 500) {
        $testResults += @{ Test = "Order Not Found"; Status = "PASSOU"; Details = "Erro 500 como esperado" }
        Write-Host "PASSOU: Erro 500 como esperado" -ForegroundColor Green
    } else {
        $testResults += @{ Test = "Order Not Found"; Status = "FALHOU"; Details = "Erro inesperado: $($_.Exception.Message)" }
        Write-Host "FALHOU: Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Resumo dos resultados
Write-Host "`nResumo dos Testes de Validacao:" -ForegroundColor Cyan
$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Status -eq "PASSOU" }).Count
$failedTests = ($testResults | Where-Object { $_.Status -eq "FALHOU" }).Count

Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Testes aprovados: $passedTests" -ForegroundColor Green
Write-Host "Testes falharam: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`nTodos os testes de validacao passaram!" -ForegroundColor Green
    Write-Host "Purchase Flow esta validando corretamente casos negativos" -ForegroundColor Green
} else {
    Write-Host "`nAlguns testes de validacao falharam" -ForegroundColor Yellow
    Write-Host "Purchase Flow pode ter problemas de validacao" -ForegroundColor Red
}

# Detalhes dos testes que falharam
$failedDetails = $testResults | Where-Object { $_.Status -eq "FALHOU" }
if ($failedDetails) {
    Write-Host "`nDetalhes dos testes que falharam:" -ForegroundColor Yellow
    foreach ($failed in $failedDetails) {
        Write-Host "- $($failed.Test): $($failed.Details)" -ForegroundColor Red
    }
}

Write-Host "`nTestes de validacao concluidos" -ForegroundColor Cyan 