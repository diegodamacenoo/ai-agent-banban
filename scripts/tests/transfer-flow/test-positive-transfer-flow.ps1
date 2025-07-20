# Teste Positivo - Sales Flow
# Testa casos de sucesso: vendas, cancelamentos e devolucoes

. "$PSScriptRoot\..\config.ps1"

Write-Host "=== TESTE POSITIVO - TRANSFER FLOW ===" -ForegroundColor Cyan
Write-Host "Testando casos de sucesso..." -ForegroundColor Yellow
Write-Host ""

# Carregar dados de teste
$testDataPath = "$PSScriptRoot\test-transfer-flow.json"
if (-not (Test-Path $testDataPath)) {
    Write-Host "ERRO: Arquivo de dados de teste nao encontrado: $testDataPath" -ForegroundColor Red
    exit 1
}

$testData = Get-Content $testDataPath -Raw | ConvertFrom-Json

$testResults = @()
$totalTests = 0
$passedTests = 0

# Funcao para executar teste positivo
function Test-PositiveCase {
    param(
        [string]$TestName,
        [object]$Payload
    )
    
    $global:totalTests++
    Write-Host "Teste: $TestName" -ForegroundColor White
    
    try {
        $body = $Payload | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri $TRANSFER_FLOW_URL -Method POST -Headers $VALID_HEADERS -Body $body -ContentType "application/json" -ErrorAction Stop
        
        $success = $response.success -eq $true
        
        if ($success) {
            Write-Host "  PASSOU: Processado com sucesso" -ForegroundColor Green
            Write-Host "  Event Type: $($response.flow_summary.event_type)" -ForegroundColor Gray
            Write-Host "  Records Processed: $($response.flow_summary.records_processed)" -ForegroundColor Gray
            Write-Host "  Success Rate: $($response.flow_summary.success_rate)" -ForegroundColor Gray
            
            if ($response.details) {
                Write-Host "  Details:" -ForegroundColor Gray
                if ($response.details.result.document_id) {
                    Write-Host "    Document ID: $($response.details.result.document_id)" -ForegroundColor Gray
                }
                if ($response.details.result.items_processed) {
                    Write-Host "    Items Processed: $($response.details.result.items_processed)" -ForegroundColor Gray
                }
                if ($response.details.result.movements_created) {
                    Write-Host "    Movements Created: $($response.details.result.movements_created)" -ForegroundColor Gray
                }
                if ($response.details.result.return_type) {
                    Write-Host "    Return Type: $($response.details.result.return_type)" -ForegroundColor Gray
                }
            }
            
            $global:passedTests++
            $result = "PASS"
        } else {
            Write-Host "  FALHOU: success = false" -ForegroundColor Red
            Write-Host "  Erro: $($response.error)" -ForegroundColor Red
            $result = "FAIL"
        }
        
    } catch {
        Write-Host "  FALHOU: Excecao durante o teste" -ForegroundColor Red
        Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
        $result = "FAIL"
    }
    
    $global:testResults += [PSCustomObject]@{
        Test = $TestName
        Result = $result
        EventType = $Payload.event_type
    }
    
    Write-Host ""
}

# === EXECUTAR TESTES ===
Write-Host "Executando testes de casos positivos..." -ForegroundColor Magenta
Write-Host ""

foreach ($test in $testData) {
    Test-PositiveCase -TestName $test.name -Payload $test.payload
}

# === TESTE ADICIONAL: Webhook Basico ===
Write-Host "TESTE ADICIONAL: Webhook Basico" -ForegroundColor Magenta

$basicPayload = @{
    event_type = "transfer_order_created"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    data = @{
        sale = @{
            sale_id = "BASIC-TEST-$(Get-Random)"
            store_code = "STORE001"
            total_amount = 50.00
            payment_method = "CASH"
        }
        items = @(
            @{
                variant_code = "VAR001"
                quantity_sold = 1
                unit_price = 50.00
                total_amount = 50.00
            }
        )
    }
}

Test-PositiveCase -TestName "Teste basico de venda" -Payload $basicPayload

# === RESUMO DOS RESULTADOS ===
Write-Host "=== RESUMO DOS TESTES POSITIVOS ===" -ForegroundColor Cyan
Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Testes aprovados: $passedTests" -ForegroundColor Green
Write-Host "Testes falharam: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host ""

# Mostrar resultados por tipo de evento
$eventTypes = $testResults | Group-Object EventType
Write-Host "Resultados por tipo de evento:" -ForegroundColor Yellow
foreach ($group in $eventTypes) {
    $passed = ($group.Group | Where-Object { $_.Result -eq "PASS" }).Count
    $total = $group.Group.Count
    Write-Host "  $($group.Name): $passed/$total aprovados" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Red" })
}
Write-Host ""

if ($totalTests -eq $passedTests) {
    Write-Host "TODOS OS TESTES POSITIVOS PASSARAM!" -ForegroundColor Green
    Write-Host "Sales Flow esta funcionando corretamente." -ForegroundColor Green
} else {
    Write-Host "ALGUNS TESTES FALHARAM - Verifique os detalhes acima" -ForegroundColor Red
    
    Write-Host "`nTestes que falharam:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test) ($($_.EventType))" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Teste positivo do Sales Flow concluido." -ForegroundColor Cyan 