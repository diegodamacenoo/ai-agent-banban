# Test script for Phase 1 RLS Implementation
# Este script testa as políticas RLS implementadas nas tabelas core

# Importar configurações
. "$PSScriptRoot\..\config.ps1"

function Test-RLSAccess {
    param (
        [string]$Role,
        [string]$Email,
        [string]$Password = "Test@123"
    )

    Write-Host "`nTestando acesso para role: $Role" -ForegroundColor Cyan

    try {
        # Criar cliente Supabase com as credenciais do usuário
        $supabase = New-Object SupabaseClient -ArgumentList $SUPABASE_URL, $SUPABASE_KEY
        $auth = $supabase.Auth.SignIn($Email, $Password)

        if (-not $auth.User) {
            Write-Host "Erro ao autenticar usuário $Email" -ForegroundColor Red
            return
        }

        # Testar SELECT em suppliers
        Write-Host "`nTestando SELECT em suppliers..." -ForegroundColor Yellow
        $suppliers = $supabase.From("core_suppliers").Select("*").Execute()
        Write-Host "Suppliers encontrados: $($suppliers | Measure-Object | Select-Object -ExpandProperty Count)"

        # Testar SELECT em locations
        Write-Host "`nTestando SELECT em locations..." -ForegroundColor Yellow
        $locations = $supabase.From("core_locations").Select("*").Execute()
        Write-Host "Locations encontrados: $($locations | Measure-Object | Select-Object -ExpandProperty Count)"

        # Testar SELECT em products
        Write-Host "`nTestando SELECT em products..." -ForegroundColor Yellow
        $products = $supabase.From("core_products").Select("*").Execute()
        Write-Host "Products encontrados: $($products | Measure-Object | Select-Object -ExpandProperty Count)"

        if ($Role -in @("master_admin", "organization_admin", "editor")) {
            # Testar INSERT em suppliers
            Write-Host "`nTestando INSERT em suppliers..." -ForegroundColor Yellow
            $newSupplier = @{
                external_id = "TEST_SUP_$Role"
                trade_name = "Fornecedor Teste $Role"
                legal_name = "Fornecedor Teste Ltda $Role"
            }
            $result = $supabase.From("core_suppliers").Insert($newSupplier).Execute()
            Write-Host "INSERT resultado: $($result | Select-Object -ExpandProperty Status)"

            # Testar UPDATE em suppliers
            Write-Host "`nTestando UPDATE em suppliers..." -ForegroundColor Yellow
            $update = @{
                trade_name = "Fornecedor Teste $Role (Atualizado)"
            }
            $result = $supabase.From("core_suppliers")
                .Update($update)
                .Match(@{ external_id = "TEST_SUP_$Role" })
                .Execute()
            Write-Host "UPDATE resultado: $($result | Select-Object -ExpandProperty Status)"

            # Testar DELETE em suppliers
            Write-Host "`nTestando DELETE em suppliers..." -ForegroundColor Yellow
            $result = $supabase.From("core_suppliers")
                .Delete()
                .Match(@{ external_id = "TEST_SUP_$Role" })
                .Execute()
            Write-Host "DELETE resultado: $($result | Select-Object -ExpandProperty Status)"
        }
        else {
            Write-Host "`nOperações de escrita não permitidas para role $Role" -ForegroundColor Yellow
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
    Test-RLSAccess -Role $roleConfig.Role -Email $roleConfig.Email
}

Write-Host "`nTestes RLS concluídos!" -ForegroundColor Green 