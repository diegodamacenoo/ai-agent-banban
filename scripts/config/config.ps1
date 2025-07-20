# =======================================================
# Configuração Global do Sistema
# =======================================================

# Configurações do Banco de Dados
$global:dbConfig = @{
    Host = "db.supabase.co"
    Port = "5432"
    Database = "postgres"
    User = "postgres"
    # A senha deve ser definida via variável de ambiente SUPABASE_DB_PASSWORD
}

# Configurações de Backup
$global:backupConfig = @{
    BackupPath = "C:\backups\database"
    RetentionDays = 30
    CompressBackups = $true
    EnableEncryption = $true
}

# Configurações de Segurança
$global:securityConfig = @{
    MaxPayloadSize = 10485760  # 10MB em bytes
    MaxUploadSize = 5242880    # 5MB em bytes
    AllowedFileTypes = @(".jpg", ".jpeg", ".png", ".pdf", ".xlsx", ".csv")
}

# Função para obter a senha do banco de dados
function Get-DatabasePassword {
    $env:SUPABASE_DB_PASSWORD
}

# Função para validar configurações
function Test-Configuration {
    if (-not $dbConfig.Host) {
        throw "Host do banco de dados não configurado"
    }
    if (-not (Test-Path $backupConfig.BackupPath)) {
        New-Item -ItemType Directory -Path $backupConfig.BackupPath -Force
    }
    if (-not (Get-DatabasePassword)) {
        Write-Warning "Senha do banco de dados não configurada no ambiente"
    }
}

# Inicializar configurações
Test-Configuration 

# Configurações globais para scripts PowerShell
$config = @{
    # Configurações do banco de dados
    dbServer = "localhost"
    dbName = "postgres"
    dbPort = "5432"
    
    # Caminhos importantes
    rootPath = (Get-Item $PSScriptRoot).Parent.Parent.FullName
    migrationsPath = Join-Path (Get-Item $PSScriptRoot).Parent.Parent.FullName "supabase/migrations"
    scriptsPath = Join-Path (Get-Item $PSScriptRoot).Parent.Parent.FullName "scripts"
    
    # Configurações de logging
    logLevel = "INFO"  # DEBUG, INFO, WARN, ERROR
    logPath = Join-Path (Get-Item $PSScriptRoot).Parent.Parent.FullName "logs"
    
    # Timeouts (em segundos)
    defaultTimeout = 30
    longTimeout = 120
    
    # Cores para output
    colors = @{
        success = "Green"
        error = "Red"
        warning = "Yellow"
        info = "Cyan"
        debug = "Gray"
    }
}

# Função para logging consistente
function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [string]$Level = "INFO",
        
        [Parameter(Mandatory=$false)]
        [string]$Color = $null
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Se uma cor foi especificada, usar Write-Host com cor
    if ($Color) {
        Write-Host $logMessage -ForegroundColor $Color
    }
    # Se não, usar Write-Output
    else {
        Write-Output $logMessage
    }
    
    # Gravar no arquivo de log
    $logFile = Join-Path $config.logPath "script-execution.log"
    Add-Content -Path $logFile -Value $logMessage
}

# Função para validar ambiente
function Test-Environment {
    # Verificar se o Supabase CLI está instalado
    try {
        $supabaseVersion = supabase --version
        Write-Log "Supabase CLI encontrado: $supabaseVersion" -Level "DEBUG" -Color $config.colors.debug
    }
    catch {
        throw "Supabase CLI não encontrado. Por favor, instale via 'npm install -g supabase'"
    }
    
    # Verificar se o Node.js está instalado
    try {
        $nodeVersion = node --version
        Write-Log "Node.js encontrado: $nodeVersion" -Level "DEBUG" -Color $config.colors.debug
    }
    catch {
        throw "Node.js não encontrado. Por favor, instale via https://nodejs.org/"
    }
    
    # Verificar se o banco está acessível
    try {
        $testQuery = "SELECT version();"
        $result = Invoke-Sqlcmd -ServerInstance $config.dbServer -Database $config.dbName -Query $testQuery -ErrorAction Stop
        Write-Log "Conexão com banco de dados estabelecida" -Level "DEBUG" -Color $config.colors.debug
    }
    catch {
        throw "Não foi possível conectar ao banco de dados. Erro: $_"
    }
    
    Write-Log "Ambiente validado com sucesso" -Level "INFO" -Color $config.colors.success
    return $true
}

# Exportar configurações e funções
Export-ModuleMember -Variable config
Export-ModuleMember -Function Write-Log, Test-Environment 