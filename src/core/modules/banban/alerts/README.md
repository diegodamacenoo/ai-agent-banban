# BanBan Alerts Module v2.0.0

Sistema inteligente de alertas para o cliente BanBan Fashion, especializado em detectar oportunidades e problemas críticos no varejo de calçados e moda.

## 🏗️ Estrutura do Módulo

```
src/core/modules/banban/alerts/
├── index.ts                    # Interface principal do módulo
├── config.ts                   # Configurações e thresholds
├── module.json                 # Metadados do módulo
├── README.md                   # Este arquivo
├── services/                   # Lógica de negócio
│   ├── alert-processor.ts      # Processamento de alertas
│   ├── alert-escalation.ts     # Sistema de escalação
│   └── alert-metrics.ts        # Métricas e analytics
├── types/                      # Tipos TypeScript
│   └── index.ts               # Exports de tipos
└── migrations/                 # Schema do banco
    └── 001_initial_setup.sql  # Setup inicial
```

## 🚀 Como Usar

### Importação no Frontend

```typescript
// Hook React para usar alertas
import { useAlerts } from '@/app/(protected)/[slug]/(modules)/alerts/hooks/useAlerts';

// Tipos e enums
import { 
  AlertSeverity, 
  AlertType, 
  AlertStatus 
} from '@/core/modules/banban/alerts/services/alert-processor';
```

### Uso Direto dos Serviços

```typescript
// Importar módulo principal
import { banbanAlertProcessor } from '@/core/modules/banban/alerts';

// Processar alertas
const alerts = await banbanAlertProcessor.processAllAlerts('org-id');

// Obter métricas
const analytics = await alertMetricsService.generateAnalyticsReport(alerts, 7);
```

## ⚙️ Configurações

Os thresholds são configuráveis via `config.ts`:

```typescript
business_rules: {
  alert_types: [
    {
      type: "STOCK_CRITICAL",
      threshold: 5,           // 5 unidades
      priority: "critical",
      auto_escalate: true
    },
    {
      type: "STOCK_LOW",
      threshold: 10,          // 10 unidades
      priority: "attention",
      auto_escalate: false
    }
    // ... outros tipos
  ]
}
```

## 🔄 Sistema de Escalação

Escalação automática baseada em regras configuráveis:

- **Crítico**: Escalação imediata, máximo 3 níveis, intervalo 15min
- **Atenção**: Escalação após 60min, máximo 2 níveis
- **Moderado**: Escalação após 240min, máximo 1 nível
- **Oportunidade**: Sem escalação automática

## 📊 Métricas Disponíveis

- Tempo de processamento
- Taxa de entrega de notificações
- Taxa de falsos positivos
- Breakdown por tipo e severidade
- Analytics de escalação

## 🎯 Tipos de Alertas

1. **STOCK_CRITICAL** - Estoque crítico (≤5 unidades)
2. **STOCK_LOW** - Estoque baixo (≤10 unidades)
3. **MARGIN_LOW** - Margem baixa (<31%)
4. **SLOW_MOVING** - Produto parado (≥30 dias)
5. **OVERSTOCK** - Excesso de estoque (≥500 unidades)
6. **SEASONAL_OPPORTUNITY** - Oportunidades sazonais

## 🗄️ Banco de Dados

### Tabelas Principais

- `tenant_alerts` - Alertas gerados
- `tenant_alert_rules` - Regras configuráveis
- `tenant_alert_thresholds` - Thresholds por tenant
- `tenant_alert_deliveries` - Log de entregas
- `tenant_alert_escalations` - Histórico de escalações

### Migração

Execute a migração inicial:

```sql
-- Executar: migrations/001_initial_setup.sql
```

## 🔧 Desenvolvimento

### Executar Testes

```bash
npm test -- --testPathPattern=alerts
```

### Mock Data

O sistema inclui dados mock para desenvolvimento. Para conectar dados reais, substitua os métodos `fetch*Data` no `alert-processor.ts`.

### Debug

```typescript
// Habilitar debug detalhado
process.env.DEBUG_ALERTS = 'true';
```

## 🚦 Status das Features

- ✅ **Processamento de Alertas** - Completo
- ✅ **Sistema de Escalação** - Completo  
- ✅ **Métricas e Analytics** - Completo
- ✅ **Configurações Dinâmicas** - Completo
- ⏳ **APIs REST** - Pendente
- ⏳ **Notificações Multi-Canal** - Pendente
- ⏳ **Integração com Banco Real** - Pendente

## 🔗 Integração com outros Módulos

Este módulo se integra com:

- `banban-data-processing` - Recebe eventos do ERP
- `banban-performance` - Usa métricas de performance
- `banban-insights` - Fornece dados para insights

## 📚 Documentação Adicional

- [API Reference](../../../docs/api-reference.md)
- [Architecture Overview](../../../../context/02-architecture/overview.md)
- [Module Development Guide](../../../../context/04-development/module-development-guide.md)

## 🤝 Contribuição

1. Siga os padrões estabelecidos em `context/`
2. Mantenha compatibilidade com a interface `ModuleInterface`
3. Adicione testes para novas funcionalidades
4. Atualize esta documentação quando necessário

## 📄 Licença

Proprietary - Axon Development Team