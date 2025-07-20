# Troubleshooting & FAQ

## Problemas Comuns

### 🔧 Setup e Configuração

#### **Erro: "Supabase not configured"**
```bash
# Verificar variáveis de ambiente
grep SUPABASE .env.local

# Configurar se necessário
cp .env.example .env.local
# Editar com suas credenciais
```

#### **Erro: "Redis connection failed"**
```bash
# Verificar configuração Redis
grep UPSTASH .env.local

# Para desenvolvimento local (sem Redis)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

#### **Erro: "Client type not found"**
```bash
# Verificar client type
grep CLIENT_TYPE .env.local

# Para Banban
NEXT_PUBLIC_CLIENT_TYPE=banban
```

### 🚀 Desenvolvimento

#### **Build falha com erros TypeScript**
```bash
# Limpar cache
rm -rf .next node_modules/.cache

# Reinstalar dependências
pnpm install

# Verificar tipos
pnpm type-check
```

#### **Módulo não carrega**
1. Verificar se está registrado em `ModuleRegistry`
2. Verificar estrutura de arquivos obrigatória
3. Verificar permissões do usuário

#### **Webhook não funciona**
1. Verificar deploy da Edge Function
2. Verificar variáveis de ambiente na Supabase
3. Verificar logs no dashboard Supabase

### 🔍 Debugging

#### **Habilitar logs detalhados**
```typescript
// Em qualquer arquivo
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

// Habilitar debug para módulo específico
DEBUG_MODULES.AUTH = true;
```

#### **Verificar conexão com banco**
```bash
# Via CLI Supabase
supabase db psql
\dt # listar tabelas

# Verificar RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 🐛 Erros Específicos

#### **Error: getUser() failed after retries**
- Verificar token JWT válido
- Verificar conexão com Supabase
- Verificar se usuário não foi deletado

#### **Error: Organization not found**
- Verificar se usuário tem organization_id
- Verificar se organização existe
- Verificar políticas RLS

#### **Error: Module not authorized**
- Verificar permissões do usuário
- Verificar módulos habilitados na organização
- Verificar configuração client_type

## FAQ

### **Q: Como adicionar um novo módulo?**
A: Seguir o [Module Development Guide](../04-development/module-development-guide.md)

### **Q: Como configurar um novo cliente?**
A: Consultar [Client-Modules Architecture](../02-architecture/client-modules-architecture.md)

### **Q: Como fazer deploy?**
A: Seguir o [Deployment Guide](../05-operations/deployment-guide.md)

### **Q: Como monitorar performance?**
A: Usar o módulo Performance e verificar [Monitoring](../05-operations/monitoring-health.md)

## Logs Úteis

### **Frontend (Next.js)**
```bash
# Development
pnpm dev:banban

# Logs específicos
DEBUG=axon:* pnpm dev:banban
```

### **Backend (Fastify)**
```bash
cd backend
pnpm dev

# Com logs detalhados
LOG_LEVEL=debug pnpm dev
```

### **Supabase Edge Functions**
```bash
# Ver logs
supabase functions logs webhook-sales-flow

# Deploy com logs
supabase functions deploy webhook-sales-flow --debug
```

## Contatos de Suporte

- **Issues técnicos**: Criar issue no repositório
- **Documentação**: Verificar pasta `/docs`
- **Emergências**: Contatar administrador do sistema