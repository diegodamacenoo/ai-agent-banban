# Script para testar conectividade com Supabase
# Uso: .\scripts\test-supabase-connection.ps1

Write-Host "Testando Conectividade com Supabase..." -ForegroundColor Cyan
Write-Host "=" * 50

# Ler variaveis do .env.local
$envFile = ".\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env.local nao encontrado!" -ForegroundColor Red
    exit 1
}

$supabaseUrl = ""
$supabaseKey = ""

Get-Content $envFile | ForEach-Object {
    if ($_ -match "NEXT_PUBLIC_SUPABASE_URL=(.*)") {
        $supabaseUrl = $matches[1]
    }
    if ($_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)") {
        $supabaseKey = $matches[1]
    }
}

if (-not $supabaseUrl) {
    Write-Host "NEXT_PUBLIC_SUPABASE_URL nao encontrada!" -ForegroundColor Red
    exit 1
}

if (-not $supabaseKey) {
    Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY nao encontrada!" -ForegroundColor Red
    exit 1
}

Write-Host "Variaveis de ambiente carregadas:" -ForegroundColor Green
Write-Host "   URL: $supabaseUrl"
Write-Host "   Key: $($supabaseKey.Substring(0, 20))..."

# Teste 1: DNS Resolution
Write-Host "`nTeste 1: Resolucao DNS..." -ForegroundColor Yellow
$hostname = ([System.Uri]$supabaseUrl).Host
try {
    $dnsResult = Resolve-DnsName $hostname -ErrorAction Stop
    Write-Host "DNS OK: $hostname -> $($dnsResult[0].IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "Falha DNS: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 2: Ping
Write-Host "`nTeste 2: Conectividade (Ping)..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection $hostname -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "Ping OK" -ForegroundColor Green
    } else {
        Write-Host "Ping falhou (pode ser normal)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Ping falhou: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Teste 3: HTTP Connection
Write-Host "`nTeste 3: Conexao HTTP..." -ForegroundColor Yellow
try {
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
    }
    
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "HTTP OK: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "HTTP falhou: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Detalhes: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Teste 4: Auth Endpoint
Write-Host "`nTeste 4: Auth Endpoint..." -ForegroundColor Yellow
try {
    $authUrl = "$supabaseUrl/auth/v1/user"
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
    }
    
    $response = Invoke-WebRequest -Uri $authUrl -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "Auth Endpoint OK: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "Auth Endpoint OK (401 esperado sem token valido)" -ForegroundColor Green
    } else {
        Write-Host "Auth Endpoint falhou: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 5: Next.js Server
Write-Host "`nTeste 5: Servidor Next.js..." -ForegroundColor Yellow
try {
    $nextResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "Next.js OK: Status $($nextResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Next.js falhou: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Certifique-se de que o servidor esta rodando com 'npm run dev'" -ForegroundColor Yellow
}

Write-Host "`n$('=' * 50)"
Write-Host "Teste de conectividade concluido!" -ForegroundColor Cyan
Write-Host "Se todos os testes passaram, o problema pode ser no lado do cliente." -ForegroundColor White 