# Teste positivo do webhook inventory-flow
$url = "https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory-flow"
$headers = @{
    "Authorization" = "Bearer banban_webhook_test_2025"
    "Content-Type" = "application/json"
}

$payload = @{
    event_type = "product_sync"
    timestamp = "2025-01-20T10:00:00Z"
    data = @{
        product_sync = @{
            products = @(
                @{
                    product_code = "TESTE001"
                    product_name = "Produto Teste"
                    category = "Categoria Teste"
                    brand = "Marca Teste"
                    description = "Descrição do produto teste"
                    status = "ACTIVE"
                    variants = @(
                        @{
                            variant_code = "TESTE001-VAR1"
                            variant_name = "Variante 1"
                            sku = "TESTE001-VAR1-SKU"
                            barcode = "123456789"
                            unit_measure = "UN"
                            weight = 1.5
                            dimensions = @{
                                length = 10
                                width = 5
                                height = 3
                            }
                            attributes = @{
                                color = "Azul"
                                size = "M"
                            }
                            status = "ACTIVE"
                        }
                    )
                }
            )
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "=== Teste Positivo: Product Sync ===" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $payload
    Write-Host "✅ SUCESSO: Webhook funcionou corretamente" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO: Falha inesperada" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
} 