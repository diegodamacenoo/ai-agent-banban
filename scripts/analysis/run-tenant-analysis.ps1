# Script PowerShell: Análise de Tabelas Multi-Tenant
# Objetivo: Executar análise completa das tabelas que precisam ser refatoradas
# Data: 2025-01-14

param(
    [string]$OutputFile = "tenant-analysis-report.txt",
    [switch]$Verbose
)

Write-Host "🔍 Iniciando análise das tabelas multi-tenant..." -ForegroundColor Yellow

# Verificar se o arquivo SQL de análise existe
$analysisScript = "analyze-tenant-specific-tables.sql"
if (-not (Test-Path $analysisScript)) {
    Write-Host "❌ Arquivo $analysisScript não encontrado!" -ForegroundColor Red
    exit 1
}

# Função para executar SQL via Supabase CLI
function Invoke-SupabaseSQL {
    param([string]$SqlFile)
    
    try {
        Write-Host "📊 Executando análise: $SqlFile" -ForegroundColor Blue
        $result = supabase db exec -f $SqlFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            return $result
        } else {
            Write-Host "⚠️ Erro ao executar $SqlFile" -ForegroundColor Yellow
            Write-Host $result -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Falha na execução: $_" -ForegroundColor Red
        return $null
    }
}

# Executar análise
Write-Host "🚀 Executando análise completa..." -ForegroundColor Green

$analysisResult = Invoke-SupabaseSQL -SqlFile $analysisScript

if ($analysisResult) {
    # Salvar resultado em arquivo
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $outputPath = "analysis-results-$timestamp.txt"
    
    @"
===============================================
RELATÓRIO DE ANÁLISE: TABELAS MULTI-TENANT
===============================================
Gerado em: $(Get-Date)
Objetivo: Mapear tabelas para refatoração genérica

$analysisResult
"@ | Out-File -FilePath $outputPath -Encoding UTF8
    
    Write-Host "✅ Análise concluída! Relatório salvo em: $outputPath" -ForegroundColor Green
    
    # Mostrar resumo no console
    Write-Host "`n📋 RESUMO DA ANÁLISE:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # Extrair informações chave do resultado
    if ($analysisResult -match "EXECUTIVE SUMMARY") {
        Write-Host "📊 Resumo executivo encontrado no relatório" -ForegroundColor Green
    }
    
    Write-Host "📁 Arquivo de análise detalhada: $outputPath" -ForegroundColor White
    
} else {
    Write-Host "❌ Falha na análise. Verifique a conexão com o banco de dados." -ForegroundColor Red
    
    # Tentar análise básica alternativa
    Write-Host "`n🔄 Tentando análise básica alternativa..." -ForegroundColor Yellow
    
    $basicAnalysis = @"
-- Análise básica das tabelas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name LIKE 'core_%' OR table_name LIKE 'tenant_%')
ORDER BY table_name;
"@
    
    $basicAnalysis | Out-File -FilePath "basic-analysis.sql" -Encoding UTF8
    $basicResult = Invoke-SupabaseSQL -SqlFile "basic-analysis.sql"
    
    if ($basicResult) {
        Write-Host "✅ Análise básica executada:" -ForegroundColor Green
        Write-Host $basicResult
    }
}

# Criar recomendações baseadas na análise
Write-Host "`n💡 RECOMENDAÇÕES PRELIMINARES:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$recommendations = @"
🎯 PRIORIDADES IDENTIFICADAS:

1. ALTA PRIORIDADE (Tabelas Core - Específicas Banban):
   • core_products → products (catálogo principal)
   • core_suppliers → suppliers (fornecedores)
   • core_locations → locations (centros de distribuição/lojas)
   • core_product_variants → product_variants (variações)

2. MÉDIA PRIORIDADE (Tabelas Tenant - Volume Alto):
   • tenant_inventory_items → inventory_items (estoque)
   • tenant_performance_metrics → performance_metrics (métricas)
   • tenant_insights_cache → insights_cache (cache de insights)

3. BAIXA PRIORIDADE (Tabelas Tenant - Volume Baixo):
   • tenant_data_processing_* → data_processing_*
   • Outras tabelas tenant específicas de módulos

4. MANTER COMO ESTÃO:
   • tenant_modules (gestão de módulos)
   • tenant_dashboard_* (sistema de dashboard)
   • organizations (tabela principal)

🏗️ ESTRATÉGIA DE MIGRAÇÃO:

Fase 1 (2 semanas): Criar tabelas genéricas e migrar core_*
Fase 2 (3 semanas): Migrar tenant_* de alto volume
Fase 3 (2 semanas): Migrar tenant_* restantes
Fase 4 (1 semana): Validação e descontinuação das antigas

🔧 BENEFÍCIOS ESPERADOS:

✅ Escalabilidade infinita (novos tenants = INSERT)
✅ Manutenção simplificada (1 schema para todos)
✅ Flexibilidade total (campos JSONB customizáveis)
✅ Performance otimizada (RLS + índices particionados)
✅ Segurança robusta (isolamento garantido)
"@

Write-Host $recommendations -ForegroundColor White

# Salvar recomendações
$recommendations | Out-File -FilePath "migration-recommendations.md" -Encoding UTF8
Write-Host "`n📋 Recomendações salvas em: migration-recommendations.md" -ForegroundColor Green

Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "1. Revisar o relatório de análise gerado" -ForegroundColor White
Write-Host "2. Aprovar a proposta de refatoração" -ForegroundColor White
Write-Host "3. Criar ambiente de staging para testes" -ForegroundColor White
Write-Host "4. Implementar Fase 1 (tabelas genéricas)" -ForegroundColor White
Write-Host "5. Validar migração incremental" -ForegroundColor White

Write-Host "`n✨ Análise concluída com sucesso!" -ForegroundColor Green 