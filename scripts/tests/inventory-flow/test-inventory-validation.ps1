# Script de Teste - Validação do Webhook Inventory Flow
# Testa se os erros são retornados corretamente para entidades não encontradas

$webhookUrl = "https://bopytcghbmuywfltmwhk.supabase.co/functions/v1/webhook-inventory-flow"
$token = "banban_webhook_test_2025"

# Carregar os payloads de teste
$testFile = "scripts/test-inventory-flow-validation.json"
$tests = Get-Content $testFile | ConvertFrom-Json

Write-Host "=== Testando Validações do Inventory Flow ===" -ForegroundColor Yellow
Write-Host ""

# Teste 1: Local inválido no inventory_update
Write-Host "Teste 1: Ajuste de estoque com local inválido" -ForegroundColor Cyan
$payload1 = $tests.test_inventory_update_invalid_location | ConvertTo-Json -Depth 10

try {
    $response1 = Invoke-RestMethod -Uri $webhookUrl -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $payload1
    
    Write-Host "❌ FALHA: Deveria ter retornado erro, mas retornou sucesso" -ForegroundColor Red
    Write-Host "Response: $($response1 | ConvertTo-Json)" -ForegroundColor Red
} catch {
    $errorMessage = ""
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMessage = $errorDetails.error
        } catch {
            $errorMessage = $_.ErrorDetails.Message
        }
    } else {
        $errorMessage = $_.Exception.Message
    }
    
    if ($errorMessage -like "*Local com código*não encontrado*") {
        Write-Host "✅ SUCESSO: Erro correto retornado" -ForegroundColor Green
        Write-Host "Mensagem: $errorMessage" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ PARCIAL: Erro retornado, mas mensagem incorreta" -ForegroundColor Yellow
        Write-Host "Mensagem: $errorMessage" -ForegroundColor Gray
    }
}

Write-Host ""

# Teste 2: Variante inválida no inventory_update
Write-Host "Teste 2: Ajuste de estoque com variante inválida" -ForegroundColor Cyan
$payload2 = $tests.test_inventory_update_invalid_variant | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri $webhookUrl -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $payload2
    
    Write-Host "❌ FALHA: Deveria ter retornado erro, mas retornou sucesso" -ForegroundColor Red
    Write-Host "Response: $($response2 | ConvertTo-Json)" -ForegroundColor Red
} catch {
    $errorMessage = ""
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMessage = $errorDetails.error
        } catch {
            $errorMessage = $_.ErrorDetails.Message
        }
    } else {
        $errorMessage = $_.Exception.Message
    }
    
    if ($errorMessage -like "*Variante com código*não encontrada*") {
        Write-Host "✅ SUCESSO: Erro correto retornado" -ForegroundColor Green
        Write-Host "Mensagem: $errorMessage" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ PARCIAL: Erro retornado, mas mensagem incorreta" -ForegroundColor Yellow
        Write-Host "Mensagem: $errorMessage" -ForegroundColor Gray
    }
}

Write-Host ""

# Teste 3: Variante inválida no price_update
Write-Host "Teste 3: Atualização de preço com variante inválida" -ForegroundColor Cyan
$payload3 = $tests.test_price_update_invalid_variant | ConvertTo-Json -Depth 10

try {
    $response3 = Invoke-RestMethod -Uri $webhookUrl -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $payload3
    
    Write-Host "❌ FALHA: Deveria ter retornado erro, mas retornou sucesso" -ForegroundColor Red
    Write-Host "Response: $($response3 | ConvertTo-Json)" -ForegroundColor Red
} catch {
    $errorMessage = ""
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMessage = $errorDetails.error
        } catch {
            $errorMessage = $_.ErrorDetails.Message
        }
    } else {
        $errorMessage = $_.Exception.Message
    }
    
    if ($errorMessage -like "*Variante com código*não encontrada*") {
        Write-Host "✅ SUCESSO: Erro correto retornado" -ForegroundColor Green
        Write-Host "Mensagem: $errorMessage" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ PARCIAL: Erro retornado, mas mensagem incorreta" -ForegroundColor Yellow
        Write-Host "Mensagem: $errorMessage" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Testes de Validação Concluídos ===" -ForegroundColor Yellow 