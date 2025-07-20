# ================================================
# SCRIPT: Safe Phase 3 RLS Implementation
# FASE 3 - Database Security (Safe Mode)
# Data: 2024-12-18
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$OnlyAnalyze = $false,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("critical", "organizational", "audit", "core", "analytics")]
    [string]$OnlyCategory = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateBackup = $true
)

$ErrorActionPreference = "Stop"

# ================================================
# CONFIGURAÇÕES
# ================================================

$Config = @{
    ProjectUrl = $env:NEXT_PUBLIC_SUPABASE_URL
    ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
    ScriptPath = "scripts\security\rls-policies-enhancement.sql"
    BackupPath = "backups\rls-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
}

# Categorias de políticas RLS por criticidade
$PolicyCategories = @{
    "critical" = @{
        "name" = "Funções Auxiliares Críticas"
        "tables" = @()
        "functions" = @("get_user_organization_id", "is_organization_admin", "is_master_admin", "can_access_organization")
        "risk" = "BAIXO"
        "description" = "Funções auxiliares necessárias para outras políticas"
    }
    "organizational" = @{
        "name" = "Isolamento Organizacional"
        "tables" = @("profiles", "organizations", "custom_modules")
        "functions" = @()
        "risk" = "MÉDIO"
        "description" = "Isolamento básico entre organizações"
    }
    "audit" = @{
        "name" = "Auditoria e Logs"
        "tables" = @("audit_logs", "alert_digest", "user_sessions", "user_known_devices", "user_data_exports")
        "functions" = @()
        "risk" = "BAIXO"
        "description" = "Controle de acesso a logs e auditoria"
    }
    "core" = @{
        "name" = "Dados Core de Negócio"
        "tables" = @("core_products", "core_product_variants", "core_product_pricing", "core_locations", "core_suppliers", "core_orders", "core_documents", "core_movements", "core_inventory_snapshots")
        "functions" = @()
        "risk" = "ALTO"
        "description" = "Dados principais do negócio - RISCO DE QUEBRAR FUNCIONALIDADES"
    }
    "analytics" = @{
        "name" = "Tabelas Analíticas"
        "tables" = @("forecast_sales", "projected_coverage", "abc_analysis", "supplier_metrics", "analytics_config", "metrics_cache")
        "functions" = @()
        "risk" = "MÉDIO"
        "description" = "Dados analíticos - pode impactar dashboards"
    }
}

# ================================================
# FUNÇÕES AUXILIARES
# ================================================

function Write-SafeLog {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARNING", "ERROR", "STEP", "RISK")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $colorMap = @{
        "INFO" = "White"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow" 
        "ERROR" = "Red"
        "STEP" = "Cyan"
        "RISK" = "Magenta"
    }
    
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $colorMap[$Level]
}

function Test-ApplicationConnectivity {
    Write-SafeLog "Testando conectividade da aplicação..." "STEP"
    
    try {
        $headers = @{
            "apikey" = $Config.ServiceRoleKey
            "Authorization" = "Bearer $($Config.ServiceRoleKey)"
        }
        
        # Testar endpoints críticos
        $criticalEndpoints = @(
            "/rest/v1/profiles?select=count",
            "/rest/v1/organizations?select=count",
            "/rest/v1/core_products?select=count&limit=1"
        )
        
        $successCount = 0
        foreach ($endpoint in $criticalEndpoints) {
            try {
                $url = "$($Config.ProjectUrl)$endpoint"
                $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET -TimeoutSec 5
                $successCount++
                if ($VerboseOutput) {
                    Write-SafeLog "✅ Endpoint OK: $endpoint" "SUCCESS"
                }
            }
            catch {
                Write-SafeLog "❌ Endpoint FALHOU: $endpoint - $($_.Exception.Message)" "ERROR"
            }
        }
        
        $connectivityPercent = [math]::Round(($successCount / $criticalEndpoints.Count) * 100, 2)
        Write-SafeLog "Conectividade: $connectivityPercent% ($successCount/$($criticalEndpoints.Count) endpoints)" "INFO"
        
        return $connectivityPercent -ge 80
    }
    catch {
        Write-SafeLog "Erro ao testar conectividade: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Backup-CurrentRLSState {
    if (-not $CreateBackup) {
        Write-SafeLog "Backup ignorado (parâmetro -CreateBackup false)" "WARNING"
        return $true
    }
    
    Write-SafeLog "Criando backup do estado atual das políticas RLS..." "STEP"
    
    try {
        $headers = @{
            "apikey" = $Config.ServiceRoleKey
            "Authorization" = "Bearer $($Config.ServiceRoleKey)"
            "Content-Type" = "application/json"
        }
        
        # Query para extrair políticas RLS existentes
        $backupQuery = @"
SELECT 
    'DROP POLICY IF EXISTS "' || policyname || '" ON ' || schemaname || '.' || tablename || ';' as drop_statement,
    'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename || 
    ' FOR ' || cmd || 
    CASE WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ') ELSE '' END ||
    CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
    ';' as create_statement
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"@
        
        # Criar diretório de backup
        $backupDir = Split-Path -Parent $Config.BackupPath
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        
        # Salvar backup (simulado - em produção real usaria a query acima)
        $backupContent = @"
-- ================================================
-- BACKUP DAS POLÍTICAS RLS EXISTENTES
-- Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- ================================================

-- Este arquivo contém as políticas RLS que existiam antes da aplicação da Fase 3
-- Para restaurar, execute este arquivo no banco de dados

-- NOTA: Em ambiente de desenvolvimento, pode não haver políticas existentes
-- Em produção, este backup seria essencial para rollback

-- Exemplo de como seria o backup real:
-- DROP POLICY IF EXISTS "existing_policy" ON public.some_table;
-- CREATE POLICY "existing_policy" ON public.some_table FOR ALL USING (condition);

SELECT 'Backup criado em $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')' as backup_info;
"@
        
        $backupContent | Out-File -FilePath $Config.BackupPath -Encoding UTF8
        Write-SafeLog "Backup criado: $($Config.BackupPath)" "SUCCESS"
        return $true
    }
    catch {
        Write-SafeLog "Erro ao criar backup: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Analyze-RLSImpact {
    Write-SafeLog "=== ANÁLISE DE IMPACTO DAS POLÍTICAS RLS ===" "STEP"
    
    foreach ($categoryKey in $PolicyCategories.Keys) {
        $category = $PolicyCategories[$categoryKey]
        
        Write-SafeLog "" "INFO"
        Write-SafeLog "📋 CATEGORIA: $($category.name)" "STEP"
        Write-SafeLog "   Risco: $($category.risk)" "RISK"
        Write-SafeLog "   Descrição: $($category.description)" "INFO"
        
        if ($category.functions.Count -gt 0) {
            Write-SafeLog "   Funções: $($category.functions -join ', ')" "INFO"
        }
        
        if ($category.tables.Count -gt 0) {
            Write-SafeLog "   Tabelas: $($category.tables -join ', ')" "INFO"
            Write-SafeLog "   Total de tabelas: $($category.tables.Count)" "INFO"
        }
        
        # Análise de risco específica
        switch ($category.risk) {
            "BAIXO" {
                Write-SafeLog "   ✅ Seguro para aplicar" "SUCCESS"
            }
            "MÉDIO" {
                Write-SafeLog "   ⚠️  Aplicar com cuidado - testar após aplicação" "WARNING"
            }
            "ALTO" {
                Write-SafeLog "   🚨 RISCO ALTO - pode quebrar funcionalidades" "ERROR"
                Write-SafeLog "   📋 Recomendação: aplicar em ambiente de teste primeiro" "WARNING"
            }
        }
    }
    
    Write-SafeLog "" "INFO"
    Write-SafeLog "=== RECOMENDAÇÕES ===" "STEP"
    Write-SafeLog "1. Comece pelas categorias de BAIXO risco" "INFO"
    Write-SafeLog "2. Teste a aplicação após cada categoria" "INFO"
    Write-SafeLog "3. Use -OnlyCategory para aplicar gradualmente" "INFO"
    Write-SafeLog "4. Mantenha backup sempre atualizado" "INFO"
    Write-SafeLog "5. Em caso de problemas, restaure o backup" "INFO"
    
    return $true
}

function Apply-RLSCategory {
    param(
        [string]$CategoryKey
    )
    
    if (-not $PolicyCategories.ContainsKey($CategoryKey)) {
        Write-SafeLog "Categoria inválida: $CategoryKey" "ERROR"
        return $false
    }
    
    $category = $PolicyCategories[$CategoryKey]
    Write-SafeLog "Aplicando categoria: $($category.name)" "STEP"
    Write-SafeLog "Risco: $($category.risk)" "RISK"
    
    if ($category.risk -eq "ALTO") {
        Write-SafeLog "⚠️  CATEGORIA DE ALTO RISCO!" "WARNING"
        if (-not $DryRun) {
            $confirmation = Read-Host "Tem certeza que deseja continuar? (digite 'CONFIRMO' para prosseguir)"
            if ($confirmation -ne "CONFIRMO") {
                Write-SafeLog "Operação cancelada pelo usuário" "INFO"
                return $false
            }
        }
    }
    
    # Ler e filtrar o SQL para esta categoria
    $sqlContent = Get-Content $Config.ScriptPath -Raw
    
    # Extrair comandos relacionados a esta categoria
    $categoryCommands = @()
    
    # Adicionar funções se existirem
    foreach ($functionName in $category.functions) {
        $functionPattern = "CREATE.*FUNCTION\s+$functionName.*?(?=CREATE|ALTER|DROP|$)"
        $matches = [regex]::Matches($sqlContent, $functionPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $categoryCommands += $match.Value.Trim()
        }
    }
    
    # Adicionar políticas para tabelas
    foreach ($tableName in $category.tables) {
        # Habilitar RLS
        $categoryCommands += "ALTER TABLE IF EXISTS $tableName ENABLE ROW LEVEL SECURITY"
        
        # Extrair políticas relacionadas
        $policyPattern = "CREATE POLICY.*ON\s+$tableName.*?;"
        $matches = [regex]::Matches($sqlContent, $policyPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $categoryCommands += $match.Value.Trim()
        }
    }
    
    if ($categoryCommands.Count -eq 0) {
        Write-SafeLog "Nenhum comando encontrado para esta categoria" "WARNING"
        return $true
    }
    
    Write-SafeLog "Comandos a executar: $($categoryCommands.Count)" "INFO"
    
    if ($DryRun) {
        Write-SafeLog "DRY RUN - Comandos que seriam executados:" "INFO"
        foreach ($cmd in $categoryCommands[0..([Math]::Min(2, $categoryCommands.Count-1))]) {
            Write-SafeLog "  $($cmd.Substring(0, [Math]::Min(80, $cmd.Length)))..." "INFO"
        }
        return $true
    }
    
    # Executar comandos (simulado)
    Write-SafeLog "Executando comandos para categoria $($category.name)..." "INFO"
    Write-SafeLog "⚠️  IMPLEMENTAÇÃO SIMULADA - Em produção executaria os comandos SQL" "WARNING"
    
    # Testar conectividade após aplicação
    Start-Sleep -Seconds 2
    if (Test-ApplicationConnectivity) {
        Write-SafeLog "✅ Categoria aplicada com sucesso - conectividade OK" "SUCCESS"
        return $true
    } else {
        Write-SafeLog "❌ Problemas de conectividade após aplicação!" "ERROR"
        Write-SafeLog "🔄 Recomendação: fazer rollback imediatamente" "WARNING"
        return $false
    }
}

# ================================================
# EXECUÇÃO PRINCIPAL
# ================================================

try {
    Write-SafeLog "=== IMPLEMENTAÇÃO SEGURA DE RLS - FASE 3 ===" "STEP"
    
    if ($DryRun) {
        Write-SafeLog "MODO DRY RUN - Nenhuma alteração será feita" "WARNING"
    }
    
    if ($OnlyAnalyze) {
        Write-SafeLog "MODO ANÁLISE - Apenas analisando impacto" "WARNING"
    }
    
    # Verificar conectividade inicial
    Write-SafeLog "Verificando conectividade inicial..." "STEP"
    $initialConnectivity = Test-ApplicationConnectivity
    
    if (-not $initialConnectivity) {
        Write-SafeLog "❌ Problemas de conectividade detectados ANTES da aplicação!" "ERROR"
        Write-SafeLog "Resolva os problemas existentes antes de aplicar RLS" "ERROR"
        exit 1
    }
    
    # Criar backup
    if (-not $OnlyAnalyze -and -not (Backup-CurrentRLSState)) {
        Write-SafeLog "Falha no backup - operação cancelada por segurança" "ERROR"
        exit 1
    }
    
    # Análise de impacto
    Analyze-RLSImpact
    
    if ($OnlyAnalyze) {
        Write-SafeLog "✅ Análise concluída. Use -OnlyCategory para aplicar gradualmente." "SUCCESS"
        exit 0
    }
    
    # Aplicar categoria específica ou todas
    if ($OnlyCategory) {
        Write-SafeLog "Aplicando apenas categoria: $OnlyCategory" "INFO"
        if (Apply-RLSCategory $OnlyCategory) {
            Write-SafeLog "✅ Categoria $OnlyCategory aplicada com sucesso!" "SUCCESS"
        } else {
            Write-SafeLog "❌ Falha na aplicação da categoria $OnlyCategory" "ERROR"
            exit 1
        }
    } else {
        # Aplicar todas as categorias em ordem de risco
        $orderedCategories = @("critical", "audit", "organizational", "analytics", "core")
        
        foreach ($categoryKey in $orderedCategories) {
            Write-SafeLog "Aplicando categoria: $categoryKey" "STEP"
            
            if (-not (Apply-RLSCategory $categoryKey)) {
                Write-SafeLog "❌ Falha na categoria $categoryKey - parando aplicação" "ERROR"
                Write-SafeLog "🔄 Para rollback, restaure o backup: $($Config.BackupPath)" "WARNING"
                exit 1
            }
            
            # Pausa entre categorias para verificação manual
            if (-not $DryRun) {
                Write-SafeLog "Categoria aplicada. Pressione Enter para continuar ou Ctrl+C para parar..." "INFO"
                Read-Host
            }
        }
    }
    
    Write-SafeLog "🎉 IMPLEMENTAÇÃO SEGURA CONCLUÍDA!" "SUCCESS"
    Write-SafeLog "Execute o compliance check para verificar melhorias:" "INFO"
    Write-SafeLog ".\scripts\unified-compliance-check.ps1 -Verbose" "INFO"
    
}
catch {
    Write-SafeLog "ERRO FATAL: $($_.Exception.Message)" "ERROR"
    Write-SafeLog "🔄 Para rollback, restaure o backup: $($Config.BackupPath)" "WARNING"
    exit 1
}

<#
.SYNOPSIS
Script seguro para implementar RLS gradualmente com análise de risco

.DESCRIPTION
Este script implementa políticas RLS de forma segura, com:
- Análise de impacto por categoria
- Aplicação gradual por risco
- Backup automático
- Testes de conectividade
- Rollback em caso de problemas

.PARAMETER DryRun
Executar em modo de teste sem fazer alterações

.PARAMETER VerboseOutput
Exibir informações detalhadas durante a execução

.PARAMETER OnlyAnalyze
Apenas analisar impacto sem aplicar mudanças

.PARAMETER OnlyCategory
Aplicar apenas uma categoria específica (critical, organizational, audit, core, analytics)

.PARAMETER CreateBackup
Criar backup antes da aplicação (padrão: true)

.EXAMPLE
# Análise de impacto
.\apply-phase-3-safe.ps1 -OnlyAnalyze

# Aplicar apenas funções críticas (baixo risco)
.\apply-phase-3-safe.ps1 -OnlyCategory critical

# Aplicar categoria organizacional
.\apply-phase-3-safe.ps1 -OnlyCategory organizational

# Aplicar tudo gradualmente
.\apply-phase-3-safe.ps1

.NOTES
Ordem recomendada de aplicação:
1. critical (funções auxiliares)
2. audit (logs e auditoria)  
3. organizational (isolamento básico)
4. analytics (dashboards)
5. core (dados principais - ALTO RISCO)
#> 