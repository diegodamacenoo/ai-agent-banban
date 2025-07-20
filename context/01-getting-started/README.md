# Contexto do Projeto Axon

## Visão Executiva

**Axon** é uma plataforma modular de agentes de IA projetada para integração com sistemas legados, gerando insights acionáveis em tempo real. O sistema implementa uma arquitetura multi-tenant robusta com foco em segurança, escalabilidade e modularidade.

### Cliente Atual: Banban Fashion
- **Setor**: Varejo de calçados
- **Tipo**: Cliente customizado (não padrão)
- **Características**: 25 status de documento, integrações ERP proprietário, sistema fiscal, BI

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- pnpm
- Supabase CLI
- PowerShell (para scripts de automação)

### Setup Rápido
```bash
# 1. Clonar e instalar
git clone [repo-url]
cd ai-agent-banban
pnpm install

# 2. Configurar ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 3. Iniciar desenvolvimento
pnpm dev:banban              # Frontend na porta 3000
cd backend && pnpm dev       # Backend na porta 4000

# 4. Setup banco (se necessário)
supabase start               # Ambiente local
supabase db push            # Aplicar migrações
```

### Comandos Essenciais
```bash
# Desenvolvimento
pnpm dev:banban              # Inicia com cliente Banban
pnpm build                   # Build de produção
pnpm lint                    # Verificação de código
pnpm type-check             # Verificação TypeScript

# Backend
cd backend && pnpm dev      # API Fastify na porta 4000
cd backend && pnpm test     # Testes do backend

# Banco de dados
supabase start               # Ambiente local
supabase db push            # Aplicar migrações
supabase functions deploy   # Deploy edge functions
```

## 📚 Estrutura da Documentação

### 🏁 [01 - Getting Started](../01-getting-started/)
- [Quick Start Guide](./quick-start.md) - Setup rápido e primeiros passos
- [Troubleshooting](./troubleshooting.md) - FAQ e resolução de problemas

### 🏗️ [02 - Architecture](../02-architecture/)
- [Overview](../02-architecture/overview.md) - Visão geral da arquitetura
- [Patterns & Conventions](../02-architecture/patterns-conventions.md) - Padrões e convenções
- [Client-Modules System](../02-architecture/client-modules-architecture.md) - Sistema client-modules
- [Database Schema](../02-architecture/database-schema.md) - Estrutura do banco

### 🔌 [03 - APIs & Integrations](../03-apis-integrations/)
- [APIs Overview](../03-apis-integrations/apis-overview.md) - Visão geral das APIs
- [Webhooks Guide](../03-apis-integrations/webhooks-guide.md) - Edge Functions e webhooks
- [External Integrations](../03-apis-integrations/external-integrations.md) - Integrações externas

### 💻 [04 - Development](../04-development/)
- [Module Development Guide](../04-development/module-development-guide.md) - Guia de desenvolvimento de módulos
- [Templates](../04-development/templates/) - Templates e geradores
- [Coding Standards](../04-development/coding-standards.md) - Padrões de código

### 🔧 [05 - Operations](../05-operations/)
- [Module Lifecycle System](../05-operations/module-lifecycle-system.md) - Sistema de lifecycle
- [Monitoring & Health](../05-operations/monitoring-health.md) - Monitoramento
- [Deployment Guide](../05-operations/deployment-guide.md) - Guia de deploy

## Status do Projeto

### ✅ Concluído
- Sistema multi-tenant base
- Módulos padrão (Inventory, Analytics, Performance)
- Webhooks completos (4 flows)
- Sistema de auditoria
- Padronização de ENUMs
- Políticas RLS robustas

### 🔄 Em Desenvolvimento
- Correções de linter
- Otimizações de performance
- Documentação técnica

### 📋 Próximos Passos
- Fase 2: Sistema de plugins
- Fase 3: Extensibilidade avançada
- Fase 4: Deploy e CI/CD

## Variáveis de Ambiente Principais

```env
NEXT_PUBLIC_CLIENT_TYPE=banban
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Próximos Passos

1. 📖 Ler o [Quick Start Guide](./quick-start.md)
2. 🏗️ Entender a [Arquitetura](../02-architecture/overview.md)
3. 💻 Seguir o [Development Guide](../04-development/module-development-guide.md)
4. 🔍 Em caso de problemas, consultar [Troubleshooting](./troubleshooting.md)