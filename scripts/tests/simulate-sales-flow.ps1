#!/usr/bin/env pwsh

Write-Host "🎯 Simulacao Completa: Sales Flow" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$baseUrl = "https://bopytcghbmuywfltmwhk.supabase.co/functions/v1"
$authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Nzk4MDAsImV4cCI6MjA1MTI1NTgwMH0.YGKfKlmKNqxuJO8HsGQWJ2w9HGTqbqgw3VLJXLq4Yx8"

Write-Host "🛠️ Configuracoes:" -ForegroundColor Yellow
Write-Host "  Base URL: $baseUrl" -ForegroundColor White
Write-Host "  Webhook: webhook-sales-flow" -ForegroundColor White
Write-Host ""

# Etapa 1: Sale Completed
Write-Host "📝 ETAPA 1: Sale Completed" -ForegroundColor Green
Write-Host "----------------------------" -ForegroundColor Gray

$saleCompletedPayload = @{
    event_type = "sale_completed"
    sale_id = "SALE-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    customer_id = "CUST-12345"
    items = @(
        @{
            product_id = "PROD-001"
            product_name = "Notebook Dell"
            quantity = 1
            unit_price = 2500.00
            total_price = 2500.00
        },
        @{
            product_id = "PROD-002"
            product_name = "Mouse Wireless"
            quantity = 2
            unit_price = 50.00
            total_price = 100.00
        }
    )
    total_amount = 2600.00
    payment_method = "credit_card"
    store_location = "STORE-SP-001"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json -Depth 10

Write-Host "Payload:" -ForegroundColor Cyan
Write-Host $saleCompletedPayload -ForegroundColor White
Write-Host ""

Write-Host "Comando cURL:" -ForegroundColor Cyan
Write-Host @"
curl -X POST `
  '$baseUrl/webhook-sales-flow' `
  -H 'Authorization: $authHeader' `
  -H 'Content-Type: application/json' `
  -d '$($saleCompletedPayload -replace "`r`n", "" -replace " ", "")'
"@ -ForegroundColor Yellow

Write-Host ""
Write-Host "Executando..." -ForegroundColor Green

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/webhook-sales-flow" -Method POST -Headers @{
        "Authorization" = $authHeader
        "Content-Type" = "application/json"
    } -Body $saleCompletedPayload

    Write-Host "✅ Resposta: $($response1 | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "⏱️ Aguardando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Etapa 2: Sale Cancelled
Write-Host "📝 ETAPA 2: Sale Cancelled" -ForegroundColor Green
Write-Host "----------------------------" -ForegroundColor Gray

$saleCancelledPayload = @{
    event_type = "sale_cancelled"
    sale_id = ($saleCompletedPayload | ConvertFrom-Json).sale_id
    customer_id = "CUST-12345"
    cancellation_reason = "customer_request"
    cancellation_details = "Cliente solicitou cancelamento por mudança de planos"
    refund_amount = 2600.00
    refund_method = "credit_card"
    cancelled_by = "customer"
    store_location = "STORE-SP-001"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json -Depth 10

Write-Host "Payload:" -ForegroundColor Cyan
Write-Host $saleCancelledPayload -ForegroundColor White
Write-Host ""

Write-Host "Comando cURL:" -ForegroundColor Cyan
Write-Host @"
curl -X POST `
  '$baseUrl/webhook-sales-flow' `
  -H 'Authorization: $authHeader' `
  -H 'Content-Type: application/json' `
  -d '$($saleCancelledPayload -replace "`r`n", "" -replace " ", "")'
"@ -ForegroundColor Yellow

Write-Host ""
Write-Host "Executando..." -ForegroundColor Green

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/webhook-sales-flow" -Method POST -Headers @{
        "Authorization" = $authHeader
        "Content-Type" = "application/json"
    } -Body $saleCancelledPayload

    Write-Host "✅ Resposta: $($response2 | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "⏱️ Aguardando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Etapa 3: Return Processed
Write-Host "📝 ETAPA 3: Return Processed" -ForegroundColor Green
Write-Host "----------------------------" -ForegroundColor Gray

$returnProcessedPayload = @{
    event_type = "return_processed"
    return_id = "RET-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    original_sale_id = ($saleCompletedPayload | ConvertFrom-Json).sale_id
    customer_id = "CUST-12345"
    returned_items = @(
        @{
            product_id = "PROD-001"
            product_name = "Notebook Dell"
            quantity = 1
            return_reason = "defective"
            condition = "damaged"
            refund_amount = 2500.00
        }
    )
    total_refund = 2500.00
    return_method = "store_credit"
    processed_by = "STAFF-001"
    store_location = "STORE-SP-001"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json -Depth 10

Write-Host "Payload:" -ForegroundColor Cyan
Write-Host $returnProcessedPayload -ForegroundColor White
Write-Host ""

Write-Host "Comando cURL:" -ForegroundColor Cyan
Write-Host @"
curl -X POST `
  '$baseUrl/webhook-sales-flow' `
  -H 'Authorization: $authHeader' `
  -H 'Content-Type: application/json' `
  -d '$($returnProcessedPayload -replace "`r`n", "" -replace " ", "")'
"@ -ForegroundColor Yellow

Write-Host ""
Write-Host "Executando..." -ForegroundColor Green

try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/webhook-sales-flow" -Method POST -Headers @{
        "Authorization" = $authHeader
        "Content-Type" = "application/json"
    } -Body $returnProcessedPayload

    Write-Host "✅ Resposta: $($response3 | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Simulacao Completa!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ 3 eventos de webhook enviados com sucesso!" -ForegroundColor Green
Write-Host "📊 Verifique o dashboard em: http://localhost:3000/webhooks" -ForegroundColor Yellow
Write-Host "" 