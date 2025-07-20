# BanBan Alerts

## 📝 Descrição
Sistema inteligente de alertas para o cliente BanBan Fashion, especializado em detectar oportunidades e problemas críticos no varejo de calçados e moda. Processa dados em tempo real via webhooks do ERP e gera alertas proativos baseados em thresholds específicos do negócio.

## 🎯 Funcionalidades
- **Alertas de Estoque Crítico**: Detecta produtos com estoque abaixo do limite crítico (5 unidades)
- **Alertas de Estoque Baixo**: Identifica produtos com estoque baixo (10 unidades) para reposição
- **Alertas de Margem**: Monitora produtos com margem abaixo de 31% (threshold específico BanBan)
- **Produtos Parados**: Identifica produtos sem movimento há mais de 30 dias
- **Notificações Multi-canal**: Email e dashboard integrados
- **Processamento em Batch**: Processa até 1000 alertas por execução
- **Retenção Inteligente**: Mantém histórico de alertas por 30 dias

## 🔧 Configuração
```typescript
// Configuração padrão do módulo
const alertsConfig = {
  processingInterval: 600000, // 10 minutos
  retentionDays: 30,
  enableEmailNotifications: true,
  enableDashboardNotifications: true,
  
  // Thresholds específicos BanBan
  criticalStockLevel: 5,
  lowStockLevel: 10,
  marginThreshold: 0.31,
  slowMovingDays: 30,
  
  // Configurações de processamento
  batchSize: 100,
  maxAlertsPerRun: 1000
};
```

## 📊 Métricas e KPIs
- **Alertas Processados**: Número total de alertas gerados por período
- **Taxa de Resolução**: Percentual de alertas resolvidos vs. gerados
- **Tempo de Resposta**: Tempo médio entre detecção e notificação
- **Produtos Críticos**: Número de produtos em estado crítico
- **Impacto Financeiro**: Valor total dos produtos em alerta

## 🔗 Integrações
- **ERP BanBan**: Recebe dados via webhooks para análise em tempo real
- **Sistema de Notificações**: Email automático e notificações no dashboard
- **Dashboard Analytics**: Visualização de alertas e métricas
- **Banco de Dados**: Armazenamento de histórico e configurações

## 🚀 Endpoints API
- `GET /api/modules/banban/alerts` - Lista alertas ativos
- `POST /api/modules/banban/alerts/configure` - Atualiza configurações
- `GET /api/modules/banban/alerts/notifications` - Histórico de notificações
- `GET /api/modules/banban/alerts/health` - Status do módulo

## 🔧 Dependências
- `@supabase/supabase-js`: Cliente para banco de dados
- `zod`: Validação de schemas
- `date-fns`: Manipulação de datas
- `nodemailer`: Envio de emails (opcional)

## 📈 Changelog
### v1.0.0 (2024-12-27)
- Implementação inicial do sistema de alertas
- Integração com ERP BanBan via webhooks
- Processamento em batch com thresholds configuráveis
- Sistema de notificações multi-canal
- Processor dedicado para lógica de negócio

## 🛠️ Desenvolvimento
### Estrutura de Arquivos
```
alerts/
├── README.md              # Este arquivo
├── index.ts               # Configuração principal
├── processor.ts           # Lógica de processamento
└── module.config.ts       # Configuração padronizada
```

### Executar Testes
```bash
npm test -- alerts
```

### Logs de Debug
```bash
# Habilitar logs detalhados
DEBUG=banban-alerts npm start
```

## 📞 Suporte
Para suporte técnico ou dúvidas sobre o módulo de alertas BanBan, entre em contato com a equipe de desenvolvimento Axon. 