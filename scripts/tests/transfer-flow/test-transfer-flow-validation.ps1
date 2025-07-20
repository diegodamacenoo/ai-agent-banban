# Teste de Validacao - Sales Flow
# Testa casos negativos: autenticacao, payload malformado, entidades inexistentes

. "$PSScriptRoot\..\config.ps1"

Write-Host "=== TESTE DE VALIDACAO - TRANSFER FLOW ===" -ForegroundColor Cyan
Write-Host "Testando casos negativos e validacoes..." -ForegroundColor Yellow
Write-Host ""

$testResults = @()
$totalTests = 0
$passedTests = 0

# Funcao para executar teste
function Test-ValidationCase {
    param(
        [string]$TestName,
        [hashtable]$Headers,
        [object]$Payload,
        [int]$ExpectedStatus,
        [string]$ExpectedErrorPattern = ""
    )
    
    $global:totalTests++
    Write-Host "Teste: $TestName" -ForegroundColor White
    
    try {
        $body = $null
        if ($Payload) {
            $body = $Payload | ConvertTo-Json -Depth 10
        }
        
        $response = Invoke-RestMethod -Uri $TRANSFER_FLOW_URL -Method POST -Headers $Headers -Body $body -ContentType "application/json" -ErrorAction Stop
        $actualStatus = 200
        $actualMessage = if ($response.error) { $response.error } elseif ($response.message) { $response.message } else { "Success" }
    }
    catch {
        $actualStatus = $_.Exception.Response.StatusCode.value__
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            $actualMessage = if ($errorBody.error) { $errorBody.error } elseif ($errorBody.message) { $errorBody.message } else { "Unknown error" }
        }
        catch {
            $actualMessage = $_.Exception.Message
        }
    }
    
    $passed = $actualStatus -eq $ExpectedStatus
    if ($ExpectedErrorPattern -and $passed) {
        $passed = $actualMessage -match $ExpectedErrorPattern
    }
    
    if ($passed) {
        Write-Host "  PASSOU: Status $actualStatus" -ForegroundColor Green
        $global:passedTests++
        $result = "PASS"
    } else {
        Write-Host "  FALHOU: Esperado $ExpectedStatus, obtido $actualStatus" -ForegroundColor Red
        Write-Host "  Mensagem: $actualMessage" -ForegroundColor Red
        $result = "FAIL"
    }
    
    $global:testResults += [PSCustomObject]@{
        Test = $TestName
        Expected = $ExpectedStatus
        Actual = $actualStatus
        Message = $actualMessage
        Result = $result
    }
    
    Write-Host ""
}

# === TESTES DE AUTENTICACAO ===
Write-Host "1. TESTES DE AUTENTICACAO" -ForegroundColor Magenta

# Sem token
Test-ValidationCase -TestName "Sem token de autenticacao" -Headers @{} -Payload @{
    event_type = "sale_completed"
    data = @{ sale = @{ sale_id = "TEST" } }
} -ExpectedStatus 401 -ExpectedErrorPattern "autenticacao"

# Token invalido
Test-ValidationCase -TestName "Token invalido" -Headers @{
    "Authorization" = "Bearer token_invalido"
} -Payload @{
    event_type = "sale_completed"
    data = @{ sale = @{ sale_id = "TEST" } }
} -ExpectedStatus 401 -ExpectedErrorPattern "autenticacao"

# === TESTES DE PAYLOAD ===
Write-Host "2. TESTES DE PAYLOAD" -ForegroundColor Magenta

# Payload vazio
Test-ValidationCase -TestName "Payload vazio" -Headers $VALID_HEADERS -Payload @{} -ExpectedStatus 400

# Event type nao suportado
Test-ValidationCase -TestName "Event type nao suportado" -Headers $VALID_HEADERS -Payload @{
    event_type = "evento_inexistente"
    data = @{}
} -ExpectedStatus 400 -ExpectedErrorPattern "nao suportado"

# === TESTES DE DADOS INCOMPLETOS ===
Write-Host "3. TESTES DE DADOS INCOMPLETOS" -ForegroundColor Magenta

# Sale completed sem dados de venda
Test-ValidationCase -TestName "Sale completed - sem dados de venda" -Headers $VALID_HEADERS -Payload @{
    event_type = "sale_completed"
    data = @{}
} -ExpectedStatus 500 -ExpectedErrorPattern "incompletos"

# Sale completed sem itens
Test-ValidationCase -TestName "Sale completed - sem itens" -Headers $VALID_HEADERS -Payload @{
    event_type = "sale_completed"
    data = @{
        sale = @{
            sale_id = "TEST-001"
            store_code = "STORE001"
        }
    }
} -ExpectedStatus 500 -ExpectedErrorPattern "incompletos"

# Sale cancelled sem dados de cancelamento
Test-ValidationCase -TestName "Sale cancelled - sem dados de cancelamento" -Headers $VALID_HEADERS -Payload @{
    event_type = "sale_cancelled"
    data = @{
        sale = @{ sale_id = "TEST-001" }
    }
} -ExpectedStatus 500 -ExpectedErrorPattern "incompletos"

# Return processed sem dados de devolucao
Test-ValidationCase -TestName "Return processed - sem dados de devolucao" -Headers $VALID_HEADERS -Payload @{
    event_type = "return_processed"
    data = @{}
} -ExpectedStatus 500 -ExpectedErrorPattern "incompletos"

# Return processed sem location codes
Test-ValidationCase -TestName "Return processed - sem location codes" -Headers $VALID_HEADERS -Payload @{
    event_type = "return_processed"
    data = @{
        return = @{
            return_id = "TEST-001"
            original_sale_id = "SALE-001"
        }
        return_items = @(
            @{ variant_code = "VAR001"; quantity_returned = 1 }
        )
    }
} -ExpectedStatus 500 -ExpectedErrorPattern "location_code.*obrigatorios"

# === TESTES DE ENTIDADES INEXISTENTES ===
Write-Host "4. TESTES DE ENTIDADES INEXISTENTES" -ForegroundColor Magenta

# Location inexistente
Test-ValidationCase -TestName "Location inexistente" -Headers $VALID_HEADERS -Payload @{
    event_type = "sale_completed"
    data = @{
        sale = @{
            sale_id = "TEST-001"
            store_code = "LOCATION_INEXISTENTE"
            total_amount = 100
        }
        items = @(
            @{
                variant_code = "VAR001"
                quantity_sold = 1
                unit_price = 100
            }
        )
    }
} -ExpectedStatus 500 -ExpectedErrorPattern "Local.*nao encontrado"

# Variant inexistente
Test-ValidationCase -TestName "Variant inexistente" -Headers $VALID_HEADERS -Payload @{
    event_type = "sale_completed"
    data = @{
        sale = @{
            sale_id = "TEST-001"
            store_code = "STORE001"
            total_amount = 100
        }
        items = @(
            @{
                variant_code = "VARIANT_INEXISTENTE"
                quantity_sold = 1
                unit_price = 100
            }
        )
    }
} -ExpectedStatus 500 -ExpectedErrorPattern "Variante.*nao encontrada"

# Venda inexistente para cancelamento
Test-ValidationCase -TestName "Venda inexistente para cancelamento" -Headers $VALID_HEADERS -Payload @{
    event_type = "sale_cancelled"
    data = @{
        sale = @{
            sale_id = "VENDA_INEXISTENTE"
        }
        cancellation = @{
            cancellation_reason = "Teste"
            cancelled_by = "MANAGER001"
        }
    }
} -ExpectedStatus 500 -ExpectedErrorPattern "nao encontrada"

# === RESUMO DOS RESULTADOS ===
Write-Host "=== RESUMO DOS TESTES DE VALIDACAO ===" -ForegroundColor Cyan
Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Testes aprovados: $passedTests" -ForegroundColor Green
Write-Host "Testes falharam: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host ""

if ($totalTests -eq $passedTests) {
    Write-Host "TODOS OS TESTES DE VALIDACAO PASSARAM!" -ForegroundColor Green
} else {
    Write-Host "ALGUNS TESTES FALHARAM - Verifique os detalhes acima" -ForegroundColor Red
    
    Write-Host "`nTestes que falharam:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test): Esperado $($_.Expected), obtido $($_.Actual)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Teste de validacao do Sales Flow concluido." -ForegroundColor Cyan 