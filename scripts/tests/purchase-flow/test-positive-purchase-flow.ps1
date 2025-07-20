# Teste Positivo - Purchase Flow
# Testa o fluxo completo de compras com casos de sucesso

# Importar configurações
. "$PSScriptRoot\..\config.ps1"

Write-Host "Iniciando teste positivo do Purchase Flow..." -ForegroundColor Cyan

$webhook_url = $WEBHOOKS["purchase-flow"]
$testResults = @()

# Dados de teste únicos
$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$orderNumber = "PO-TEST-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "Dados do teste:" -ForegroundColor White
Write-Host "- Pedido: $orderNumber" -ForegroundColor Gray
Write-Host "- Timestamp: $timestamp" -ForegroundColor Gray

# Teste 1: Criação do Pedido de Compra
Write-Host "`nTeste 1: Criação do Pedido de Compra" -ForegroundColor Yellow
try {
    $payload = @{
        event_type = "purchase_order_created"
        timestamp = $timestamp
        data = @{
            purchase_order = @{
                order_number = $orderNumber
                supplier_code = "SUPP-TEST-001"
                supplier_name = "Fornecedor Teste LTDA"
                total_value = 2500.00
                issue_date = $timestamp
                expected_delivery = (Get-Date).AddDays(15).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                destination = "CD-PRINCIPAL"
                approved_by = "Sistema Teste"
                approval_date = $timestamp
                notes = "Pedido de teste automatizado"
            }
            items = @(
                @{
                    item_sequence = 1
                    product_code = "PROD-TEST-001"
                    product_name = "Produto Teste 001"
                    variant_code = "VAR-TEST-001-M-AZUL"
                    size = "M"
                    color = "AZUL"
                    quantity_ordered = 10
                    unit_cost = 100.00
                    unit_price = 150.00
                    total_cost = 1000.00
                    notes = "Item de teste 1"
                }
            )
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $webhook_url -Method POST -Headers $HEADERS -Body $payload -TimeoutSec 30
    
    if ($response.success -eq $true) {
        Write-Host "Pedido criado com sucesso!" -ForegroundColor Green
        Write-Host "   - Entity ID: $($response.details.entity_id)" -ForegroundColor Gray
        $testResults += @{ Test = "Purchase Order Created"; Status = "PASSOU"; Details = "Pedido criado com sucesso" }
    } else {
        Write-Host "Falha na criação do pedido" -ForegroundColor Red
        $testResults += @{ Test = "Purchase Order Created"; Status = "FALHOU"; Details = $response.error }
    }
} catch {
    Write-Host "Erro na criação do pedido: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Purchase Order Created"; Status = "FALHOU"; Details = $_.Exception.Message }
}

# Resumo dos resultados
Write-Host "`nResumo dos Testes Positivos:" -ForegroundColor Cyan
$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Status -eq "PASSOU" }).Count
$failedTests = ($testResults | Where-Object { $_.Status -eq "FALHOU" }).Count

Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Testes aprovados: $passedTests" -ForegroundColor Green
Write-Host "Testes falharam: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`nTodos os testes positivos passaram!" -ForegroundColor Green
    Write-Host "Purchase Flow está funcionando corretamente" -ForegroundColor Green
} else {
    Write-Host "`nAlguns testes positivos falharam" -ForegroundColor Yellow
    Write-Host "Purchase Flow pode ter problemas funcionais" -ForegroundColor Red
}

Write-Host "`nTestes positivos concluídos" -ForegroundColor Cyan 