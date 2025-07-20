# Test script for RLS Audit Logging
# Este script testa o sistema de audit logging implementado para RLS

# Importar configurações
. "$PSScriptRoot\..\config.ps1"

function Test-AuditLogging {
    param (
        [string]$Role,
        [string]$Email,
        [string]$Password = "Test@123"
    )

    Write-Host "`nTestando audit logging para role: $Role" -ForegroundColor Cyan

    try {
        # Criar cliente Supabase com as credenciais do usuário
        $supabase = New-Object SupabaseClient -ArgumentList $SUPABASE_URL, $SUPABASE_KEY
        $auth = $supabase.Auth.SignIn($Email, $Password)

        if (-not $auth.User) {
            Write-Host "Erro ao autenticar usuário $Email" -ForegroundColor Red
            return
        }

        # Gerar operações para teste
        Write-Host "`nGerando operações de teste..." -ForegroundColor Yellow

        # 1. Teste de INSERT (deve gerar log de sucesso ou violação)
        Write-Host "`nTestando INSERT..." -ForegroundColor Yellow
        $newSupplier = @{
            external_id = "TEST_AUDIT_$Role"
            trade_name = "Fornecedor Teste Audit $Role"
            legal_name = "Fornecedor Teste Audit Ltda $Role"
        }
        $result = $supabase.From("core_suppliers").Insert($newSupplier).Execute()
        Write-Host "INSERT resultado: $($result | Select-Object -ExpandProperty Status)"

        # 2. Teste de SELECT (não deve gerar log)
        Write-Host "`nTestando SELECT..." -ForegroundColor Yellow
        $suppliers = $supabase.From("core_suppliers").Select("*").Execute()
        Write-Host "SELECT resultado: $($suppliers | Measure-Object | Select-Object -ExpandProperty Count) registros"

        # 3. Teste de UPDATE (deve gerar log de sucesso ou violação)
        Write-Host "`nTestando UPDATE..." -ForegroundColor Yellow
        $update = @{
            trade_name = "Fornecedor Teste Audit $Role (Atualizado)"
        }
        $result = $supabase.From("core_suppliers")
            .Update($update)
            .Match(@{ external_id = "TEST_AUDIT_$Role" })
            .Execute()
        Write-Host "UPDATE resultado: $($result | Select-Object -ExpandProperty Status)"

        # 4. Teste de DELETE (deve gerar log de sucesso ou violação)
        Write-Host "`nTestando DELETE..." -ForegroundColor Yellow
        $result = $supabase.From("core_suppliers")
            .Delete()
            .Match(@{ external_id = "TEST_AUDIT_$Role" })
            .Execute()
        Write-Host "DELETE resultado: $($result | Select-Object -ExpandProperty Status)"

        # Verificar logs gerados
        if ($Role -in @("master_admin", "organization_admin")) {
            Write-Host "`nVerificando logs gerados..." -ForegroundColor Yellow
            
            # Consultar logs das últimas operações
            $logs = $supabase.Rpc("get_rls_audit_logs", @{
                p_start_date = [DateTime]::Now.AddMinutes(-5).ToString("o")
                p_end_date = [DateTime]::Now.ToString("o")
                p_entity_type = "core_suppliers"
            }).Execute()

            if ($logs) {
                Write-Host "`nLogs encontrados:" -ForegroundColor Green
                foreach ($log in $logs) {
                    Write-Host "Operação: $($log.operation_type)" -ForegroundColor Yellow
                    Write-Host "Entidade: $($log.entity_type)" -ForegroundColor Yellow
                    Write-Host "Status: $($log.success)" -ForegroundColor Yellow
                    Write-Host "Timestamp: $($log.timestamp)" -ForegroundColor Yellow
                    Write-Host "---"
                }
            }
            else {
                Write-Host "Nenhum log encontrado" -ForegroundColor Red
            }
        }
        else {
            Write-Host "`nRole $Role não tem permissão para visualizar logs" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Erro nos testes para role $Role" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
    finally {
        if ($supabase) {
            $supabase.Auth.SignOut()
        }
    }
}

# Executar testes para cada role
$roles = @(
    @{
        Role = "master_admin"
        Email = "test_master_admin_3325b2b3b5df4d49b2813692005ebcf4@test.com"
    },
    @{
        Role = "organization_admin"
        Email = "test_org_admin_9a6c45d24d10415b86ec85af6f74d6ee@test.com"
    },
    @{
        Role = "editor"
        Email = "test_editor_c5d76e63a37e47c9994c4acfb7ead5cf@test.com"
    },
    @{
        Role = "reader"
        Email = "test_reader_62d1716905e74ae58af8eec5bc7716f4@test.com"
    }
)

foreach ($roleConfig in $roles) {
    Test-AuditLogging -Role $roleConfig.Role -Email $roleConfig.Email
}

Write-Host "`nTestes de audit logging concluídos!" -ForegroundColor Green 