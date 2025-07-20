# Análise de Dependências das Tabelas Core_*
# Este script analisa quais foreign keys impedem a exclusão das tabelas core_*

param(
    [string]$ConfigFile = "config/config.ps1",
    [switch]$GenerateReport = $true,
    [switch]$ExportSql = $true
)

# Importar configurações
if (Test-Path $ConfigFile) {
    . $ConfigFile
} else {
    Write-Error "❌ Arquivo de configuração não encontrado: $ConfigFile"
    exit 1
}

# Verificar se psql está disponível
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "❌ psql não encontrado. Instale o PostgreSQL client."
    exit 1
}

Write-Host "🔍 ANÁLISE DE DEPENDÊNCIAS - TABELAS CORE_*" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

# Preparar comando psql
$psqlArgs = @(
    "-h", $env:SUPABASE_DB_HOST
    "-p", $env:SUPABASE_DB_PORT
    "-d", $env:SUPABASE_DB_NAME
    "-U", $env:SUPABASE_DB_USER
    "--no-password"
    "-f", "scripts/migration/check-foreign-keys-core-tables.sql"
)

# Definir arquivo de log
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "logs/core-table-dependencies-$timestamp.log"

# Criar diretório de logs se não existir
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host "📋 Executando análise de foreign keys..." -ForegroundColor Cyan

try {
    # Executar análise
    $env:PGPASSWORD = $env:SUPABASE_DB_PASSWORD
    $output = & psql @psqlArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Análise executada com sucesso!" -ForegroundColor Green
        
        # Salvar output no log
        $output | Out-File -FilePath $logFile -Encoding UTF8
        
        # Mostrar resultado na tela
        Write-Host ""
        Write-Host "📊 RESULTADO DA ANÁLISE:" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Yellow
        $output
        
    } else {
        Write-Host "❌ Erro ao executar análise:" -ForegroundColor Red
        $output
        exit 1
    }
    
} catch {
    Write-Host "❌ Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Limpar variável de senha
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

# Gerar relatório detalhado se solicitado
if ($GenerateReport) {
    Write-Host ""
    Write-Host "📝 Gerando relatório detalhado..." -ForegroundColor Cyan
    
    $reportFile = "logs/core-table-cleanup-report-$timestamp.md"
    
    $reportContent = @"
# Relatório de Análise - Dependências das Tabelas Core_*

**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Script:** check-foreign-keys-core-tables.sql  
**Log:** $logFile  

## Resumo Executivo

Este relatório identifica todas as dependências (foreign keys) que impedem a exclusão das tabelas `core_*` do banco de dados.

## Resultados da Análise

``````
$($output -join "`n")
``````

## Próximos Passos

### Fase 1: Preparação
1. ✅ Aplicar migração para criar tabelas genéricas
2. ✅ Migrar dados das tabelas core_* para tenant_business_*
3. ⚠️ Validar integridade dos dados migrados

### Fase 2: Refatoração Pendente
1. Refatorar webhooks restantes
2. Atualizar componentes UI
3. Migrar Daily ETL functions

### Fase 3: Limpeza
1. Remover foreign keys (comandos gerados acima)
2. Excluir tabelas core_* em ordem específica
3. Limpar scripts e documentação legacy

## Arquivos Relacionados

- **Análise principal:** docs/implementations/database/TABLE_CLEANUP_ANALYSIS.md
- **Scripts de migração:** scripts/migration/phase1-create-generic-tables.sql
- **Scripts de dados:** scripts/migration/phase2-migrate-data.sql
- **Aplicação:** scripts/migration/apply-phase1-generic-tables.ps1

## Critérios de Segurança

⚠️ **NUNCA excluir uma tabela até:**
- Migração de dados 100% validada
- Todas as referências refatoradas  
- Testes de regressão aprovados
- Backup completo realizado

---
*Relatório gerado automaticamente por analyze-core-table-dependencies.ps1*
"@

    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Host "✅ Relatório salvo em: $reportFile" -ForegroundColor Green
}

# Exportar comandos SQL para remoção se solicitado
if ($ExportSql) {
    Write-Host ""
    Write-Host "📤 Exportando comandos SQL para remoção..." -ForegroundColor Cyan
    
    $sqlFile = "scripts/migration/drop-core-table-constraints.sql"
    
    $sqlContent = @"
-- Comandos para remoção de Foreign Keys das tabelas core_*
-- Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- 
-- ⚠️ ATENÇÃO: Execute estes comandos APENAS após:
-- 1. Migração completa dos dados para tabelas genéricas
-- 2. Refatoração de todo o código
-- 3. Validação completa do sistema
-- 4. Backup completo do banco de dados

-- Extrair comandos do output da análise
"@

    # Filtrar linhas que contêm comandos ALTER TABLE
    $alterCommands = $output | Where-Object { $_ -match "ALTER TABLE.*DROP CONSTRAINT" }
    $dropCommands = $output | Where-Object { $_ -match "DROP TABLE.*CASCADE" }
    
    if ($alterCommands.Count -gt 0) {
        $sqlContent += "`n-- Remover Foreign Key Constraints`n"
        $sqlContent += ($alterCommands -join "`n")
    }
    
    if ($dropCommands.Count -gt 0) {
        $sqlContent += "`n`n-- Excluir Tabelas Core_*`n"
        $sqlContent += ($dropCommands -join "`n")
    }
    
    $sqlContent += "`n`n-- Fim dos comandos gerados"
    
    $sqlContent | Out-File -FilePath $sqlFile -Encoding UTF8
    Write-Host "✅ Comandos SQL salvos em: $sqlFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 ANÁLISE CONCLUÍDA" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "📊 Log: $logFile" -ForegroundColor White
if ($GenerateReport) {
    Write-Host "📝 Relatório: $reportFile" -ForegroundColor White
}
if ($ExportSql) {
    Write-Host "📤 Comandos SQL: $sqlFile" -ForegroundColor White
}
Write-Host ""
Write-Host "💡 Próximo passo: Revisar dependências e planejar refatoração" -ForegroundColor Cyan 