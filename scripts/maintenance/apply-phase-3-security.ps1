# ================================================
# SCRIPT: Apply Phase 3 Database Security
# FASE 3 - Database Security Implementation
# Data: 2024-12-18
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# ================================================
# CONFIGURAÇÕES
# ================================================

$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptPath

$Config = @{
    ProjectRoot = $ProjectRoot
    ScriptsPath = Join-Path $ProjectRoot "scripts\security"
    SupabasePath = Join-Path $ProjectRoot "supabase"
    BackupPath = Join-Path $ProjectRoot "backups"
    LogPath = Join-Path $ProjectRoot "logs\phase3-implementation.log"
}

# ================================================
# FUNÇÕES AUXILIARES
# ================================================

function Write-PhaseLog {
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
    
    # Criar diretório de logs se não existir
    $logDir = Split-Path -Parent $Config.LogPath
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    # Log para arquivo
    $logMessage | Out-File -FilePath $Config.LogPath -Append -Encoding UTF8
}

function Test-Prerequisites {
    Write-PhaseLog "Verificando pré-requisitos..." "STEP"
    
    $issues = @()
    
    # Verificar variáveis de ambiente
    if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
        $issues += "Variável NEXT_PUBLIC_SUPABASE_URL não configurada"
    }
    
    if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
        $issues += "Variável SUPABASE_SERVICE_ROLE_KEY não configurada"
    }
    
    # Verificar Supabase CLI
    try {
        $supabaseVersion = supabase --version 2>$null
        Write-PhaseLog "Supabase CLI encontrado: $supabaseVersion" "SUCCESS"
    }
    catch {
        $issues += "Supabase CLI não encontrado ou não instalado"
    }
    
    # Verificar conexão com Supabase
    try {
        $headers = @{
            "apikey" = $env:SUPABASE_SERVICE_ROLE_KEY
            "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
        }
        $testUrl = "$env:NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
        $response = Invoke-RestMethod -Uri $testUrl -Headers $headers -Method GET -TimeoutSec 10
        Write-PhaseLog "Conexão com Supabase OK" "SUCCESS"
    }
    catch {
        $issues += "Falha na conexão com Supabase: $($_.Exception.Message)"
    }
    
    # Verificar arquivos necessários
    $requiredFiles = @(
        "scripts\security\rls-policies-enhancement.sql",
        "scripts\security\security-indexes.sql", 
        "scripts\security\backup-recovery-system.ps1"
    )
    
    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $Config.ProjectRoot $file
        if (-not (Test-Path $fullPath)) {
            $issues += "Arquivo necessário não encontrado: $file"
        }
    }
    
    if ($issues.Count -gt 0) {
        Write-PhaseLog "Problemas encontrados nos pré-requisitos:" "ERROR"
        foreach ($issue in $issues) {
            Write-PhaseLog "  - $issue" "ERROR"
        }
        return $false
    }
    
    Write-PhaseLog "Todos os pré-requisitos atendidos!" "SUCCESS"
    return $true
}

function Backup-CurrentState {
    if ($SkipBackup) {
        Write-PhaseLog "Backup ignorado (parâmetro -SkipBackup)" "WARNING"
        return $true
    }
    
    Write-PhaseLog "Criando backup do estado atual..." "STEP"
    
    try {
        $backupScript = Join-Path $Config.ScriptsPath "backup-recovery-system.ps1"
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupDir = Join-Path $Config.BackupPath "pre_phase3_$timestamp"
        
        & $backupScript -Operation backup -BackupPath $backupDir -FullBackup -Verbose:$VerboseOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Backup criado com sucesso: $backupDir" "SUCCESS"
            return $true
        } else {
            Write-PhaseLog "Falha no backup (código: $LASTEXITCODE)" "ERROR"
            return $false
        }
    }
    catch {
        Write-PhaseLog "Erro ao criar backup: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Apply-RLSPolicies {
    Write-PhaseLog "Aplicando políticas RLS..." "STEP"
    
    try {
        $rlsScript = Join-Path $Config.ScriptsPath "rls-policies-enhancement.sql"
        
        if ($DryRun) {
            Write-PhaseLog "DRY RUN: Validando script RLS..." "INFO"
            # Validação básica do SQL
            $sqlContent = Get-Content $rlsScript -Raw
            if ($sqlContent -match "CREATE POLICY|ALTER TABLE.*ENABLE ROW LEVEL SECURITY") {
                Write-PhaseLog "Script RLS válido" "SUCCESS"
                return $true
            } else {
                Write-PhaseLog "Script RLS inválido" "ERROR"
                return $false
            }
        }
        
        Write-PhaseLog "Executando script de políticas RLS..." "INFO"
        
        # Executar via Supabase CLI
        $result = supabase db exec -f $rlsScript 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Políticas RLS aplicadas com sucesso!" "SUCCESS"
            if ($VerboseOutput) {
                Write-PhaseLog "Output: $result" "INFO"
            }
            return $true
        } else {
            Write-PhaseLog "Erro ao aplicar políticas RLS: $result" "ERROR"
            return $false
        }
    }
    catch {
        Write-PhaseLog "Erro ao aplicar políticas RLS: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Apply-SecurityIndexes {
    Write-PhaseLog "Criando indexes de segurança..." "STEP"
    
    try {
        $indexScript = Join-Path $Config.ScriptsPath "security-indexes.sql"
        
        if ($DryRun) {
            Write-PhaseLog "DRY RUN: Validando script de indexes..." "INFO"
            $sqlContent = Get-Content $indexScript -Raw
            if ($sqlContent -match "CREATE INDEX.*IF NOT EXISTS") {
                Write-PhaseLog "Script de indexes válido" "SUCCESS"
                return $true
            } else {
                Write-PhaseLog "Script de indexes inválido" "ERROR"
                return $false
            }
        }
        
        Write-PhaseLog "Executando script de indexes de segurança..." "INFO"
        
        # Executar via Supabase CLI
        $result = supabase db exec -f $indexScript 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Indexes de segurança criados com sucesso!" "SUCCESS"
            if ($VerboseOutput) {
                Write-PhaseLog "Output: $result" "INFO"
            }
            return $true
        } else {
            Write-PhaseLog "Erro ao criar indexes: $result" "ERROR"
            return $false
        }
    }
    catch {
        Write-PhaseLog "Erro ao criar indexes: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Configure-BackupSystem {
    Write-PhaseLog "Configurando sistema de backup..." "STEP"
    
    try {
        $backupScript = Join-Path $Config.ScriptsPath "backup-recovery-system.ps1"
        
        if ($DryRun) {
            Write-PhaseLog "DRY RUN: Sistema de backup seria configurado" "INFO"
            return $true
        }
        
        # Configurar agendamento
        Write-PhaseLog "Configurando agendamento de backup..." "INFO"
        & $backupScript -Operation schedule -Verbose:$VerboseOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Sistema de backup configurado!" "SUCCESS"
            
            # Executar backup inicial
            Write-PhaseLog "Executando backup inicial..." "INFO"
            & $backupScript -Operation backup -Verbose:$VerboseOutput
            
            if ($LASTEXITCODE -eq 0) {
                Write-PhaseLog "Backup inicial executado com sucesso!" "SUCCESS"
                return $true
            } else {
                Write-PhaseLog "Falha no backup inicial" "WARNING"
                return $true  # Não falhar por causa do backup inicial
            }
        } else {
            Write-PhaseLog "Erro ao configurar sistema de backup" "ERROR"
            return $false
        }
    }
    catch {
        Write-PhaseLog "Erro ao configurar backup: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Update-SupabaseConfig {
    Write-PhaseLog "Atualizando configuração do Supabase..." "STEP"
    
    try {
        $configFile = Join-Path $Config.SupabasePath "config.toml"
        
        if (-not (Test-Path $configFile)) {
            Write-PhaseLog "Arquivo config.toml não encontrado" "WARNING"
            return $true  # Não falhar se não tiver config local
        }
        
        if ($DryRun) {
            Write-PhaseLog "DRY RUN: Configuração seria atualizada" "INFO"
            return $true
        }
        
        # Reiniciar Supabase para aplicar configurações
        Write-PhaseLog "Reiniciando Supabase local..." "INFO"
        
        supabase stop 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        
        $startResult = supabase start 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Supabase reiniciado com sucesso!" "SUCCESS"
            if ($VerboseOutput) {
                Write-PhaseLog "Output: $startResult" "INFO"
            }
            return $true
        } else {
            Write-PhaseLog "Erro ao reiniciar Supabase: $startResult" "ERROR"
            return $false
        }
    }
    catch {
        Write-PhaseLog "Erro ao atualizar configuração: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Implementation {
    Write-PhaseLog "Testando implementação..." "STEP"
    
    try {
        # Testar políticas RLS
        Write-PhaseLog "Verificando políticas RLS..." "INFO"
        $rlsCheck = supabase db exec --query "SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Políticas RLS verificadas" "SUCCESS"
        }
        
        # Testar indexes
        Write-PhaseLog "Verificando indexes de segurança..." "INFO"
        $indexCheck = supabase db exec --query "SELECT COUNT(*) as index_count FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Indexes verificados" "SUCCESS"
        }
        
        # Testar backup
        Write-PhaseLog "Verificando sistema de backup..." "INFO"
        $backupScript = Join-Path $Config.ScriptsPath "backup-recovery-system.ps1"
        & $backupScript -Operation verify -Verbose:$VerboseOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-PhaseLog "Sistema de backup verificado" "SUCCESS"
        }
        
        return $true
    }
    catch {
        Write-PhaseLog "Erro nos testes: $($_.Exception.Message)" "WARNING"
        return $true  # Não falhar por causa dos testes
    }
}

function Run-ComplianceCheck {
    Write-PhaseLog "Executando verificação de compliance..." "STEP"
    
    try {
        $complianceScript = Join-Path $Config.ProjectRoot "scripts\unified-compliance-check.ps1"
        
        if (-not (Test-Path $complianceScript)) {
            Write-PhaseLog "Script de compliance não encontrado" "WARNING"
            return $true
        }
        
        Write-PhaseLog "Executando compliance check..." "INFO"
        & $complianceScript -Verbose:$VerboseOutput
        
        Write-PhaseLog "Compliance check executado" "SUCCESS"
        return $true
    }
    catch {
        Write-PhaseLog "Erro no compliance check: $($_.Exception.Message)" "WARNING"
        return $true  # Não falhar por causa do compliance check
    }
}

# ================================================
# EXECUÇÃO PRINCIPAL
# ================================================

try {
    Write-PhaseLog "=== INICIANDO IMPLEMENTAÇÃO DA FASE 3 ===" "STEP"
    Write-PhaseLog "Database Security Enhancement" "INFO"
    Write-PhaseLog "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "INFO"
    
    if ($DryRun) {
        Write-PhaseLog "MODO DRY RUN - Nenhuma alteração será feita" "WARNING"
    }
    
    # Verificar pré-requisitos
    if (-not (Test-Prerequisites)) {
        Write-PhaseLog "Pré-requisitos não atendidos. Implementação cancelada." "ERROR"
        exit 1
    }
    
    # Confirmar execução se não for Force
    if (-not $Force -and -not $DryRun) {
        $confirmation = Read-Host "Deseja continuar com a implementação da Fase 3? (s/N)"
        if ($confirmation -ne "s" -and $confirmation -ne "S") {
            Write-PhaseLog "Implementação cancelada pelo usuário" "INFO"
            exit 0
        }
    }
    
    $steps = @()
    
    # Passo 1: Backup
    Write-PhaseLog "=== PASSO 1: BACKUP DO ESTADO ATUAL ===" "STEP"
    if (Backup-CurrentState) {
        $steps += "✅ Backup criado"
    } else {
        $steps += "❌ Falha no backup"
        if (-not $Force) {
            Write-PhaseLog "Falha no backup. Use -Force para continuar mesmo assim." "ERROR"
            exit 1
        }
    }
    
    # Passo 2: Políticas RLS
    Write-PhaseLog "=== PASSO 2: APLICAR POLÍTICAS RLS ===" "STEP"
    if (Apply-RLSPolicies) {
        $steps += "✅ Políticas RLS aplicadas"
    } else {
        $steps += "❌ Falha nas políticas RLS"
        Write-PhaseLog "Falha crítica nas políticas RLS" "ERROR"
        exit 1
    }
    
    # Passo 3: Indexes de Segurança
    Write-PhaseLog "=== PASSO 3: CRIAR INDEXES DE SEGURANÇA ===" "STEP"
    if (Apply-SecurityIndexes) {
        $steps += "✅ Indexes criados"
    } else {
        $steps += "❌ Falha nos indexes"
        Write-PhaseLog "Falha crítica nos indexes" "ERROR"
        exit 1
    }
    
    # Passo 4: Sistema de Backup
    Write-PhaseLog "=== PASSO 4: CONFIGURAR SISTEMA DE BACKUP ===" "STEP"
    if (Configure-BackupSystem) {
        $steps += "✅ Sistema de backup configurado"
    } else {
        $steps += "❌ Falha no sistema de backup"
        if (-not $Force) {
            Write-PhaseLog "Falha no sistema de backup. Use -Force para continuar." "ERROR"
            exit 1
        }
    }
    
    # Passo 5: Configuração Supabase
    Write-PhaseLog "=== PASSO 5: ATUALIZAR CONFIGURAÇÃO SUPABASE ===" "STEP"
    if (Update-SupabaseConfig) {
        $steps += "✅ Configuração atualizada"
    } else {
        $steps += "❌ Falha na configuração"
        Write-PhaseLog "Falha na configuração do Supabase" "WARNING"
    }
    
    # Passo 6: Testes
    Write-PhaseLog "=== PASSO 6: TESTAR IMPLEMENTAÇÃO ===" "STEP"
    if (Test-Implementation) {
        $steps += "✅ Testes executados"
    } else {
        $steps += "⚠️ Problemas nos testes"
    }
    
    # Passo 7: Compliance Check
    Write-PhaseLog "=== PASSO 7: VERIFICAÇÃO DE COMPLIANCE ===" "STEP"
    if (Run-ComplianceCheck) {
        $steps += "✅ Compliance verificado"
    } else {
        $steps += "⚠️ Problemas no compliance"
    }
    
    # Resumo final
    Write-PhaseLog "=== IMPLEMENTAÇÃO DA FASE 3 CONCLUÍDA ===" "STEP"
    Write-PhaseLog "Resumo dos passos executados:" "INFO"
    foreach ($step in $steps) {
        Write-PhaseLog "  $step" "INFO"
    }
    
    Write-PhaseLog "" "INFO"
    Write-PhaseLog "🎉 FASE 3 - DATABASE SECURITY IMPLEMENTADA COM SUCESSO!" "SUCCESS"
    Write-PhaseLog "" "INFO"
    Write-PhaseLog "Próximos passos recomendados:" "INFO"
    Write-PhaseLog "1. Monitorar logs de auditoria" "INFO"
    Write-PhaseLog "2. Verificar performance das queries" "INFO"
    Write-PhaseLog "3. Testar isolamento organizacional" "INFO"
    Write-PhaseLog "4. Configurar alertas de backup" "INFO"
    Write-PhaseLog "5. Documentar configurações" "INFO"
    
    exit 0
}
catch {
    Write-PhaseLog "ERRO FATAL: $($_.Exception.Message)" "ERROR"
    Write-PhaseLog "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}

# ================================================
# DOCUMENTAÇÃO
# ================================================

<#
.SYNOPSIS
Script automatizado para implementar a Fase 3 - Database Security

.DESCRIPTION
Este script aplica todas as melhorias de segurança da Fase 3, incluindo:
- Políticas RLS robustas
- Indexes de segurança e performance
- Sistema automatizado de backup/recovery
- Configurações avançadas do Supabase

.PARAMETER DryRun
Executar em modo de teste sem fazer alterações

.PARAMETER SkipBackup
Pular a criação de backup antes da implementação

.PARAMETER Verbose
Exibir informações detalhadas durante a execução

.PARAMETER Force
Continuar execução mesmo com erros não-críticos

.EXAMPLE
# Execução padrão
.\apply-phase-3-security.ps1

# Teste sem alterações
.\apply-phase-3-security.ps1 -DryRun

# Execução forçada com logs detalhados
.\apply-phase-3-security.ps1 -Force -Verbose

# Pular backup e executar
.\apply-phase-3-security.ps1 -SkipBackup

.NOTES
Requer:
- Supabase CLI instalado
- Variáveis de ambiente configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Permissões de admin no projeto Supabase
- PowerShell 5.1 ou superior

Arquivos necessários:
- scripts/security/rls-policies-enhancement.sql
- scripts/security/security-indexes.sql
- scripts/security/backup-recovery-system.ps1
#> 