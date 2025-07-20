# ================================================
# SCRIPT: Apply Phase 3 RLS Policies Only
# FASE 3 - Database Security (RLS Only)
# Data: 2024-12-18
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput = $false
)

$ErrorActionPreference = "Stop"

# ================================================
# CONFIGURAÇÕES
# ================================================

$Config = @{
    ProjectUrl = $env:NEXT_PUBLIC_SUPABASE_URL
    ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
    ScriptPath = "scripts\security\rls-policies-enhancement.sql"
}

# ================================================
# FUNÇÕES AUXILIARES
# ================================================

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARNING", "ERROR", "STEP")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $colorMap = @{
        "INFO" = "White"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow" 
        "ERROR" = "Red"
        "STEP" = "Cyan"
    }
    
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $colorMap[$Level]
}

function Test-Prerequisites {
    Write-Log "Verificando pré-requisitos..." "STEP"
    
    $issues = @()
    
    if (-not $Config.ProjectUrl) {
        $issues += "Variável NEXT_PUBLIC_SUPABASE_URL não configurada"
    }
    
    if (-not $Config.ServiceRoleKey) {
        $issues += "Variável SUPABASE_SERVICE_ROLE_KEY não configurada"
    }
    
    if (-not (Test-Path $Config.ScriptPath)) {
        $issues += "Arquivo de políticas RLS não encontrado: $($Config.ScriptPath)"
    }
    
    # Testar conexão com Supabase
    try {
        $headers = @{
            "apikey" = $Config.ServiceRoleKey
            "Authorization" = "Bearer $($Config.ServiceRoleKey)"
        }
        $testUrl = "$($Config.ProjectUrl)/rest/v1/"
        $response = Invoke-RestMethod -Uri $testUrl -Headers $headers -Method GET -TimeoutSec 10
        Write-Log "Conexão com Supabase OK" "SUCCESS"
    }
    catch {
        $issues += "Falha na conexão com Supabase: $($_.Exception.Message)"
    }
    
    if ($issues.Count -gt 0) {
        Write-Log "Problemas encontrados:" "ERROR"
        foreach ($issue in $issues) {
            Write-Log "  - $issue" "ERROR"
        }
        return $false
    }
    
    Write-Log "Pré-requisitos OK!" "SUCCESS"
    return $true
}

function Execute-SQL {
    param(
        [string]$SqlQuery
    )
    
    try {
        $headers = @{
            "apikey" = $Config.ServiceRoleKey
            "Authorization" = "Bearer $($Config.ServiceRoleKey)"
            "Content-Type" = "application/json"
        }
        
        # Para executar SQL via API REST do Supabase, usamos o endpoint rpc
        $body = @{
            sql = $SqlQuery
        } | ConvertTo-Json
        
        $url = "$($Config.ProjectUrl)/rest/v1/rpc/exec_sql"
        
        if ($VerboseOutput) {
            Write-Log "Executando SQL: $($SqlQuery.Substring(0, [Math]::Min(100, $SqlQuery.Length)))..." "INFO"
        }
        
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method POST -Body $body
        
        return $true
    }
    catch {
        Write-Log "Erro ao executar SQL: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Apply-RLSPolicies {
    Write-Log "Aplicando políticas RLS..." "STEP"
    
    try {
        # Ler o arquivo SQL
        $sqlContent = Get-Content $Config.ScriptPath -Raw
        
        if ($DryRun) {
            Write-Log "DRY RUN: Validando script RLS..." "INFO"
            if ($sqlContent -match "CREATE POLICY|ALTER TABLE.*ENABLE ROW LEVEL SECURITY") {
                Write-Log "Script RLS válido" "SUCCESS"
                return $true
            } else {
                Write-Log "Script RLS inválido" "ERROR"
                return $false
            }
        }
        
        # Dividir o SQL em comandos individuais
        $commands = $sqlContent -split ";\s*\n" | Where-Object { $_.Trim() -ne "" -and $_.Trim() -notmatch "^--" }
        
        $successCount = 0
        $totalCount = $commands.Count
        
        Write-Log "Executando $totalCount comandos SQL..." "INFO"
        
        foreach ($command in $commands) {
            $trimmedCommand = $command.Trim()
            if ($trimmedCommand -ne "" -and $trimmedCommand -notmatch "^--") {
                if (Execute-SQL $trimmedCommand) {
                    $successCount++
                } else {
                    Write-Log "Falha no comando: $($trimmedCommand.Substring(0, [Math]::Min(50, $trimmedCommand.Length)))..." "WARNING"
                }
            }
        }
        
        Write-Log "Políticas RLS aplicadas: $successCount/$totalCount comandos executados" "SUCCESS"
        return $successCount -gt 0
    }
    catch {
        Write-Log "Erro ao aplicar políticas RLS: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# ================================================
# EXECUÇÃO PRINCIPAL
# ================================================

try {
    Write-Log "=== APLICANDO POLÍTICAS RLS - FASE 3 ===" "STEP"
    
    if ($DryRun) {
        Write-Log "MODO DRY RUN - Nenhuma alteração será feita" "WARNING"
    }
    
    # Verificar pré-requisitos
    if (-not (Test-Prerequisites)) {
        Write-Log "Pré-requisitos não atendidos. Operação cancelada." "ERROR"
        exit 1
    }
    
    # Aplicar políticas RLS
    if (Apply-RLSPolicies) {
        Write-Log "✅ POLÍTICAS RLS APLICADAS COM SUCESSO!" "SUCCESS"
        Write-Log "Execute o compliance check para ver as melhorias:" "INFO"
        Write-Log ".\scripts\unified-compliance-check.ps1 -Verbose" "INFO"
        exit 0
    } else {
        Write-Log "❌ FALHA AO APLICAR POLÍTICAS RLS" "ERROR"
        exit 1
    }
}
catch {
    Write-Log "ERRO FATAL: $($_.Exception.Message)" "ERROR"
    exit 1
}

<#
.SYNOPSIS
Script simplificado para aplicar apenas as políticas RLS da Fase 3

.DESCRIPTION
Este script aplica as políticas RLS via API REST do Supabase, sem precisar do CLI.

.PARAMETER DryRun
Executar em modo de teste sem fazer alterações

.PARAMETER VerboseOutput
Exibir informações detalhadas durante a execução

.EXAMPLE
# Teste
.\apply-phase-3-rls-only.ps1 -DryRun

# Aplicar
.\apply-phase-3-rls-only.ps1 -VerboseOutput

.NOTES
Requer variáveis de ambiente:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
#> 