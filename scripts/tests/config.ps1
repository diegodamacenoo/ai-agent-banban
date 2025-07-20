# Configuração Centralizada para Testes de Webhook
# Arquivo: scripts/tests/config.ps1

# URLs base
$SUPABASE_URL = "https://bopytcghbmuywfltmwhk.supabase.co"
$FUNCTIONS_BASE_URL = "$SUPABASE_URL/functions/v1"

# Endpoints dos webhooks
$WEBHOOKS = @{
    "inventory-flow" = "$FUNCTIONS_BASE_URL/webhook-inventory-flow"
    "purchase-flow"  = "$FUNCTIONS_BASE_URL/webhook-purchase-flow"
    "sales-flow"     = "$FUNCTIONS_BASE_URL/webhook-sales-flow"
    "transfer-flow"  = "$FUNCTIONS_BASE_URL/webhook-transfer-flow"
}

# URLs individuais para compatibilidade com scripts específicos
$INVENTORY_FLOW_URL = $WEBHOOKS["inventory-flow"]
$PURCHASE_FLOW_URL = $WEBHOOKS["purchase-flow"]
$SALES_FLOW_URL = $WEBHOOKS["sales-flow"]
$TRANSFER_FLOW_URL = $WEBHOOKS["transfer-flow"]

# Autenticação
$AUTH_TOKEN = "banban_webhook_test_2025"

# Headers padrão
$HEADERS = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "Content-Type"  = "application/json"
}

# Headers válidos para testes de validação
$VALID_HEADERS = $HEADERS
$headers = $HEADERS  # Compatibilidade com scripts existentes

# Configurações de teste
$TEST_CONFIG = @{
    "timeout" = 30  # segundos
    "retries" = 3
    "verbose" = $true
}

# Função auxiliar para fazer requisições
function Invoke-WebhookTest {
    param(
        [string]$WebhookName,
        [hashtable]$Payload,
        [switch]$ExpectError
    )
    
    if (-not $WEBHOOKS.ContainsKey($WebhookName)) {
        throw "Webhook '$WebhookName' não encontrado. Webhooks disponíveis: $($WEBHOOKS.Keys -join ', ')"
    }
    
    $url = $WEBHOOKS[$WebhookName]
    $body = $Payload | ConvertTo-Json -Depth 10 -Compress
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method POST -Headers $HEADERS -Body $body -TimeoutSec $TEST_CONFIG.timeout
        
        if ($ExpectError) {
            Write-Host "❌ FALHA: Deveria ter retornado erro, mas retornou sucesso" -ForegroundColor Red
            return @{ Success = $false; Message = "Deveria ter falhado mas teve sucesso"; Response = $response }
        }
        
        $result = $response.Content | ConvertFrom-Json
        Write-Host "✅ SUCESSO: Webhook funcionou corretamente" -ForegroundColor Green
        return @{ Success = $true; Message = "Sucesso"; Response = $result }
        
    } catch {
        if ($ExpectError) {
            Write-Host "✅ SUCESSO: Erro retornado conforme esperado" -ForegroundColor Green
            return @{ Success = $true; Message = "Erro esperado"; Error = $_.Exception.Message }
        }
        
        Write-Host "❌ ERRO: Falha inesperada" -ForegroundColor Red
        return @{ Success = $false; Message = "Erro inesperado"; Error = $_.Exception.Message }
    }
}

# Função para exibir resultado formatado
function Show-TestResult {
    param(
        [hashtable]$Result,
        [string]$TestName
    )
    
    Write-Host "`n=== $TestName ===" -ForegroundColor Cyan
    
    if ($Result.Success) {
        Write-Host "Status: ✅ SUCESSO" -ForegroundColor Green
    } else {
        Write-Host "Status: ❌ FALHA" -ForegroundColor Red
    }
    
    Write-Host "Mensagem: $($Result.Message)" -ForegroundColor White
    
    if ($Result.Response) {
        Write-Host "Response:" -ForegroundColor Yellow
        $Result.Response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    }
    
    if ($Result.Error) {
        Write-Host "Erro: $($Result.Error)" -ForegroundColor Red
    }
}

Write-Host "Configuração de testes carregada com sucesso!" -ForegroundColor Green
Write-Host "Webhooks disponíveis: $($WEBHOOKS.Keys -join ', ')" -ForegroundColor Cyan 