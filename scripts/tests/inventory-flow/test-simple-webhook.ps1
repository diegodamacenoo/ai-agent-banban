# Teste muito simples do webhook
$url = "https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory-flow"
$headers = @{
    "Authorization" = "Bearer banban_webhook_test_2025"
    "Content-Type" = "application/json"
}

# Payload mínimo para testar
$payload = @{
    event_type = "product_sync"
    timestamp = "2025-01-20T10:00:00Z"
    data = @{
        product_sync = @{
            products = @(
                @{
                    product_code = "TEST001"
                    product_name = "Produto Teste Simples"
                    status = "ACTIVE"
                    variants = @(
                        @{
                            variant_code = "TEST001-VAR1"
                            sku = "TEST001-SKU"
                            status = "ACTIVE"
                        }
                    )
                }
            )
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "=== Teste Mínimo: Product Sync ===" -ForegroundColor Cyan
Write-Host "Payload enviado:" -ForegroundColor Gray
Write-Host $payload -ForegroundColor DarkGray

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $payload
    Write-Host "✅ SUCESSO: Webhook funcionou" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
} 