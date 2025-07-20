# Script para sincronizar role do usuário entre profiles e auth.users

Write-Host "🔧 Sincronizando role do usuário master_admin..." -ForegroundColor Yellow

# Verificar se o Supabase CLI está instalado
if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI não encontrado. Instale com: npm install -g supabase" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Executando script de sincronização..." -ForegroundColor Blue

# Executar o script SQL
try {
    supabase db reset --db-url $env:DATABASE_URL
    Write-Host "✅ Script executado com sucesso!" -ForegroundColor Green
    
    Write-Host "📝 Verificando resultado..." -ForegroundColor Blue
    
    # Verificar se a sincronização funcionou
    $verifyQuery = @"
SELECT 
  p.email,
  p.role as profile_role,
  (au.raw_app_meta_data->>'user_role') as auth_role,
  CASE 
    WHEN p.role = (au.raw_app_meta_data->>'user_role') THEN '✅ Sincronizado'
    ELSE '❌ Dessincronizado'
  END as status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'brcomdiego@gmail.com';
"@

    Write-Host "🔍 Status da sincronização:" -ForegroundColor Cyan
    supabase db query $verifyQuery
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Faça logout e login novamente para que o JWT seja atualizado!" -ForegroundColor Yellow
    Write-Host "   1. Acesse /login" -ForegroundColor Gray
    Write-Host "   2. Clique em 'Sair'" -ForegroundColor Gray
    Write-Host "   3. Faça login novamente" -ForegroundColor Gray
    Write-Host "   4. Teste o acesso ao /admin" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Erro ao executar script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Green
Write-Host "   • Teste a página de debug: http://localhost:3000/admin/debug" -ForegroundColor Gray
Write-Host "   • Verifique o dashboard: http://localhost:3000/admin" -ForegroundColor Gray 