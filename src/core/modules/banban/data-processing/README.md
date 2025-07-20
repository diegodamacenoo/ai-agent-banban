# BanBan Data Processing Module v2.0.0

Sistema robusto de processamento de dados para cliente BanBan Fashion especializado em receber, validar e processar dados do ERP via webhooks.

## 📋 Visão Geral

O módulo **BanBan Data Processing** é responsável por processar eventos das Edge Functions do Supabase com arquitetura modular, validação robusta e métricas avançadas. Refatorado para a nova arquitetura v2.0.0 seguindo os padrões estabelecidos.

### Características Principais

- **Processamento de Eventos**: Suporte a 15+ tipos de eventos do ERP
- **Validação Robusta**: Schemas Zod para validação de dados
- **Processamento em Lote**: Configuração flexível de batch processing
- **Métricas Avançadas**: Coleta e análise de performance
- **Health Monitoring**: Verificação contínua de saúde do sistema
- **API REST Completa**: 13 endpoints para gerenciamento
- **Auditoria**: Log completo de todas as operações
- **Retry Logic**: Sistema inteligente de reprocessamento

## 🏗️ Arquitetura

### Componentes Principais

```
BanbanDataProcessingModule/
├── services/
│   ├── EventValidationService
│   ├── EventProcessingService
│   ├── WebhookListenerService
│   └── MetricsCollectionService
├── handlers/
│   └── DataProcessingApiHandlers
└── types/
    └── Interfaces e Schemas
```

### Fluxo de Processamento

1. **Recebimento**: Webhooks recebidos via Edge Functions
2. **Validação**: Verificação de schema e assinatura
3. **Processamento**: Transformação e persistência dos dados
4. **Auditoria**: Log de todas as operações
5. **Métricas**: Coleta de dados de performance

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 15.0.0
- Supabase configurado

### Instalação

```bash
# Aplicar migrações do banco de dados
npm run migrate:up banban/data-processing

# Instalar dependências
npm install @supabase/supabase-js zod date-fns lodash crypto
```

### Configuração

```typescript
import { BanbanDataProcessingModule } from './modules/banban/data-processing';

const config = {
  enableInventoryListener: true,
  enableSalesListener: true,
  enablePurchaseListener: true,
  enableTransferListener: true,
  batchProcessing: true,
  batchSize: 50,
  batchTimeout: 5000
};

const dataProcessing = new BanbanDataProcessingModule(config);
await dataProcessing.initialize();
```

## 📊 Banco de Dados

### Tabelas Criadas

1. **tenant_data_processing_events** - Eventos para processamento
2. **tenant_data_processing_log** - Log detalhado de operações
3. **tenant_data_processing_config** - Configurações por tenant
4. **tenant_data_processing_metrics** - Métricas de performance
5. **tenant_data_processing_failed_events** - Eventos falhados
6. **tenant_data_processing_audit** - Auditoria completa

### Características do Banco

- **Row Level Security (RLS)** habilitado
- **Índices otimizados** para performance
- **Triggers automáticos** para updated_at
- **Constraints de validação** para integridade
- **Políticas de isolamento** por tenant

## 🔌 API Endpoints

### Principais Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/events` | POST | Processa um evento individual |
| `/events/batch` | POST | Processa múltiplos eventos em lote |
| `/events/validate` | POST | Valida um evento sem processá-lo |
| `/events/status/{id}` | GET | Status de processamento |
| `/events/reprocess/{id}` | POST | Reprocessa evento falhado |
| `/queue` | GET | Status da fila de processamento |
| `/queue/flush` | POST | Força processamento da fila |
| `/metrics` | GET | Métricas de processamento |
| `/health` | GET | Verificação de saúde |

### Webhooks Especializados

| Endpoint | Descrição | Rate Limit |
|----------|-----------|------------|
| `/webhooks/inventory` | Eventos de inventário | 5000/hour |
| `/webhooks/sales` | Eventos de vendas | 5000/hour |
| `/webhooks/purchase` | Eventos de compras | 2000/hour |
| `/webhooks/transfer` | Eventos de transferências | 1000/hour |

## 📝 Tipos de Eventos Suportados

### Eventos de Produtos
- `product_created` - Produto criado
- `product_updated` - Produto atualizado
- `product_discontinued` - Produto descontinuado

### Eventos de Inventário
- `inventory_adjustment` - Ajuste de estoque
- `inventory_count` - Contagem de estoque
- `inventory_transfer` - Transferência de estoque

### Eventos de Vendas
- `sale_completed` - Venda concluída
- `sale_cancelled` - Venda cancelada
- `return_processed` - Devolução processada

### Eventos de Compras
- `purchase_completed` - Compra concluída
- `purchase_cancelled` - Compra cancelada
- `purchase_returned` - Compra devolvida

### Eventos de Transferências
- `transfer_initiated` - Transferência iniciada
- `transfer_completed` - Transferência concluída
- `transfer_cancelled` - Transferência cancelada

## ⚙️ Configurações Avançadas

### Schema de Configuração

```json
{
  "general": {
    "enabled": true,
    "auto_processing": true,
    "debug_mode": false,
    "environment": "production"
  },
  "queue_management": {
    "max_event_queue_size": 10000,
    "processing_timeout": 30000,
    "batch_size": 50,
    "max_concurrent_processors": 5
  },
  "retry_configuration": {
    "retry_attempts": 3,
    "initial_retry_delay": 1000,
    "max_retry_delay": 30000,
    "backoff_multiplier": 2.0,
    "jitter_enabled": true
  },
  "webhook_configuration": {
    "enable_webhooks": true,
    "signature_validation": true,
    "timestamp_validation": true,
    "max_event_age": 3600000
  },
  "monitoring_metrics": {
    "enable_metrics": true,
    "metrics_interval": 60,
    "detailed_metrics": true,
    "performance_tracking": true,
    "error_tracking": true
  }
}
```

### Validação de Eventos

```typescript
const eventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['sale_completed', 'inventory_adjustment', ...]),
  source: z.string().min(1),
  tenant_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  signature: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(5)
});
```

## 📈 Métricas e Monitoramento

### Métricas Coletadas

- **Eventos Processados**: Total e por tipo
- **Performance**: Tempo médio de processamento
- **Erros**: Taxa de falha e categorização
- **Fila**: Tamanho e throughput
- **Recursos**: Uso de memória e CPU

### Health Check

```typescript
const health = await dataProcessing.healthCheck();
console.log(health);
// {
//   healthy: true,
//   status: 'healthy',
//   timestamp: '2024-12-19T10:00:00Z',
//   details: {
//     initialized: true,
//     total_events_processed: 15420,
//     successful_events: 15380,
//     failed_events: 40,
//     avg_processing_time: 250,
//     services_status: {...}
//   }
// }
```

### Alertas Configurados

1. **queue_size_high** - Fila com mais de 8000 eventos
2. **queue_size_critical** - Fila com mais de 9500 eventos
3. **processing_failure_rate_high** - Taxa de falha > 10%
4. **processing_latency_high** - Latência > 10 segundos

## 🔄 Jobs Automatizados

### Jobs Configurados

| Job | Frequência | Descrição |
|-----|------------|-----------|
| `event-processor` | 30s | Processa eventos da fila |
| `failed-event-retry` | 5min | Reprocessa eventos falhados |
| `metrics-collector` | 1min | Coleta métricas de performance |
| `queue-cleanup` | 2h | Limpa eventos antigos |

## 🔐 Segurança

### Validação de Webhooks

- **Assinatura HMAC**: Verificação de integridade
- **Timestamp**: Validação de idade do evento
- **Rate Limiting**: Proteção contra spam
- **IP Whitelisting**: Controle de origem (opcional)

### Auditoria

Todas as operações são registradas na tabela `tenant_data_processing_audit`:

```sql
SELECT 
  operation_type,
  action,
  performed_at,
  success,
  user_id
FROM tenant_data_processing_audit
WHERE tenant_id = $1
ORDER BY performed_at DESC;
```

## 🧪 Uso Programático

### Exemplo Básico

```typescript
import { BanbanDataProcessingModule } from './modules/banban/data-processing';

// Inicializar módulo
const dataProcessing = new BanbanDataProcessingModule({
  enableInventoryListener: true,
  batchProcessing: true,
  batchSize: 100
});

// Registrar e inicializar
dataProcessing.register();
await dataProcessing.initialize();

// Processar evento individual
const event = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'sale_completed',
  source: 'pos_system',
  tenant_id: 'tenant_uuid',
  timestamp: new Date().toISOString(),
  data: {
    sale_id: 'SALE_001',
    total_amount: 299.99,
    items: [...]
  }
};

const result = await dataProcessing.processEvent(event);
console.log('Processamento:', result);

// Processar lote
const events = [event1, event2, event3];
const results = await dataProcessing.processBatch(events);

// Obter métricas
const metrics = dataProcessing.getProcessingMetrics();
console.log('Métricas:', metrics);
```

### Funções de Conveniência

```typescript
import { 
  processInventoryEvent,
  processSalesEvent,
  processPurchaseEvent,
  processTransferEvent
} from './modules/banban/data-processing';

// Processamento direto por tipo
await processInventoryEvent(inventoryEvent);
await processSalesEvent(salesEvent);
```

## 🔧 Manutenção

### Limpeza de Dados

```typescript
// Limpar cache e fila
const cleared = dataProcessing.clearCache();
console.log(`${cleared.clearedFromQueue} eventos removidos da fila`);

// Forçar processamento
await dataProcessing.flushBatch();
```

### Reprocessamento

```typescript
// Reprocessar evento específico via API
POST /api/modules/banban/data-processing/events/reprocess/{event_id}

// Ou programaticamente
const failedEvents = await getFailedEvents();
for (const event of failedEvents) {
  await dataProcessing.processEvent(event);
}
```

## 📋 Troubleshooting

### Problemas Comuns

1. **Fila cheia**: Aumentar `max_event_queue_size` ou `max_concurrent_processors`
2. **Eventos falhando**: Verificar logs em `tenant_data_processing_log`
3. **Performance baixa**: Analisar métricas e ajustar `batch_size`
4. **Webhooks não chegando**: Verificar configuração de assinatura

### Logs e Debug

```typescript
// Habilitar modo debug
const config = {
  debug_mode: true,
  log_level: 'debug'
};

// Verificar logs
SELECT * FROM tenant_data_processing_log 
WHERE operation_status = 'failed' 
ORDER BY created_at DESC;
```

## 🔄 Migrações

### Aplicar Migração

```bash
# Aplicar
npm run migrate:up banban/data-processing/001_initial_setup

# Rollback (CUIDADO: Perda de dados)
npm run migrate:down banban/data-processing/001_initial_setup
```

## 📦 Dependências

### Obrigatórias

- `@supabase/supabase-js@^2.39.0` - Cliente Supabase
- `zod@^3.22.0` - Validação de schemas
- `date-fns@^2.30.0` - Manipulação de datas
- `lodash@^4.17.21` - Utilitários
- `crypto@^1.0.1` - Criptografia

### Opcionais

- `uuid@^9.0.0` - Geração de UUIDs
- `compression@^1.7.4` - Compressão de dados
- `bull@^4.10.0` - Queue management avançado

## 🤝 Integração com Outros Módulos

### Módulos Conectados

- **banban-insights**: Recebe eventos processados
- **banban-performance**: Recebe métricas de performance
- **banban-inventory**: Sincroniza eventos de inventário
- **Edge Functions**: Processa eventos das 4 funções

### Eventos Emitidos

- `data-processing.event.processed`
- `data-processing.event.failed`
- `data-processing.batch.completed`
- `data-processing.queue.full`
- `data-processing.health.degraded`

## 📄 Licença

Proprietary - Axon Development Team

## 📞 Suporte

- **Documentação**: https://docs.axon-system.com/modules/banban/data-processing
- **Suporte**: https://support.axon-system.com/banban/data-processing
- **Repository**: https://github.com/axon-system/banban-modules

---

*Última atualização: 19/12/2024 - v2.0.0* 
    "metrics_interval": 60,
    "detailed_metrics": true,
    "performance_tracking": true,
    "error_tracking": true
  }
}
```

### Validação de Eventos

```typescript
const eventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['sale_completed', 'inventory_adjustment', ...]),
  source: z.string().min(1),
  tenant_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  signature: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(5)
});
```

## 📈 Métricas e Monitoramento

### Métricas Coletadas

- **Eventos Processados**: Total e por tipo
- **Performance**: Tempo médio de processamento
- **Erros**: Taxa de falha e categorização
- **Fila**: Tamanho e throughput
- **Recursos**: Uso de memória e CPU

### Health Check

```typescript
const health = await dataProcessing.healthCheck();
console.log(health);
// {
//   healthy: true,
//   status: 'healthy',
//   timestamp: '2024-12-19T10:00:00Z',
//   details: {
//     initialized: true,
//     total_events_processed: 15420,
//     successful_events: 15380,
//     failed_events: 40,
//     avg_processing_time: 250,
//     services_status: {...}
//   }
// }
```

### Alertas Configurados

1. **queue_size_high** - Fila com mais de 8000 eventos
2. **queue_size_critical** - Fila com mais de 9500 eventos
3. **processing_failure_rate_high** - Taxa de falha > 10%
4. **processing_latency_high** - Latência > 10 segundos

## 🔄 Jobs Automatizados

### Jobs Configurados

| Job | Frequência | Descrição |
|-----|------------|-----------|
| `event-processor` | 30s | Processa eventos da fila |
| `failed-event-retry` | 5min | Reprocessa eventos falhados |
| `metrics-collector` | 1min | Coleta métricas de performance |
| `queue-cleanup` | 2h | Limpa eventos antigos |

## 🔐 Segurança

### Validação de Webhooks

- **Assinatura HMAC**: Verificação de integridade
- **Timestamp**: Validação de idade do evento
- **Rate Limiting**: Proteção contra spam
- **IP Whitelisting**: Controle de origem (opcional)

### Auditoria

Todas as operações são registradas na tabela `tenant_data_processing_audit`:

```sql
SELECT 
  operation_type,
  action,
  performed_at,
  success,
  user_id
FROM tenant_data_processing_audit
WHERE tenant_id = $1
ORDER BY performed_at DESC;
```

## 🧪 Uso Programático

### Exemplo Básico

```typescript
import { BanbanDataProcessingModule } from './modules/banban/data-processing';

// Inicializar módulo
const dataProcessing = new BanbanDataProcessingModule({
  enableInventoryListener: true,
  batchProcessing: true,
  batchSize: 100
});

// Registrar e inicializar
dataProcessing.register();
await dataProcessing.initialize();

// Processar evento individual
const event = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'sale_completed',
  source: 'pos_system',
  tenant_id: 'tenant_uuid',
  timestamp: new Date().toISOString(),
  data: {
    sale_id: 'SALE_001',
    total_amount: 299.99,
    items: [...]
  }
};

const result = await dataProcessing.processEvent(event);
console.log('Processamento:', result);

// Processar lote
const events = [event1, event2, event3];
const results = await dataProcessing.processBatch(events);

// Obter métricas
const metrics = dataProcessing.getProcessingMetrics();
console.log('Métricas:', metrics);
```

### Funções de Conveniência

```typescript
import { 
  processInventoryEvent,
  processSalesEvent,
  processPurchaseEvent,
  processTransferEvent
} from './modules/banban/data-processing';

// Processamento direto por tipo
await processInventoryEvent(inventoryEvent);
await processSalesEvent(salesEvent);
```

## 🔧 Manutenção

### Limpeza de Dados

```typescript
// Limpar cache e fila
const cleared = dataProcessing.clearCache();
console.log(`${cleared.clearedFromQueue} eventos removidos da fila`);

// Forçar processamento
await dataProcessing.flushBatch();
```

### Reprocessamento

```typescript
// Reprocessar evento específico via API
POST /api/modules/banban/data-processing/events/reprocess/{event_id}

// Ou programaticamente
const failedEvents = await getFailedEvents();
for (const event of failedEvents) {
  await dataProcessing.processEvent(event);
}
```

## 📋 Troubleshooting

### Problemas Comuns

1. **Fila cheia**: Aumentar `max_event_queue_size` ou `max_concurrent_processors`
2. **Eventos falhando**: Verificar logs em `tenant_data_processing_log`
3. **Performance baixa**: Analisar métricas e ajustar `batch_size`
4. **Webhooks não chegando**: Verificar configuração de assinatura

### Logs e Debug

```typescript
// Habilitar modo debug
const config = {
  debug_mode: true,
  log_level: 'debug'
};

// Verificar logs
SELECT * FROM tenant_data_processing_log 
WHERE operation_status = 'failed' 
ORDER BY created_at DESC;
```

## 🔄 Migrações

### Aplicar Migração

```bash
# Aplicar
npm run migrate:up banban/data-processing/001_initial_setup

# Rollback (CUIDADO: Perda de dados)
npm run migrate:down banban/data-processing/001_initial_setup
```

## 📦 Dependências

### Obrigatórias

- `@supabase/supabase-js@^2.39.0` - Cliente Supabase
- `zod@^3.22.0` - Validação de schemas
- `date-fns@^2.30.0` - Manipulação de datas
- `lodash@^4.17.21` - Utilitários
- `crypto@^1.0.1` - Criptografia

### Opcionais

- `uuid@^9.0.0` - Geração de UUIDs
- `compression@^1.7.4` - Compressão de dados
- `bull@^4.10.0` - Queue management avançado

## 🤝 Integração com Outros Módulos

### Módulos Conectados

- **banban-insights**: Recebe eventos processados
- **banban-performance**: Recebe métricas de performance
- **banban-inventory**: Sincroniza eventos de inventário
- **Edge Functions**: Processa eventos das 4 funções

### Eventos Emitidos

- `data-processing.event.processed`
- `data-processing.event.failed`
- `data-processing.batch.completed`
- `data-processing.queue.full`
- `data-processing.health.degraded`

## 📄 Licença

Proprietary - Axon Development Team

## 📞 Suporte

- **Documentação**: https://docs.axon-system.com/modules/banban/data-processing
- **Suporte**: https://support.axon-system.com/banban/data-processing
- **Repository**: https://github.com/axon-system/banban-modules

---

*Última atualização: 19/12/2024 - v2.0.0* 