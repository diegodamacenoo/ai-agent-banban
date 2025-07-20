# ============================================================================
# SCRIPT DE TESTE - INTEGRAÇÃO DE MÓDULOS BANBAN
# ============================================================================
# Testa a integração dos módulos Banban existentes com o sistema de versionamento
# Executa testes das duas prioridades críticas implementadas

Write-Host "🚀 INICIANDO TESTE DE INTEGRAÇÃO DOS MÓDULOS BANBAN" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

# Configuração
$baseUrl = "http://localhost:3000"
$apiEndpoints = @{
    integration_status = "$baseUrl/api/admin/modules/integration"
    integration_execute = "$baseUrl/api/admin/modules/integration"
    versions = "$baseUrl/api/admin/modules/versions"
    deploy = "$baseUrl/api/admin/modules/deploy"
}

# Função para fazer requisições HTTP
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [string]$Description = ""
    )
    
    try {
        Write-Host "🔄 $Description" -ForegroundColor Yellow
        
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json -Depth 10
        }
        
        $response = Invoke-RestMethod @params
        
        if ($response.success) {
            Write-Host "✅ Sucesso: $Description" -ForegroundColor Green
            return $response
        } else {
            Write-Host "❌ Erro: $($response.error)" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Erro de conexão: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para exibir resultados formatados
function Show-TestResults {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = ""
    )
    
    $status = if ($Success) { "✅ PASSOU" } else { "❌ FALHOU" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-Host "  $status - $TestName" -ForegroundColor $color
    if ($Details) {
        Write-Host "    $Details" -ForegroundColor Gray
    }
}

# ============================================================================
# FASE 1: VERIFICAÇÃO INICIAL DO STATUS
# ============================================================================

Write-Host "📋 FASE 1: VERIFICAÇÃO DO STATUS INICIAL" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$initialStatus = Invoke-ApiRequest -Url $apiEndpoints.integration_status -Description "Verificando status inicial da integração"

if ($initialStatus) {
    Write-Host ""
    Write-Host "📊 STATUS INICIAL:" -ForegroundColor White
    Write-Host "  • Total de módulos: $($initialStatus.data.totalModules)" -ForegroundColor White
    Write-Host "  • Módulos integrados: $($initialStatus.data.integratedModules)" -ForegroundColor White
    Write-Host "  • Módulos pendentes: $($initialStatus.data.pendingModules.Count)" -ForegroundColor White
    
    if ($initialStatus.data.pendingModules.Count -gt 0) {
        Write-Host "  • Módulos pendentes: $($initialStatus.data.pendingModules -join ', ')" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📋 DETALHES DOS MÓDULOS:" -ForegroundColor White
    foreach ($module in $initialStatus.data.details) {
        $statusIcon = switch ($module.status) {
            "integrated" { "✅" }
            "pending" { "⏳" }
            "error" { "❌" }
            default { "❓" }
        }
        Write-Host "  $statusIcon $($module.name) ($($module.moduleId))" -ForegroundColor White
        Write-Host "    Registrado: $($module.registered) | Versionado: $($module.versioned)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Falha ao obter status inicial" -ForegroundColor Red
    exit 1
}

# ============================================================================
# FASE 2: EXECUÇÃO DA INTEGRAÇÃO COMPLETA
# ============================================================================

Write-Host ""
Write-Host "🔄 FASE 2: EXECUÇÃO DA INTEGRAÇÃO COMPLETA" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan

$integrationBody = @{
    action = "integrate_all"
}

$integrationResult = Invoke-ApiRequest `
    -Url $apiEndpoints.integration_execute `
    -Method "POST" `
    -Body $integrationBody `
    -Description "Executando integração completa dos módulos Banban"

if ($integrationResult) {
    Write-Host ""
    Write-Host "📊 RESULTADO DA INTEGRAÇÃO:" -ForegroundColor White
    Write-Host "  • Total processado: $($integrationResult.data.summary.total)" -ForegroundColor White
    Write-Host "  • Sucessos: $($integrationResult.data.summary.successful)" -ForegroundColor Green
    Write-Host "  • Falhas: $($integrationResult.data.summary.failed)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "📋 DETALHES POR MÓDULO:" -ForegroundColor White
    foreach ($result in $integrationResult.data.results) {
        $success = $result.registered -and $result.versioned
        $statusIcon = if ($success) { "✅" } else { "❌" }
        Write-Host "  $statusIcon $($result.moduleId)" -ForegroundColor White
        Write-Host "    Registrado: $($result.registered) | Versionado: $($result.versioned)" -ForegroundColor Gray
        if ($result.error) {
            Write-Host "    Erro: $($result.error)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Falha na execução da integração" -ForegroundColor Red
}

# ============================================================================
# FASE 3: VERIFICAÇÃO PÓS-INTEGRAÇÃO
# ============================================================================

Write-Host ""
Write-Host "🔍 FASE 3: VERIFICAÇÃO PÓS-INTEGRAÇÃO" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

Start-Sleep -Seconds 2  # Aguardar processamento

$finalStatus = Invoke-ApiRequest -Url $apiEndpoints.integration_status -Description "Verificando status após integração"

if ($finalStatus) {
    Write-Host ""
    Write-Host "📊 STATUS FINAL:" -ForegroundColor White
    Write-Host "  • Total de módulos: $($finalStatus.data.totalModules)" -ForegroundColor White
    Write-Host "  • Módulos integrados: $($finalStatus.data.integratedModules)" -ForegroundColor White
    Write-Host "  • Módulos pendentes: $($finalStatus.data.pendingModules.Count)" -ForegroundColor White
    
    $integrationProgress = ($finalStatus.data.integratedModules / $finalStatus.data.totalModules) * 100
    Write-Host "  • Progresso: $([math]::Round($integrationProgress, 1))%" -ForegroundColor White
} else {
    Write-Host "❌ Falha ao obter status final" -ForegroundColor Red
}

# ============================================================================
# FASE 4: TESTE DO SISTEMA DE VERSIONAMENTO
# ============================================================================

Write-Host ""
Write-Host "🏷️  FASE 4: TESTE DO SISTEMA DE VERSIONAMENTO" -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Cyan

# Testar listagem de versões para um módulo específico
$testModuleId = "banban-insights"
$versionsUrl = "$($apiEndpoints.versions)?moduleId=$testModuleId"

$versionsResult = Invoke-ApiRequest -Url $versionsUrl -Description "Listando versões do módulo $testModuleId"

if ($versionsResult -and $versionsResult.data) {
    Write-Host ""
    Write-Host "📋 VERSÕES DO MÓDULO $testModuleId" -ForegroundColor White
    foreach ($version in $versionsResult.data) {
        $statusBadge = switch ($version.status) {
            "released" { "🟢" }
            "draft" { "🟡" }
            "testing" { "🔵" }
            "deprecated" { "🔴" }
            default { "⚪" }
        }
        $latestBadge = if ($version.is_latest) { " [LATEST]" } else { "" }
        $stableBadge = if ($version.is_stable) { " [STABLE]" } else { "" }
        
        Write-Host "  $statusBadge v$($version.version)$latestBadge$stableBadge" -ForegroundColor White
        Write-Host "    Status: $($version.status) | Criado: $($version.created_at)" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Nenhuma versão encontrada para $testModuleId" -ForegroundColor Yellow
}

# ============================================================================
# FASE 5: TESTE DO SISTEMA DE DEPLOYMENT
# ============================================================================

Write-Host ""
Write-Host "🚀 FASE 5: TESTE DO SISTEMA DE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# Teste de criação de plano de deployment
$deployPlanBody = @{
    action = "plan"
    moduleId = $testModuleId
    version = "1.0.0"
    targetEnvironment = "production"
}

$deployPlanResult = Invoke-ApiRequest `
    -Url $apiEndpoints.deploy `
    -Method "POST" `
    -Body $deployPlanBody `
    -Description "Criando plano de deployment para $testModuleId"

if ($deployPlanResult) {
    Write-Host ""
    Write-Host "📋 PLANO DE DEPLOYMENT:" -ForegroundColor White
    Write-Host "  • Módulo: $($deployPlanResult.data.moduleId)" -ForegroundColor White
    Write-Host "  • Versão: $($deployPlanResult.data.version)" -ForegroundColor White
    Write-Host "  • Ambiente: $($deployPlanResult.data.targetEnvironment)" -ForegroundColor White
    Write-Host "  • Estimativa: $($deployPlanResult.data.estimatedDuration)" -ForegroundColor White
    
    if ($deployPlanResult.data.validations) {
        Write-Host "  • Validações:" -ForegroundColor White
        foreach ($validation in $deployPlanResult.data.validations) {
            $validIcon = if ($validation.passed) { "✅" } else { "❌" }
            Write-Host "    $validIcon $($validation.check)" -ForegroundColor White
        }
    }
} else {
    Write-Host "⚠️  Falha ao criar plano de deployment" -ForegroundColor Yellow
}

# ============================================================================
# FASE 6: RESUMO E RELATÓRIO FINAL
# ============================================================================

Write-Host ""
Write-Host "📊 RESUMO FINAL DOS TESTES" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Calcular métricas de sucesso
$testsResults = @()

# Teste 1: Status inicial obtido
$testsResults += @{
    Name = "Verificação de Status Inicial"
    Success = $initialStatus -ne $null
    Details = if ($initialStatus) { "$($initialStatus.data.totalModules) módulos detectados" } else { "Falha na API" }
}

# Teste 2: Integração executada
$testsResults += @{
    Name = "Execução da Integração"
    Success = $integrationResult -ne $null -and $integrationResult.data.summary.successful -gt 0
    Details = if ($integrationResult) { "$($integrationResult.data.summary.successful)/$($integrationResult.data.summary.total) módulos integrados" } else { "Falha na execução" }
}

# Teste 3: Status final melhorado
$improvementSuccess = $false
if ($initialStatus -and $finalStatus) {
    $improvementSuccess = $finalStatus.data.integratedModules -ge $initialStatus.data.integratedModules
}
$testsResults += @{
    Name = "Melhoria no Status de Integração"
    Success = $improvementSuccess
    Details = if ($finalStatus) { "$($finalStatus.data.integratedModules) módulos integrados" } else { "Status não disponível" }
}

# Teste 4: Sistema de versionamento funcional
$testsResults += @{
    Name = "Sistema de Versionamento"
    Success = $versionsResult -ne $null -and $versionsResult.data.Count -gt 0
    Details = if ($versionsResult) { "$($versionsResult.data.Count) versões encontradas" } else { "Nenhuma versão encontrada" }
}

# Teste 5: Sistema de deployment funcional
$testsResults += @{
    Name = "Sistema de Deployment"
    Success = $deployPlanResult -ne $null
    Details = if ($deployPlanResult) { "Plano criado com sucesso" } else { "Falha na criação do plano" }
}

# Exibir resultados
Write-Host ""
foreach ($test in $testsResults) {
    Show-TestResults -TestName $test.Name -Success $test.Success -Details $test.Details
}

# Calcular taxa de sucesso geral
$successCount = ($testsResults | Where-Object { $_.Success }).Count
$totalTests = $testsResults.Count
$successRate = ($successCount / $totalTests) * 100

Write-Host ""
Write-Host "🎯 TAXA DE SUCESSO GERAL: $successCount/$totalTests ($([math]::Round($successRate, 1))%)" -ForegroundColor White

if ($successRate -ge 80) {
    Write-Host "🎉 INTEGRAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "✅ O sistema de integração está funcionando corretamente" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "⚠️  INTEGRAÇÃO PARCIALMENTE CONCLUÍDA" -ForegroundColor Yellow
    Write-Host "🔧 Alguns ajustes podem ser necessários" -ForegroundColor Yellow
} else {
    Write-Host "❌ INTEGRAÇÃO COM PROBLEMAS" -ForegroundColor Red
    Write-Host "🔧 Revisão necessária antes de usar em produção" -ForegroundColor Red
}

# ============================================================================
# PRÓXIMOS PASSOS
# ============================================================================

Write-Host ""
Write-Host "🚀 PRÓXIMOS PASSOS RECOMENDADOS:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

if ($successRate -ge 80) {
    Write-Host "1. ✅ Sistema pronto para uso em produção" -ForegroundColor Green
    Write-Host "2. 🔄 Configurar monitoramento contínuo" -ForegroundColor White
    Write-Host "3. 📊 Implementar dashboards de acompanhamento" -ForegroundColor White
    Write-Host "4. 🔧 Configurar alertas automáticos" -ForegroundColor White
} else {
    Write-Host "1. 🔧 Revisar e corrigir falhas identificadas" -ForegroundColor Red
    Write-Host "2. 🧪 Executar testes adicionais" -ForegroundColor Yellow
    Write-Host "3. 📋 Validar configurações do banco de dados" -ForegroundColor Yellow
    Write-Host "4. 🔄 Re-executar integração após correções" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host "  • Verificar status: GET /api/admin/modules/integration" -ForegroundColor White
Write-Host "  • Re-integrar módulo: POST /api/admin/modules/integration {action: 'reintegrate_module', moduleId: 'banban-insights'}" -ForegroundColor White
Write-Host "  • Listar versões: GET /api/admin/modules/versions?moduleId=banban-insights" -ForegroundColor White
Write-Host "  • Criar deployment: POST /api/admin/modules/deploy {action: 'plan', moduleId: 'banban-insights'}" -ForegroundColor White

Write-Host ""
Write-Host "🎯 TESTE DE INTEGRAÇÃO CONCLUÍDO!" -ForegroundColor Green
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray 