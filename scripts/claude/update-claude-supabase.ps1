# update-claude-supabase.ps1
Write-Host "Atualizando imagem Claude Code com Supabase MCP..." -ForegroundColor Yellow

# Criar Dockerfile com Supabase MCP
@"
FROM node:22-slim

# Instalar todas as dependências necessárias
RUN apt-get update && \
    apt-get install -y \
    git \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Instalar Claude Code
RUN npm install -g @anthropic-ai/claude-code

# Instalar Supabase MCP Server
RUN npm install -g @supabase/mcp-server-supabase

# Criar script de inicialização
RUN echo '#!/bin/bash\n\
echo "🚀 Claude Code com Supabase MCP pronto!"\n\
echo "💡 Para configurar Supabase MCP:"\n\
echo "   claude mcp add supabase -e SUPABASE_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTA4NzUsImV4cCI6MjA2MTg4Njg3NX0.NTQzZanJrEipj_ylVohXFYSACY4M65zVDcux7eRUOXY -- npx -y @supabase/mcp-server-supabase@latest --project-ref=bopytchgbmuywftmwhk"\n\
echo ""\n\
exec bash' > /entrypoint.sh && chmod +x /entrypoint.sh

# Configurar diretório de trabalho
WORKDIR /workspace

# Usar script de inicialização
ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
"@ | Out-File -FilePath "Dockerfile" -Encoding UTF8 -Force

# Remover imagem antiga
docker rmi claude-ready 2>$null

# Construir nova imagem
docker build -t claude-ready .

Write-Host "Imagem atualizada com Supabase MCP! Iniciando..." -ForegroundColor Green
docker run -it --rm -v "${PWD}:/workspace" claude-ready