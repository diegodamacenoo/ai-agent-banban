#!/usr/bin/env pwsh

# Script para testar o fluxo de convites
# Uso: .\test-invite-flow.ps1 -Email "test@example.com" -OrganizationId "123" -Role "admin"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$OrganizationId,
    
    [Parameter(Mandatory=$true)]
    [string]$Role,
    
    [string]$SupabaseUrl = "https://bopytcghbmuywfltmwhk.supabase.co",
    [string]$AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTA4NzUsImV4cCI6MjA2MTg4Njg3NX0.NTQzZanJrEipj_ylVohXFYSACY4M65zVDcux7eRUOXY"
)

Write-Host "🔧 Testando Fluxo de Convites" -ForegroundColor Yellow
Write-Host "📧 Email: $Email" -ForegroundColor Cyan
Write-Host "🏢 Organization ID: $OrganizationId" -ForegroundColor Cyan
Write-Host "👤 Role: $Role" -ForegroundColor Cyan
Write-Host ""

# Preparar payload
$payload = @{
    email = $Email
    organization_id = $OrganizationId
    role = $Role
} | ConvertTo-Json

# Headers
$headers = @{
    "Authorization" = "Bearer $AnonKey"
    "Content-Type" = "application/json"
    "apikey" = $AnonKey
}

try {
    Write-Host "📤 Enviando convite..." -ForegroundColor Blue
    
    $response = Invoke-RestMethod -Uri "$SupabaseUrl/functions/v1/invite-new-user" `
                                 -Method POST `
                                 -Headers $headers `
                                 -Body $payload `
                                 -ErrorAction Stop
    
    Write-Host "✅ Convite enviado com sucesso!" -ForegroundColor Green
    Write-Host "📋 Resposta:" -ForegroundColor White
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    # Verificar se o usuário foi criado
    Write-Host ""
    Write-Host "🔍 Verificando se o usuário foi criado..." -ForegroundColor Blue
    
    $checkUserUrl = "$SupabaseUrl/rest/v1/profiles?select=id,email,role,organization_id&email=eq.$Email"
    $checkHeaders = @{
        "apikey" = $AnonKey
        "Authorization" = "Bearer $AnonKey"
    }
    
    $userCheck = Invoke-RestMethod -Uri $checkUserUrl -Headers $checkHeaders -ErrorAction Stop
    
    if ($userCheck -and $userCheck.Count -gt 0) {
        Write-Host "✅ Usuário encontrado no banco:" -ForegroundColor Green
        $userCheck | ConvertTo-Json -Depth 3 | Write-Host
    } else {
        Write-Host "⚠️ Usuário não encontrado no banco de dados" -ForegroundColor Yellow
    }
    
    # Verificar convite na tabela user_invites
    Write-Host ""
    Write-Host "🔍 Verificando registro do convite..." -ForegroundColor Blue
    
    $checkInviteUrl = "$SupabaseUrl/rest/v1/user_invites?select=id,email,status,created_at&email=eq.$Email"
    $inviteCheck = Invoke-RestMethod -Uri $checkInviteUrl -Headers $checkHeaders -ErrorAction Stop
    
    if ($inviteCheck -and $inviteCheck.Count -gt 0) {
        Write-Host "✅ Convite registrado:" -ForegroundColor Green
        $inviteCheck | ConvertTo-Json -Depth 3 | Write-Host
    } else {
        Write-Host "⚠️ Convite não encontrado na tabela user_invites" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Verificar o email de convite recebido" -ForegroundColor White
    Write-Host "2. Clicar no link do convite" -ForegroundColor White
    Write-Host "3. Deve redirecionar para: http://localhost:3000/setup-account?from=invite" -ForegroundColor White
    Write-Host "4. Completar o setup da conta" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao enviar convite:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
    
    exit 1
}

Write-Host ""
Write-Host "🎉 Teste de convite concluído!" -ForegroundColor Green 