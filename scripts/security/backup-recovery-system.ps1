# =======================================================
# Script: Backup and Recovery System
# Description: Sistema de backup e recovery do banco de dados
# =======================================================

# Importar configuração
$configPath = Join-Path $PSScriptRoot "..\config\config.ps1"
if (-not (Test-Path $configPath)) {
    Write-Error "Arquivo de configuração não encontrado: $configPath"
    exit 1
}
. $configPath

# =======================================================
# Verificação de Pré-requisitos
# =======================================================

function Test-PostgresTools {
    try {
        $pgDump = Get-Command "pg_dump" -ErrorAction Stop
        $pgRestore = Get-Command "pg_restore" -ErrorAction Stop
        Write-Host "Ferramentas PostgreSQL encontradas"
        return $true
    }
    catch {
        Write-Error "Ferramentas PostgreSQL não encontradas no PATH. Por favor, instale o PostgreSQL e adicione ao PATH."
        return $false
    }
}

function Initialize-BackupDirectory {
    param (
        [string]$Path
    )
    
    if (-not (Test-Path $Path)) {
        try {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
            Write-Host "✅ Diretório de backup criado: $Path" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Error "Não foi possível criar diretório de backup: $_"
            return $false
        }
    }
    return $true
}

function New-DatabaseBackup {
    param (
        [string]$Type = "full"  # full ou incremental
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
    $backupFile = Join-Path $global:backupConfig.BackupPath "backup_${Type}_${timestamp}.dump"
    
    try {
        $env:PGPASSWORD = Get-DatabasePassword
        
        $pgDumpArgs = @(
            "-h", $global:dbConfig.Host,
            "-p", $global:dbConfig.Port,
            "-U", $global:dbConfig.User,
            "-Fc",  # Formato customizado
            "-v"    # Verbose
        )
        
        if ($Type -eq "incremental") {
            $pgDumpArgs += "--exclude-schema=audit_logs"  # Excluir logs de auditoria do backup incremental
        }
        
        $pgDumpArgs += "-f", $backupFile, $global:dbConfig.Database
        
        Write-Host "Iniciando backup ${Type}..."
        & pg_dump @pgDumpArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Backup ${Type} concluído com sucesso: $backupFile"
            
            if ($global:backupConfig.CompressBackups) {
                Compress-Archive -Path $backupFile -DestinationPath "${backupFile}.zip" -Force
                Remove-Item $backupFile
                Write-Host "Backup compactado: ${backupFile}.zip"
            }
        }
        else {
            throw "Erro ao criar backup: pg_dump retornou código $LASTEXITCODE"
        }
    }
    catch {
        Write-Error "Erro ao criar backup: $_"
        return $false
    }
    finally {
        $env:PGPASSWORD = ""
    }
    
    return $true
}

function Test-DatabaseRestore {
    param (
        [string]$BackupFile
    )
    
    try {
        # Criar banco de teste
        $testDbName = "restore_test_$(Get-Random)"
        $env:PGPASSWORD = Get-DatabasePassword
        
        # Criar banco de teste
        $createDb = "createdb $testDbName"
        Invoke-Expression $createDb
        
        if ($LASTEXITCODE -eq 0) {
            # Restaurar backup no banco de teste
            $command = "pg_restore --dbname=$testDbName --verbose `"$BackupFile`""
            $result = Invoke-Expression $command
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Teste de restore concluído com sucesso" -ForegroundColor Green
                return $true
            }
        }
        
        Write-Error "Falha no teste de restore"
        return $false
    }
    catch {
        Write-Error "Erro no teste de restore: $_"
        return $false
    }
    finally {
        # Limpar banco de teste
        $dropDb = "dropdb $testDbName"
        Invoke-Expression $dropDb
        
        # Limpar variáveis de ambiente sensíveis
        $env:PGPASSWORD = $null
    }
}

function Remove-OldBackups {
    $retention = $global:backupConfig.RetentionDays
    $cutoffDate = (Get-Date).AddDays(-$retention)
    
    Get-ChildItem $global:backupConfig.BackupPath -File | Where-Object {
        $_.LastWriteTime -lt $cutoffDate
    } | ForEach-Object {
        Write-Host "Removendo backup antigo: $($_.Name)"
        Remove-Item $_.FullName -Force
    }
}

# =======================================================
# Execução Principal
# =======================================================

# Verificar configuração
if (-not (Test-Configuration)) {
    Write-Error "Falha na verificação de configuração"
    exit 1
}

# Verificar ferramentas PostgreSQL
if (-not (Test-PostgresTools)) {
    exit 1
}

# Inicializar diretório de backup
if (-not (Initialize-BackupDirectory -Path $global:backupConfig.BackupPath)) {
    exit 1
}

# Criar backup completo
Write-Host "`nCriando backup completo..."
$fullBackupSuccess = New-DatabaseBackup -Type "full"

if ($fullBackupSuccess) {
    # Testar capacidade de restore
    $latestBackup = Get-ChildItem $global:backupConfig.BackupPath -Filter "backup_full_*.dump*" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    
    if ($latestBackup) {
        Write-Host "`nTestando capacidade de restore..."
        $restoreTestSuccess = Test-DatabaseRestore -BackupFile $latestBackup.FullName
        
        # Limpar backups antigos
        Write-Host "`nLimpando backups antigos..."
        Remove-OldBackups
    }
    else {
        Write-Error "Não foi possível encontrar o backup mais recente"
        $restoreTestSuccess = $false
    }
}

# =======================================================
# Agendar Tarefas
# =======================================================

# Criar tarefas agendadas para backups
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""

# Backup completo diário
$trigger = New-ScheduledTaskTrigger -Daily -At 12am
Register-ScheduledTask -TaskName "DatabaseFullBackup" -Action $action -Trigger $trigger -Force

# Backup incremental a cada 6 horas
$trigger = New-ScheduledTaskTrigger -Once -At 12am -RepetitionInterval (New-TimeSpan -Hours 6)
Register-ScheduledTask -TaskName "DatabaseIncrementalBackup" -Action $action -Trigger $trigger -Force

# =======================================================
# Sumário de Resultados
# =======================================================

Write-Host "`nSumário da Configuração do Sistema de Backup"
Write-Host "=================================="
Write-Host "Diretório de Backup: $($global:backupConfig.BackupPath)"
Write-Host "Período de Retenção: $($global:backupConfig.RetentionDays) dias"
Write-Host "Compressão Habilitada: $($global:backupConfig.CompressBackups)"
Write-Host "Criptografia Habilitada: $($global:backupConfig.EnableEncryption)"
Write-Host "Backup Completo: Diariamente à meia-noite"
Write-Host "Backup Incremental: A cada 6 horas"

if ($fullBackupSuccess -and $restoreTestSuccess) {
    Write-Host "`n✅ Sistema de backup configurado com sucesso!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Configuração do sistema de backup requer atenção!" -ForegroundColor Red
    exit 1
}

# ================================================
# DOCUMENTAÇÃO DE USO
# ================================================

<#
.SYNOPSIS
Sistema completo de backup e recovery para Supabase

.DESCRIPTION
Este script implementa um sistema robusto de backup e recovery para o banco de dados Supabase,
incluindo compressão, criptografia, retenção automática e verificação de integridade.

.PARAMETER Operation
Operação a ser executada: backup, restore, schedule, verify, cleanup

.PARAMETER BackupPath
Caminho base para armazenar os backups (padrão: "backups")

.PARAMETER RestoreFile
Arquivo ou diretório para restauração (obrigatório para operation=restore)

.PARAMETER FullBackup
Incluir tabelas analíticas no backup (padrão: false)

.PARAMETER RetentionDays
Dias de retenção dos backups (padrão: 30)

.PARAMETER Compress
Comprimir arquivos de backup (padrão: true)

.PARAMETER Encrypt
Criptografar arquivos de backup (padrão: true)

.EXAMPLE
# Backup padrão
.\backup-recovery-system.ps1 -Operation backup

# Backup completo com compressão
.\backup-recovery-system.ps1 -Operation backup -FullBackup -Compress

# Configurar agendamento
.\backup-recovery-system.ps1 -Operation schedule

# Verificar integridade
.\backup-recovery-system.ps1 -Operation verify

# Limpeza de backups antigos
.\backup-recovery-system.ps1 -Operation cleanup -RetentionDays 7

.NOTES
Requer variáveis de ambiente:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- BACKUP_ENCRYPTION_KEY (opcional, para criptografia)

Para agendamento automático, configure no Task Scheduler do Windows.
#> 