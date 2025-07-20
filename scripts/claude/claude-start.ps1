# claude-start.ps1
param(
    [string]$ImageName = "claude-ready"
)

Write-Host "Verificando imagem Docker..." -ForegroundColor Yellow

# Verificar se a imagem já existe
$imageExists = docker images -q $ImageName 2>$null

if (-not $imageExists) {
    Write-Host "Construindo imagem Claude Code (primeira vez)..." -ForegroundColor Yellow
    
    # Criar Dockerfile temporário
    $dockerfileContent = @"
FROM node:22-slim
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code
WORKDIR /workspace
CMD ["bash"]
"@
    
    # Salvar Dockerfile temporário
    $dockerfileContent | Out-File -FilePath "Dockerfile.temp" -Encoding UTF8
    
    # Construir imagem
    docker build -t $ImageName -f "Dockerfile.temp" .
    
    # Remover Dockerfile temporário
    Remove-Item "Dockerfile.temp" -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Imagem criada com sucesso! Proximas execucoes serao mais rapidas." -ForegroundColor Green
    } else {
        Write-Host "Erro ao criar imagem." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Imagem ja existe. Iniciando rapidamente..." -ForegroundColor Green
}

Write-Host "Iniciando Claude Code..." -ForegroundColor Cyan
docker run -it --rm -v "${PWD}:/workspace" $ImageName