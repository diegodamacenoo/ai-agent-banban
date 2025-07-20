# Sistema de Autenticação Híbrida - API Keys

## Visão Geral

O ponto 1.2.7 da **Estratégia de Autenticação Híbrida** foi implementado com sucesso, resolvendo a inconsistência entre JWT (usuários) e tokens fixos (webhooks).

## Arquitetura

### Antes (Inconsistente)
```
Frontend Apps  ──JWT──→  User APIs
ERP Systems   ──Token Fixo──→  Webhook APIs  ❌ Inconsistente
```

### Depois (Híbrida)
```
Frontend Apps  ──JWT──→        User APIs
ERP Systems   ──API Keys──→    Webhook APIs   ✅ Consistente
              ↳ Auditoria + Segurança
```

## Tipos de Autenticação

### 1. **JWT para Usuários** (`server.authenticateUser`)
- **Uso**: APIs de frontend, aplicações web
- **Formato**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`
- **Expiração**: Curta (horas/dias)
- **Ideal para**: Sessões humanas

### 2. **API Keys para Serviços** (`server.authenticateService`)
- **Uso**: Webhooks, sistemas automatizados, ERP
- **Formato**: `Authorization: Bearer ak_1234567890abcdef...`
- **Expiração**: Longa (6-12 meses)
- **Ideal para**: Sistemas automatizados

### 3. **Híbrida** (`server.authenticateHybrid`)
- **Uso**: Endpoints que aceitam ambos
- **Detecção automática**: `ak_` = API Key, resto = JWT
- **Flexibilidade máxima**

## Implementação

### Middleware Disponível

```typescript
// Apenas JWT
server.authenticateUser

// Apenas API Keys com permissão específica
server.authenticateService('webhook:purchase')

// Aceita ambos
server.authenticateHybrid('webhook:purchase')
```

### Exemplo de Uso

```typescript
// Webhook que aceita apenas API Keys
server.post('/webhook/purchase', {
  preHandler: server.authenticateService('webhook:purchase')
}, async (request, reply) => {
  // request.authType === 'api_key'
  // request.organizationId === 'uuid-da-org'
  // request.permissions === ['webhook:purchase', ...]
});

// Endpoint que aceita ambos
server.get('/data', {
  preHandler: server.authenticateHybrid()
}, async (request, reply) => {
  if (request.authType === 'jwt') {
    // Usuário logado via JWT
  } else if (request.authType === 'api_key') {
    // Sistema automatizado via API Key
  }
});
```

## Migração Realizada

### Webhooks Migrados ✅

1. **Purchase Flow** → `webhook:purchase`
2. **Inventory Flow** → `webhook:inventory`
3. **Sales Flow** → `webhook:sales`
4. **Transfer Flow** → `webhook:transfer`
5. **Returns Flow** → `webhook:returns`
6. **ETL Flow** → `webhook:etl`

### Mudanças nos Webhooks

**Antes:**
```typescript
preHandler: webhookAuthMiddleware(secretToken)
```

**Depois:**
```typescript
preHandler: server.authenticateService('webhook:purchase')
```

## Permissões de API Keys

### Webhooks
- `webhook:purchase` - Fluxo de compras
- `webhook:inventory` - Gestão de inventário  
- `webhook:sales` - Fluxo de vendas
- `webhook:transfer` - Transferências
- `webhook:returns` - Devoluções
- `webhook:etl` - Processos ETL

### Sistema
- `system:admin` - Acesso administrativo completo
- `system:read` - Leitura de dados do sistema
- `system:write` - Escrita de dados do sistema

## APIs Administrativas

### Base URL
```
/api/admin/api-keys
```

### Endpoints

#### Criar API Key
```http
POST /api/admin/api-keys
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "ERP BanBan - Webhooks",
  "description": "API Key para todos os webhooks do ERP",
  "permissions": ["webhook:purchase", "webhook:inventory"],
  "expires_at": "2025-12-31T23:59:59Z",
  "rate_limit": 5000
}
```

#### Listar API Keys
```http
GET /api/admin/api-keys
Authorization: Bearer <jwt-token>
```

#### Atualizar API Key
```http
PUT /api/admin/api-keys/{id}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Novo nome",
  "is_active": false
}
```

#### Revogar API Key
```http
DELETE /api/admin/api-keys/{id}
Authorization: Bearer <jwt-token>
```

#### Estatísticas de Uso
```http
GET /api/admin/api-keys/{id}/stats
Authorization: Bearer <jwt-token>
```

#### API Keys Próximas do Vencimento
```http
GET /api/admin/api-keys/expiring?days_ahead=30
Authorization: Bearer <jwt-token>
```

## Setup e Deployment

### 1. Migração do Banco
```bash
# Executar migração SQL
psql -d database -f backend/migrations/create_api_keys_tables.sql
```

### 2. Criar API Key Inicial
```bash
# Script automatizado
cd backend
node scripts/create-initial-api-key.js
```

### 3. Configurar Sistemas Externos
```bash
# Substituir nos sistemas que chamam webhooks:
# DE:   Authorization: Bearer banban_webhook_secret_2025
# PARA: Authorization: Bearer ak_1234567890abcdef...
```

## Segurança

### Armazenamento
- ✅ **API Keys** são hasheadas (SHA-256) no banco
- ✅ **Chave real** nunca é armazenada
- ✅ **Prefixo** visível para identificação (`ak_1234567890...`)

### Auditoria
- ✅ **Logs de uso** com IP, endpoint, status
- ✅ **Contadores** de uso por API Key
- ✅ **Timestamps** de criação e último uso
- ✅ **Identificação** precisa de qual sistema chamou

### Rate Limiting
- ✅ **Configurável** por API Key
- ✅ **Padrão**: 1000 requests/hora
- ✅ **Sistemas**: até 10k requests/hora

## Monitoramento

### Métricas Disponíveis
- Total de requests por API Key
- Requests nos últimos 7/30 dias
- Tempo médio de resposta
- Taxa de erro
- API Keys próximas do vencimento

### Alertas
- API Keys expirando em X dias
- Uso anômalo (rate limit excedido)
- Falhas de autenticação

## Benefícios Alcançados

### ✅ **Auditoria Completa**
- Identificação precisa: sistema/usuário
- Logs estruturados de todas as chamadas
- Rastreabilidade fim-a-fim

### ✅ **Segurança Adequada** 
- JWT para humanos (expiração curta)
- API Keys para máquinas (longa duração)
- Hash criptográfico das chaves

### ✅ **Compatibilidade**
- Webhooks mantém simplicidade
- Sem necessidade de login/refresh
- APIs existentes não quebram

### ✅ **Flexibilidade**
- Permissões granulares por serviço
- Rate limiting personalizado
- Rotação controlada de chaves

### ✅ **Monitoramento**
- Tracking de uso por sistema
- Estatísticas em tempo real
- Alertas proativos

## Troubleshooting

### Erro 401 "Invalid API key format"
- Verificar se a chave começa com `ak_`
- Confirmar formato: `Authorization: Bearer ak_...`

### Erro 401 "API Key inválida ou inativa"
- Verificar se a API Key não expirou
- Confirmar se está ativa no painel admin
- Validar permissões necessárias

### Erro 401 "Permissão insuficiente"
- API Key não tem a permissão necessária
- Verificar permissões no painel admin
- Adicionar permissão necessária

### Performance Issues
- Verificar rate limit da API Key
- Analisar logs de uso para padrões
- Considerar aumentar rate limit

## Roadmap

### ✅ **Fase 1.2.7 - Concluída**
- Sistema de API Keys implementado
- Middleware híbrido funcional
- Webhooks migrados
- Painel administrativo básico

### 🔄 **Próximas Melhorias**
- Auto-rotação de API Keys
- HMAC signatures para webhooks críticos
- Dashboard de uso em tempo real
- Alertas automáticos por email/Slack

## Suporte

Para dúvidas ou problemas:

1. **Logs**: Verificar logs do backend com nível DEBUG
2. **Admin Panel**: Usar `/api/admin/api-keys` para gestão
3. **Monitoramento**: Acompanhar métricas de uso
4. **Documentação**: Este arquivo e comentários no código