# =======================================================
# Configuração para Testes RLS
# =======================================================

# Configurações do Banco de Dados
$global:DatabaseConfig = @{
    Server = "db.brfyaznoxnkgqmxkfrhb.supabase.co"
    Database = "postgres"
    Port = "5432"
    # As credenciais devem ser fornecidas via variáveis de ambiente
}

# Funções Auxiliares
function Get-DatabaseCredentials {
    # Verifica se as variáveis de ambiente necessárias existem
    if (-not $env:SUPABASE_DB_USER -or -not $env:SUPABASE_DB_PASSWORD) {
        throw "Credenciais do banco de dados não encontradas nas variáveis de ambiente"
    }
    
    return @{
        User = $env:SUPABASE_DB_USER
        Password = $env:SUPABASE_DB_PASSWORD
    }
}

function Invoke-Sqlcmd {
    param (
        [string]$Query,
        [string]$Role = "authenticated"
    )
    
    try {
        $creds = Get-DatabaseCredentials
        
        # Construir string de conexão
        $connString = "Host=$($DatabaseConfig.Server);Port=$($DatabaseConfig.Port);Database=$($DatabaseConfig.Database);Username=$($creds.User);Password=$($creds.Password);SSL Mode=Require"
        
        # Aqui você implementaria a lógica real de execução da query
        # Por enquanto, vamos apenas simular
        Write-Host "Executando query como role '$Role': $Query"
        
        # Retorna um objeto simulando resultado
        return @{
            Success = $true
            Role = $Role
            Query = $Query
        }
    }
    catch {
        Write-Error "Erro ao executar query: $_"
        throw
    }
}

# Usuários de Teste
$global:TestUsers = @{
    RegularUser = @{
        Id = "regular-user-id"
        Role = "authenticated"
        OrganizationId = "org-id-1"
    }
    OrgAdmin = @{
        Id = "org-admin-id"
        Role = "organization_admin"
        OrganizationId = "org-id-1"
    }
    MasterAdmin = @{
        Id = "master-admin-id"
        Role = "master_admin"
        OrganizationId = "org-id-1"
    }
} 