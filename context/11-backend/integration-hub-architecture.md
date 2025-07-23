# Integration Hub Architecture (Estado Futuro)

## Visão Geral

O backend Axon foi reposicionado como **Integration Hub** - um servidor dedicado para integrações externas, ETL, processamento pesado e comunicação com sistemas legados. Esta arquitetura separa claramente responsabilidades entre Frontend (UI/UX) e Backend (Integrações).

## Conceito Core

```
ERP Banban ─────┐
                │
Sistema Legado ─┼──► Backend Fastify ──► Supabase
                │    (Integration Hub)     (Source of Truth)
Banco Cliente ──┘
                      ▲
                      │
                 Next.js App
                (Server Actions)
```

## Estrutura do Integration Hub

### 1. **Integrations Layer** (`/integrations/`)
```typescript
integrations/
├── banban/                    # Cliente Banban
│   ├── flows/                # 6 fluxos operacionais
│   │   ├── sales/           # Vendas + RFM Analytics
│   │   ├── purchase/        # Compras + Recebimento
│   │   ├── inventory/       # Estoque + Snapshots
│   │   ├── transfer/        # Transferências CD↔Loja
│   │   ├── returns/         # Devoluções
│   │   └── etl/            # ETL batch diário
│   ├── performance/         # Analytics e métricas
│   └── shared/             # ECA engine, validações
├── riachuelo/              # Futuro cliente
└── generic/                # Conectores reutilizáveis
```

### 2. **Routes Layer** (`/routes/integrations/`)
```typescript
routes/integrations/
├── banban/
│   ├── webhooks.ts         # Endpoints consolidados
│   ├── rest.ts            # Business flows REST
│   └── health.ts          # Health checks
└── shared/
    └── monitoring.ts       # Métricas globais
```

### 3. **Shared Infrastructure** (`/shared/`)
```typescript
shared/
├── integration-hub/
│   ├── base-connector.ts   # Classe base para conectores
│   ├── webhook-handler.ts  # Handler genérico
│   └── etl-pipeline.ts    # Pipeline ETL base
├── monitoring/
│   ├── logger.ts          # Logs estruturados
│   └── metrics.ts         # Métricas de integração
└── resilience/
    ├── circuit-breaker.ts  # Proteção contra falhas
    └── retry-policy.ts     # Políticas de retry
```

## Fluxos Banban Existentes

### 1. **Sales Flow** (Vendas)
- **Webhook**: `/api/v1/webhooks/sales-flow`
- **Ações**: register_sale, register_payment, register_cancellation
- **Features**: ECA engine, RFM analytics, validações

### 2. **Purchase Flow** (Compras)
- **Webhook**: `/api/v1/webhooks/purchase-flow`
- **Ações**: create_order, receive_document, confirm_stock
- **Features**: ETL automático, validação de divergências

### 3. **Inventory Flow** (Estoque)
- **Webhook**: `/api/v1/webhooks/inventory-flow`
- **Ações**: adjust_stock, take_snapshot, validate_movement
- **Features**: Snapshots periódicos, validações

### 4. **Transfer Flow** (Transferências)
- **Webhook**: `/api/v1/webhooks/transfer-flow`
- **Ações**: create_transfer, ship_products, receive_at_store
- **Features**: Estados complexos, rastreamento

### 5. **Returns Flow** (Devoluções)
- **Webhook**: `/api/v1/webhooks/returns-flow`
- **Ações**: register_return, process_refund
- **Features**: Integração com vendas

### 6. **ETL Flow** (Processamento)
- **Webhook**: `/api/v1/webhooks/etl`
- **Ações**: daily_batch, data_transformation
- **Features**: Processamento agendado

## Padrões de Integração

### Webhook Handler Pattern
```typescript
class BanbanWebhookHandler extends BaseWebhookHandler {
  async handle(payload: WebhookPayload) {
    // 1. Validação
    await this.validate(payload);
    
    // 2. Transformação
    const data = await this.transform(payload);
    
    // 3. Processamento
    const result = await this.process(data);
    
    // 4. Persistência
    await this.persist(result);
    
    // 5. Resposta
    return this.formatResponse(result);
  }
}
```

### ETL Pipeline Pattern
```typescript
class BanbanETLPipeline extends BaseETLPipeline {
  stages = [
    new ExtractStage(),      // Buscar dados
    new TransformStage(),    // Normalizar
    new ValidateStage(),     // Validar
    new LoadStage()         // Salvar
  ];
  
  async run() {
    return this.executeWithRetry(
      this.stages,
      { maxRetries: 3, backoff: 'exponential' }
    );
  }
}
```

### Circuit Breaker Pattern
```typescript
const salesWebhook = new CircuitBreaker(
  BanbanSalesHandler,
  {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 120000
  }
);
```

## Templates para Novos Clientes

### Flow Template
```typescript
// templates/flow-template/
├── index.ts               // Entry point
├── handler.ts            // Webhook handler
├── schemas.ts            // Validação Zod
├── service.ts            // Lógica de negócio
├── transformer.ts        // ETL transforms
└── tests/               // Testes unitários
```

### Connector Template
```typescript
// templates/connector-template/
├── connector.ts          // Database connector
├── queries.ts           // SQL queries
├── mapper.ts            // Data mapping
└── config.ts            // Configurações
```

## Monitoramento e Observabilidade

### Logs Estruturados
```typescript
logger.info('webhook.received', {
  client: 'banban',
  flow: 'sales',
  action: 'register_sale',
  payload_size: 1024,
  timestamp: new Date()
});
```

### Métricas de Integração
- **Latência**: Tempo de processamento por fluxo
- **Throughput**: Requisições por segundo
- **Erro Rate**: Taxa de falhas por endpoint
- **Queue Size**: Tamanho das filas de processamento
- **Circuit State**: Estado dos circuit breakers

### Health Checks
```typescript
GET /health/integrations/banban
{
  "status": "healthy",
  "flows": {
    "sales": { "status": "ok", "last_success": "2024-01-15T10:30:00Z" },
    "purchase": { "status": "ok", "circuit": "closed" },
    "inventory": { "status": "degraded", "error_rate": 0.02 }
  }
}
```

## Segurança

### Autenticação de Webhooks
- **API Keys**: Por cliente/fluxo
- **JWT Validation**: Tokens assinados
- **IP Whitelisting**: Lista de IPs permitidos
- **Rate Limiting**: Por endpoint/cliente

### Validação de Dados
- **Schema Validation**: Zod schemas
- **Business Rules**: Validações customizadas
- **Data Sanitization**: Limpeza de inputs
- **Audit Trail**: Log de todas as operações

## Benefícios da Arquitetura

### 1. **Separação de Responsabilidades**
- Frontend: UI/UX, Server Actions, experiência do usuário
- Backend: Integrações, ETL, processamento pesado

### 2. **Escalabilidade**
- Backends independentes por carga
- Queue system para picos
- Circuit breakers para resiliência

### 3. **Manutenibilidade**
- Código organizado por cliente/fluxo
- Templates para novos clientes
- Monitoramento centralizado

### 4. **Flexibilidade**
- Fácil adicionar novos clientes
- Conectores plugáveis
- Transformações customizáveis

## Migração Zero-Downtime

### Fase 1: Reorganização (2 dias)
1. Mover arquivos mantendo rotas
2. Ajustar imports
3. Testar todos os fluxos
4. Criar templates

### Fase 2: Otimização (1 semana)
1. Implementar circuit breakers
2. Adicionar monitoramento
3. Criar SDK cliente
4. Documentar APIs

### Fase 3: Expansão (ongoing)
1. Adicionar novos clientes
2. Criar conectores genéricos
3. Expandir templates
4. Melhorar observabilidade

## Conclusão

O Integration Hub transforma o backend Axon em uma plataforma robusta para integrações empresariais, mantendo 100% da funcionalidade existente enquanto prepara o sistema para escala e novos clientes.