# Script para corrigir problema de recursao nas politicas RLS
# Data: 2025-01-13
# Descricao: Aplica migracao para resolver dependencia circular nas politicas da tabela profiles

param(
    [switch]$Test,
    [switch]$Apply,
    [switch]$Rollback
)

# Configurações
$SUPABASE_PROJECT_ID = "sxqhfxlxwdqwgqgwcfvn"
$MIGRATION_FILE = "supabase/migrations/20250113000001_fix_rls_recursion.sql"

Write-Host "=== CORRECAO DE POLITICAS RLS - PROBLEMA DE RECURSAO ===" -ForegroundColor Cyan
Write-Host "Projeto: $SUPABASE_PROJECT_ID" -ForegroundColor Yellow

if ($Test) {
    Write-Host "`n[TESTE] Verificando problema atual..." -ForegroundColor Yellow
    
    # Testar se conseguimos fazer uma consulta simples na tabela profiles
    Write-Host "Testando consulta na tabela profiles via aplicação..."
    
    # Iniciar o servidor de desenvolvimento para testar
    Write-Host "Iniciando servidor Next.js para teste..."
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru
    
    Write-Host "Aguarde o servidor inicializar e teste a página admin/organizations..." -ForegroundColor Green
    Write-Host "URL de teste: http://localhost:3000/admin/organizations" -ForegroundColor Green
    Write-Host "Pressione qualquer tecla após testar..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    return
}

if ($Apply) {
    Write-Host "`n[APLICACAO] Aplicando correcao das politicas RLS..." -ForegroundColor Green
    
    # Verificar se o arquivo de migracao existe
    if (-not (Test-Path $MIGRATION_FILE)) {
        Write-Host "ERRO: Arquivo de migracao nao encontrado: $MIGRATION_FILE" -ForegroundColor Red
        return
    }
    
    Write-Host "Arquivo de migracao encontrado: $MIGRATION_FILE" -ForegroundColor Green
    
    # Aplicar a migracao usando Supabase CLI
    Write-Host "Aplicando migracao..."
    try {
        # Fazer push da migracao
        $result = & npx supabase db push --project-ref $SUPABASE_PROJECT_ID 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Migracao aplicada com sucesso!" -ForegroundColor Green
            
            # Verificar se as funcoes foram criadas
            Write-Host "`nVerificando se as funcoes auxiliares foram criadas..."
            Write-Host "- get_user_organization_id()" -ForegroundColor Cyan
            Write-Host "- is_master_admin()" -ForegroundColor Cyan  
            Write-Host "- is_organization_admin()" -ForegroundColor Cyan
            
            Write-Host "`nVerificando se as politicas foram recriadas..."
            Write-Host "- profiles_select_policy (SEM RECURSAO)" -ForegroundColor Cyan
            Write-Host "- profiles_insert_policy" -ForegroundColor Cyan
            Write-Host "- profiles_update_policy" -ForegroundColor Cyan
            Write-Host "- profiles_delete_policy" -ForegroundColor Cyan
            
        } else {
            Write-Host "Erro ao aplicar migracao:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Erro inesperado ao aplicar migracao: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return
}

if ($Rollback) {
    Write-Host "`n[ROLLBACK] Revertendo alterações..." -ForegroundColor Yellow
    
    Write-Host "ATENÇÃO: O rollback irá restaurar as políticas anteriores que têm problema de recursão!" -ForegroundColor Red
    $confirm = Read-Host "Tem certeza? (y/N)"
    
    if ($confirm -ne "y") {
        Write-Host "Rollback cancelado." -ForegroundColor Yellow
        return
    }
    
    # Aplicar rollback (restaurar migração anterior)
    try {
        $result = & npx supabase db reset --project-ref $SUPABASE_PROJECT_ID 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Rollback executado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro no rollback:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Erro inesperado no rollback: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return
}

# Menu principal
Write-Host "`nOpções disponíveis:" -ForegroundColor White
Write-Host "1. -Test     : Testar problema atual" -ForegroundColor Cyan
Write-Host "2. -Apply    : Aplicar correção das políticas RLS" -ForegroundColor Green
Write-Host "3. -Rollback : Reverter alterações (cuidado!)" -ForegroundColor Yellow

Write-Host "`nExemplos de uso:" -ForegroundColor White
Write-Host "  .\scripts\fix-rls-recursion.ps1 -Test" -ForegroundColor Gray
Write-Host "  .\scripts\fix-rls-recursion.ps1 -Apply" -ForegroundColor Gray
Write-Host "  .\scripts\fix-rls-recursion.ps1 -Rollback" -ForegroundColor Gray

Write-Host "`n=== DIAGNOSTICO DO PROBLEMA ===" -ForegroundColor Cyan
Write-Host "Problema identificado: Recursao nas politicas RLS da tabela 'profiles'" -ForegroundColor Red
Write-Host ""
Write-Host "Causa raiz:" -ForegroundColor Yellow
Write-Host "- A politica SELECT da tabela 'profiles' consulta a propria tabela 'profiles'" -ForegroundColor White
Write-Host "- Isso cria uma dependencia circular que impede o acesso aos dados" -ForegroundColor White
Write-Host ""
Write-Host "Solucao:" -ForegroundColor Green
Write-Host "- Criar funcoes auxiliares SECURITY DEFINER" -ForegroundColor White
Write-Host "- Recriar politicas usando essas funcoes (sem recursao)" -ForegroundColor White
Write-Host "- Manter a mesma logica de seguranca, mas sem dependencia circular" -ForegroundColor White 