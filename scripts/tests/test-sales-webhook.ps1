#!/usr/bin/env pwsh

Write-Host "Testando Sales Webhook..." -ForegroundColor Green

$baseUrl = "https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-sales-flow"
$authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTA4NzUsImV4cCI6MjA2MTg4Njg3NX0.NTQzZanJrEipj_ylVohXFYSACY4M65zVDcux7eRUOXY"

$payload = @{
    event_type = "sale_completed"
    sale_id = "SALE-TEST-$(Get-Date -Format 'HHmmss')"
    customer_id = "CUST-12345"
    items = @(
        @{
            product_id = "PROD-001"
            product_name = "Notebook Dell"
            quantity = 1
            unit_price = 2500.00
            total_price = 2500.00
        }
    )
    total_amount = 2500.00
    payment_method = "credit_card"
    store_location = "STORE-SP-001"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json -Depth 10

Write-Host "Enviando webhook..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers @{
        "Authorization" = $authHeader
        "Content-Type" = "application/json"
    } -Body $payload

    Write-Host "Sucesso! Resposta:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Verifique o dashboard em: http://localhost:3000/webhooks" -ForegroundColor Cyan 