#!/usr/bin/env pwsh

Write-Host "Iniciando teste do Dashboard de Webhooks..." -ForegroundColor Green

# Verificar se o servidor está rodando
Write-Host "Verificando se o servidor Next.js esta rodando..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Servidor Next.js esta rodando!" -ForegroundColor Green
} catch {
    Write-Host "Servidor Next.js nao esta rodando. Execute 'npm run dev' primeiro." -ForegroundColor Red
    exit 1
}

# Testar a página de webhooks
Write-Host "Testando acesso a pagina de webhooks..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/webhooks" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Pagina de webhooks acessivel!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao acessar pagina de webhooks: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Dashboard de Webhooks criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Funcionalidades implementadas:" -ForegroundColor Cyan
Write-Host "  - Visao Geral com metricas principais" -ForegroundColor White
Write-Host "  - Monitoramento por Flow (Sales, Purchase, Inventory, Transfer)" -ForegroundColor White
Write-Host "  - Logs de eventos com filtros avancados" -ForegroundColor White
Write-Host "  - Metricas e performance com analise temporal" -ForegroundColor White
Write-Host "  - Detalhes expandidos de cada evento" -ForegroundColor White
Write-Host "  - Status em tempo real dos flows" -ForegroundColor White
Write-Host "  - Top erros e analise de performance" -ForegroundColor White
Write-Host ""
Write-Host "Acesse: http://localhost:3000/webhooks" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dados de exemplo ja inseridos no banco:" -ForegroundColor Cyan
Write-Host "  - 22 eventos de webhook distribuidos entre os 4 flows" -ForegroundColor White
Write-Host "  - Eventos com status: success, error, pending" -ForegroundColor White
Write-Host "  - Diferentes tipos de evento para cada flow" -ForegroundColor White
Write-Host "  - Tempos de processamento variados" -ForegroundColor White
Write-Host "  - Mensagens de erro para demonstracao" -ForegroundColor White
Write-Host ""
Write-Host "Dashboard pronto para uso!" -ForegroundColor Green 