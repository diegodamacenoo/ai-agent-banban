# Teste da API Admin do Supabase - Convite Direto
Write-Host "=== TESTE API ADMIN SUPABASE - CONVITE DIRETO ===" -ForegroundColor Green

# Configurações
$supabaseUrl = "https://bopytcghbmuywfltmwhk.supabase.co"
$email = "teste.admin.$(Get-Date -Format 'HHmmss')@exemplo.com"

Write-Host "Email de teste: $email" -ForegroundColor Yellow
Write-Host ""

# Verificar se o service role key está disponível
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "IMPORTANTE: Para este teste funcionar, voce precisa definir a variavel de ambiente:" -ForegroundColor Red
    Write-Host '$env:SUPABASE_SERVICE_ROLE_KEY = "sua_service_role_key_aqui"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Obtenha a service role key em:" -ForegroundColor Yellow
    Write-Host "Dashboard Supabase > Settings > API > service_role (secret)" -ForegroundColor White
    Write-Host ""
    Write-Host "Depois execute:" -ForegroundColor Yellow
    Write-Host "powershell -ExecutionPolicy Bypass -File teste-api-direta.ps1" -ForegroundColor White
    Write-Host ""
    
    # Teste apenas se a API está respondendo
    Write-Host "Testando conectividade com a API..." -ForegroundColor Gray
    try {
        $healthCheck = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Method GET
        Write-Host "API respondendo normalmente" -ForegroundColor Green
    } catch {
        Write-Host "Erro de conectividade: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    exit 1
}

# Dados do convite
$inviteData = @{
    email = $email
    data = @{
        first_name = ""
        last_name = ""
        role = "editor"
        organization_id = "f47b5c84-0e3a-415d-8e65-4a1e6b6a7c23"
        status = "active"
        is_setup_complete = $false
        invite_type = "admin_invite"
    }
    redirect_to = "http://localhost:3000/auth/callback?type=invite&next=%2Fsetup-account%3Ffrom%3Dinvite"
} | ConvertTo-Json -Depth 3

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "apikey" = $env:SUPABASE_SERVICE_ROLE_KEY
}

Write-Host "Enviando convite via API Admin..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/admin/users" -Method POST -Body $inviteData -Headers $headers
    
    Write-Host ""
    Write-Host "SUCESSO!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "User ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Email: $($response.email)" -ForegroundColor Cyan
    Write-Host "Created: $($response.created_at)" -ForegroundColor Cyan
    Write-Host "Role: $($response.user_metadata.role)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "EMAIL ENVIADO COM TEMPLATE DO DASHBOARD!" -ForegroundColor Green
    Write-Host "Verifique a caixa de entrada do email de teste." -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "- O template usado eh o configurado no Dashboard do Supabase" -ForegroundColor White
    Write-Host "- NAO o template local (supabase/templates/invite.html)" -ForegroundColor White
    Write-Host "- Para personalizar: Dashboard > Settings > Auth > Email Templates > Invite user" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "ERRO:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host ""
            Write-Host "Detalhes do erro:" -ForegroundColor Yellow
            Write-Host $responseBody -ForegroundColor Gray
        } catch {
            Write-Host "Nao foi possivel ler detalhes do erro" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Gray
Write-Host "Proximos passos se o teste foi bem-sucedido:" -ForegroundColor Gray
Write-Host "1. Configure o template no Dashboard do Supabase" -ForegroundColor White
Write-Host "2. Teste um convite real pela interface admin" -ForegroundColor White
Write-Host "3. Verifique se o email personalizado eh enviado" -ForegroundColor White 