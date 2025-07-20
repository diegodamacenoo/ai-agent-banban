# Clear Rate Limit Cache Script
Write-Host "Limpando cache do Rate Limiter..." -ForegroundColor Cyan

# Verificar se variaveis Redis existem
$hasRedis = ($env:UPSTASH_REDIS_REST_URL -and $env:UPSTASH_REDIS_REST_TOKEN)

if ($hasRedis) {
    Write-Host "Detectado Redis (Upstash), limpando via API..." -ForegroundColor Yellow
    
    $prefixes = @("rl:auth", "rl:api", "rl:upload", "rl:pwd-reset")
    
    foreach ($prefix in $prefixes) {
        try {
            $url = "$env:UPSTASH_REDIS_REST_URL/keys/$prefix*"
            $headers = @{
                "Authorization" = "Bearer $env:UPSTASH_REDIS_REST_TOKEN"
                "Content-Type" = "application/json"
            }
            
            Write-Host "Buscando chaves com prefixo: $prefix" -ForegroundColor Gray
            $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers -ErrorAction SilentlyContinue
            
            if ($response -and $response.result -and $response.result.Count -gt 0) {
                foreach ($key in $response.result) {
                    $deleteUrl = "$env:UPSTASH_REDIS_REST_URL/del/$key"
                    Invoke-RestMethod -Uri $deleteUrl -Method POST -Headers $headers -ErrorAction SilentlyContinue | Out-Null
                    Write-Host "Removido: $key" -ForegroundColor Red
                }
            } else {
                Write-Host "Nenhuma chave encontrada para $prefix" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "Erro ao processar $prefix : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "Cache Redis limpo com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Usando cache in-memory, reinicie o servidor Next.js para limpar" -ForegroundColor Yellow
    Write-Host "Execute: Ctrl+C no terminal do Next.js e depois 'npm run dev'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "DICAS PARA TESTES:" -ForegroundColor Magenta
Write-Host "1. Agora voce tem 50 tentativas por 15 minutos (aumentado de 5)" -ForegroundColor Gray
Write-Host "2. /auth/callback nao tem rate limiting" -ForegroundColor Gray
Write-Host "3. Use incognito para evitar cache do browser" -ForegroundColor Gray
Write-Host "4. Aguarde alguns segundos entre tentativas" -ForegroundColor Gray
Write-Host ""
Write-Host "Pronto para testar convites!" -ForegroundColor Green 