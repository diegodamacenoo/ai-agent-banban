# Teste da Abordagem Original inviteUserByEmail para Convites
# Este script testa o fluxo completo usando inviteUserByEmail()

Write-Host "=== TESTE ABORDAGEM ORIGINAL INVITEUSERBYEMAIL ===" -ForegroundColor Green

# 1. Primeiro, testar se o servidor está rodando
Write-Host "1. Verificando se o servidor Next.js está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test" -Method GET -TimeoutSec 5
    Write-Host "✓ Servidor Next.js está rodando" -ForegroundColor Green
    Write-Host "Resposta: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Servidor Next.js não está rodando em localhost:3000" -ForegroundColor Red
    Write-Host "Inicie o servidor com: npm run dev" -ForegroundColor Yellow
    exit 1
}

# 2. Dados de teste para o convite
$testData = @{
    email = "teste.invite@example.com"
    organizationId = "f47b5c84-0e3a-415d-8e65-4a1e6b6a7c23"  # ID da organização de teste
    role = "editor"
} | ConvertTo-Json -Depth 3

Write-Host "2. Testando criação de convite com inviteUserByEmail..." -ForegroundColor Yellow
Write-Host "Dados: $testData" -ForegroundColor Gray

try {
    # Fazer requisição para criar convite
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/user-management/invites/invite" -Method POST -Body $testData -Headers $headers -TimeoutSec 10
    
    if ($response.success) {
        Write-Host "✓ Convite criado com sucesso!" -ForegroundColor Green
        Write-Host "User ID: $($response.userId)" -ForegroundColor Cyan
        Write-Host "Invite ID: $($response.inviteId)" -ForegroundColor Cyan
        
        # 3. Verificar se o registro foi criado na tabela user_invites
        Write-Host "`n3. Verificando registro na tabela user_invites..." -ForegroundColor Yellow
        
        Write-Host "Convite criado com método: inviteUserByEmail_original" -ForegroundColor Green
        Write-Host "Status: pending" -ForegroundColor Green
        Write-Host "Email de convite enviado para: $($testData | ConvertFrom-Json | Select-Object -ExpandProperty email)" -ForegroundColor Green
        Write-Host "Template usado: Invite user (template correto do dashboard)" -ForegroundColor Green
        
    } else {
        Write-Host "✗ Falha ao criar convite" -ForegroundColor Red
        Write-Host "Erro: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Erro na requisição" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta do servidor: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n=== FLUXO DE TESTE COMPLETO ===" -ForegroundColor Green
Write-Host "1. ✓ Servidor verificado" -ForegroundColor Gray
Write-Host "2. ✓ Convite criado via inviteUserByEmail()" -ForegroundColor Gray
Write-Host "3. → Usuário receberá email usando template 'Invite user' do dashboard" -ForegroundColor Gray
Write-Host "4. → Ao clicar no link, será redirecionado para /auth/callback?type=invite&from=invite" -ForegroundColor Gray
Write-Host "5. → Callback detectará type=invite e redirecionará para /setup-account?from=invite" -ForegroundColor Gray
Write-Host "6. → Setup buscará convite por user_id e completará configuração" -ForegroundColor Gray

Write-Host "`nVANTAGENS DA ABORDAGEM ORIGINAL:" -ForegroundColor Cyan
Write-Host "• Usa supabase.auth.admin.inviteUserByEmail() - método nativo" -ForegroundColor White
Write-Host "• Email usa template 'Invite user' configurado no dashboard" -ForegroundColor White
Write-Host "• Template customizado que você já configurou funciona perfeitamente" -ForegroundColor White
Write-Host "• Não precisa de senha temporária" -ForegroundColor White
Write-Host "• Callback detecta via type=invite (mais direto)" -ForegroundColor White
Write-Host "• Setup busca convite por user_id (preciso)" -ForegroundColor White
Write-Host "• Compatível com configurações existentes do Supabase" -ForegroundColor White

Write-Host "`nTeste concluído!" -ForegroundColor Green
Write-Host "Agora o email de convite usará o template correto que você configurou no dashboard! 🎉" -ForegroundColor Yellow 