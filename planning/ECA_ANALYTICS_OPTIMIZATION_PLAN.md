# Plano de Otimização ECA Analytics & Rastreabilidade

**Data:** 2025-07-23  
**Versão:** 1.0  
**Autor:** Claude Code Analysis  

## 📋 Sumário Executivo

Após análise completa dos fluxos ECA e estrutura de dados, o sistema demonstra **excelente rastreabilidade** (10/10) e **alta qualidade de dados** (9/10). Este plano apresenta otimizações para maximizar o potencial analítico da plataforma.

---

## 🎯 Objetivos

1. **Performance:** Reduzir tempo de queries analíticas em 70%
2. **Usabilidade:** Facilitar extração de insights via views especializadas
3. **Escalabilidade:** Preparar sistema para volume 10x maior
4. **Analytics:** Habilitar dashboards em tempo real e ML

---

## 📊 Estado Atual - Benchmark

### ✅ Pontos Fortes Identificados
- **Event Sourcing Completo:** Cada transação preserva histórico de estados
- **Relacionamentos Automáticos:** Sistema conecta transações relacionadas (1-5 conexões por transação)
- **Dados Ricos:** JSON com atributos detalhados (produtos, preços, localizações, timestamps)
- **Performance Atual:** ~450ms por operação, 8-150s entre eventos do fluxo
- **Cobertura:** 100% dos fluxos com auditoria completa

### ⚠️ Áreas de Melhoria
- **Queries Analíticas:** Sem índices especializados para agregações
- **Views Complexas:** Queries repetitivas para análises comuns
- **Particionamento:** Tabelas únicas crescendo indefinidamente
- **Cache:** Sem camada de cache para métricas frequentes

---

## 🚀 Fase 1: Otimização de Performance (Semana 1-2)

### 1.1 Índices Especializados

```sql
-- Performance para queries analíticas por organização + tipo + período
CREATE INDEX CONCURRENTLY idx_transactions_analytics 
ON tenant_business_transactions(organization_id, transaction_type, created_at DESC)
INCLUDE (status, attributes);

-- Busca rápida por external_id (debugging e integrações)
CREATE INDEX CONCURRENTLY idx_transactions_external_id 
ON tenant_business_transactions(external_id) 
WHERE external_id IS NOT NULL;

-- Análise de relacionamentos por tipo
CREATE INDEX CONCURRENTLY idx_relationships_type_org 
ON tenant_business_relationships(organization_id, relationship_type, created_at DESC);

-- Query por produtos específicos via JSON
CREATE INDEX CONCURRENTLY idx_transactions_product_json 
ON tenant_business_transactions USING GIN ((attributes->'items'));

-- Performance para queries de status
CREATE INDEX CONCURRENTLY idx_transactions_status_time 
ON tenant_business_transactions(organization_id, status, created_at DESC)
WHERE deleted_at IS NULL;
```

**Impacto Esperado:** Redução de 60-80% no tempo de queries analíticas

### 1.2 Particionamento por Data

```sql
-- Particionar tabela principal por mês
CREATE TABLE tenant_business_transactions_y2025m07 
PARTITION OF tenant_business_transactions
FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

-- Automatizar criação de partições futuras
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    table_name text;
BEGIN
    -- Lógica para criar partições dos próximos 3 meses
END;
$$ LANGUAGE plpgsql;
```

**Impacto Esperado:** Queries históricas 70% mais rápidas

---

## 📈 Fase 2: Views Materializadas para Analytics (Semana 3-4)

### 2.1 Product Flow Analytics

```sql
-- Rastreabilidade completa por produto
CREATE MATERIALIZED VIEW mv_product_flow_analysis AS
WITH product_journey AS (
    SELECT 
        jsonb_array_elements(t.attributes->'items')->>'product_external_id' as product_id,
        t.organization_id,
        t.transaction_type,
        t.status,
        t.created_at,
        t.external_id,
        jsonb_extract_path_text(t.attributes, 'location_external_id') as location,
        (jsonb_array_elements(t.attributes->'items')->>'quantity')::integer as quantity
    FROM tenant_business_transactions t
    WHERE t.attributes ? 'items'
      AND jsonb_array_length(t.attributes->'items') > 0
)
SELECT 
    product_id,
    organization_id,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT location) as locations_count,
    SUM(CASE WHEN transaction_type = 'DOCUMENT_SALE' THEN quantity ELSE 0 END) as total_sold,
    SUM(CASE WHEN transaction_type = 'DOCUMENT_RETURN' THEN quantity ELSE 0 END) as total_returned,
    ROUND(
        (SUM(CASE WHEN transaction_type = 'DOCUMENT_RETURN' THEN quantity ELSE 0 END)::numeric / 
         NULLIF(SUM(CASE WHEN transaction_type = 'DOCUMENT_SALE' THEN quantity ELSE 0 END), 0)) * 100, 2
    ) as return_rate_percent,
    MIN(created_at) as first_movement,
    MAX(created_at) as last_movement
FROM product_journey
GROUP BY product_id, organization_id;

-- Refresh automático a cada hora
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_flow_analysis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_location_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_flow_timing_metrics;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT refresh_analytics_views();');
```

### 2.2 Location Performance Analytics

```sql
-- Performance por localização
CREATE MATERIALIZED VIEW mv_location_performance AS
SELECT 
    organization_id,
    COALESCE(
        jsonb_extract_path_text(attributes, 'location_external_id'),
        jsonb_extract_path_text(attributes, 'origin_location_external_id'),
        jsonb_extract_path_text(attributes, 'destination_location_external_id')
    ) as location_id,
    transaction_type,
    COUNT(*) as transaction_count,
    AVG(EXTRACT(EPOCH FROM (
        LEAD(created_at) OVER (PARTITION BY organization_id ORDER BY created_at) - created_at
    ))) as avg_processing_time_seconds,
    COUNT(CASE WHEN status LIKE '%DIVERGENCIA%' THEN 1 END) as divergence_count,
    ROUND(
        COUNT(CASE WHEN status LIKE '%DIVERGENCIA%' THEN 1 END)::numeric / COUNT(*) * 100, 2
    ) as divergence_rate_percent
FROM tenant_business_transactions
WHERE deleted_at IS NULL
  AND (
    jsonb_extract_path_text(attributes, 'location_external_id') IS NOT NULL OR
    jsonb_extract_path_text(attributes, 'origin_location_external_id') IS NOT NULL OR
    jsonb_extract_path_text(attributes, 'destination_location_external_id') IS NOT NULL
  )
GROUP BY organization_id, location_id, transaction_type;
```

### 2.3 Flow Timing Metrics

```sql
-- Métricas de timing dos fluxos
CREATE MATERIALIZED VIEW mv_flow_timing_metrics AS
WITH flow_steps AS (
    SELECT 
        organization_id,
        external_id,
        transaction_type,
        status,
        created_at,
        LAG(created_at) OVER (
            PARTITION BY organization_id, 
            CASE 
                WHEN external_id LIKE 'PS-%' THEN 'PURCHASE'
                WHEN external_id LIKE 'PT-%' THEN 'TRANSFER'  
                WHEN external_id LIKE 'VENDA-%' THEN 'SALE'
                WHEN external_id LIKE 'DEV-%' THEN 'RETURN'
                ELSE 'OTHER'
            END
            ORDER BY created_at
        ) as prev_step_time,
        -- Extrair tempos internos de processamento
        CASE 
            WHEN jsonb_extract_path_text(attributes, 'separacao_iniciada_em') IS NOT NULL
                 AND jsonb_extract_path_text(attributes, 'separacao_finalizada_em') IS NOT NULL
            THEN EXTRACT(EPOCH FROM (
                jsonb_extract_path_text(attributes, 'separacao_finalizada_em')::timestamptz - 
                jsonb_extract_path_text(attributes, 'separacao_iniciada_em')::timestamptz
            ))
            ELSE NULL
        END as separation_duration_seconds
    FROM tenant_business_transactions
    WHERE external_id IS NOT NULL
      AND deleted_at IS NULL
)
SELECT 
    organization_id,
    CASE 
        WHEN external_id LIKE 'PS-%' THEN 'PURCHASE_FLOW'
        WHEN external_id LIKE 'PT-%' THEN 'TRANSFER_FLOW'
        WHEN external_id LIKE 'VENDA-%' THEN 'SALES_FLOW'
        WHEN external_id LIKE 'DEV-%' THEN 'RETURN_FLOW'
        ELSE 'OTHER'
    END as flow_type,
    COUNT(*) as total_steps,
    AVG(EXTRACT(EPOCH FROM (created_at - prev_step_time))) as avg_step_duration_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (created_at - prev_step_time))) as median_step_duration_seconds,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (created_at - prev_step_time))) as p95_step_duration_seconds,
    AVG(separation_duration_seconds) as avg_separation_duration_seconds
FROM flow_steps
WHERE prev_step_time IS NOT NULL
GROUP BY organization_id, flow_type;
```

**Impacto Esperado:** Queries de dashboard de 5-10s para 100-300ms

---

## 🔧 Fase 3: APIs de Analytics Especializadas (Semana 5-6)

### 3.1 Endpoint de Rastreabilidade de Produto

```typescript
// /api/analytics/product-traceability/:productId
interface ProductTraceabilityResponse {
  product_id: string;
  organization_id: string;
  complete_journey: {
    purchase: TransactionSummary[];
    transfers: TransactionSummary[];
    sales: TransactionSummary[];
    returns: TransactionSummary[];
  };
  current_locations: {
    location_id: string;
    quantity: number;
    last_movement: string;
  }[];
  metrics: {
    total_purchased: number;
    total_sold: number;
    total_returned: number;
    return_rate: number;
    avg_time_in_inventory: number;
  };
  timeline: TimelineEvent[];
}
```

### 3.2 Dashboard de Performance Operacional

```typescript
// /api/analytics/operational-dashboard
interface OperationalDashboard {
  organization_id: string;
  period: { from: string; to: string };
  flows_performance: {
    purchase: FlowMetrics;
    transfer: FlowMetrics;
    sales: FlowMetrics;
    returns: FlowMetrics;
  };
  locations_ranking: LocationPerformance[];
  bottlenecks: BottleneckAnalysis[];
  trends: {
    daily_transactions: DailyMetric[];
    divergence_trends: TrendData[];
    processing_time_trends: TrendData[];
  };
}
```

### 3.3 API de Machine Learning Features

```typescript
// /api/analytics/ml-features/:organizationId
interface MLFeatures {
  demand_patterns: {
    product_id: string;
    seasonal_index: number;
    trend_direction: 'up' | 'down' | 'stable';
    volatility_score: number;
  }[];
  return_prediction: {
    product_id: string;
    predicted_return_rate: number;
    confidence: number;
    key_factors: string[];
  }[];
  inventory_optimization: {
    location_id: string;
    recommended_stock_levels: Record<string, number>;
    reorder_points: Record<string, number>;
  }[];
}
```

---

## 🏗️ Fase 4: Infrastructure & Cache Layer (Semana 7-8)

### 4.1 Redis Cache para Métricas Frequentes

```typescript
// Cache Strategy
const cacheConfig = {
  // Métricas em tempo real - 5 min
  'realtime_metrics': { ttl: 300 },
  
  // Dashboards principais - 15 min  
  'dashboard_data': { ttl: 900 },
  
  // Análises históricas - 1 hora
  'historical_analysis': { ttl: 3600 },
  
  // Rastreabilidade de produto - 30 min
  'product_traceability': { ttl: 1800 }
};

class AnalyticsCache {
  async getCachedOrCompute<T>(
    key: string, 
    computeFn: () => Promise<T>,
    category: keyof typeof cacheConfig
  ): Promise<T> {
    // Implementação com Redis
  }
}
```

### 4.2 Background Jobs para Pre-computation

```typescript
// Cron jobs para pré-calcular métricas pesadas
const analyticsJobs = [
  {
    name: 'refresh-materialized-views',
    schedule: '0 * * * *', // A cada hora
    task: () => refreshMaterializedViews()
  },
  {
    name: 'compute-daily-aggregates', 
    schedule: '0 1 * * *', // Diário às 01:00
    task: () => computeDailyAggregates()
  },
  {
    name: 'ml-feature-extraction',
    schedule: '0 2 * * *', // Diário às 02:00  
    task: () => extractMLFeatures()
  }
];
```

---

## 📊 Fase 5: Dashboards & Visualizações (Semana 9-10)

### 5.1 Real-time Operations Dashboard

**Componentes:**
- **Flow Status Board:** Estado atual de todos os fluxos ativos
- **Performance Metrics:** Tempo médio por operação, gargalos
- **Divergence Monitor:** Taxa de divergências por localização
- **Volume Indicators:** Transações por hora/dia

### 5.2 Executive Analytics Dashboard

**Componentes:**
- **KPI Summary:** Métricas principais do período
- **Trend Analysis:** Evolução temporal de vendas, devoluções, transferências
- **Location Comparison:** Performance comparativa entre localizações
- **Product Insights:** Top produtos, análise de giro, taxa de devolução

### 5.3 Operational Intelligence

**Componentes:**
- **Predictive Alerts:** Baseado em ML para prever problemas
- **Process Optimization:** Sugestões de melhoria baseadas em dados
- **Capacity Planning:** Análise de capacidade por localização
- **Quality Monitoring:** Tracking de qualidade dos processos

---

## 🎯 Métricas de Sucesso

### Performance
- [ ] Redução de 70% no tempo de queries analíticas
- [ ] APIs de dashboard respondendo em <300ms 
- [ ] Suporte a 10x o volume atual sem degradação

### Usabilidade  
- [ ] Dashboards atualizando em tempo real
- [ ] Rastreabilidade completa de produto em <1s
- [ ] APIs self-service para equipes de análise

### Business Impact
- [ ] Time-to-insight reduzido de horas para minutos
- [ ] Detecção proativa de problemas operacionais
- [ ] Otimização de inventário baseada em dados

---

## 📅 Cronograma de Implementação

| Fase | Duração | Início | Entregáveis |
|------|---------|--------|-------------|
| **Fase 1** | 2 semanas | Semana 1 | Índices + Particionamento |
| **Fase 2** | 2 semanas | Semana 3 | Views Materializadas |
| **Fase 3** | 2 semanas | Semana 5 | APIs Especializadas |
| **Fase 4** | 2 semanas | Semana 7 | Cache + Jobs |
| **Fase 5** | 2 semanas | Semana 9 | Dashboards |

**Total:** 10 semanas para implementação completa

---

## 💰 Estimativa de Recursos

### Desenvolvimento
- **Backend (Database + APIs):** 40 horas
- **Cache + Infrastructure:** 24 horas  
- **Dashboards + Frontend:** 32 horas
- **Testes + Deploy:** 16 horas

**Total:** ~112 horas de desenvolvimento

### Infrastructure
- **Redis Cache:** ~$50/mês
- **Monitoring Tools:** ~$30/mês
- **Additional DB Resources:** ~$100/mês

**Total:** ~$180/mês em custos adicionais

---

## 🔧 Considerações Técnicas

### Compatibilidade
- ✅ Zero breaking changes nas APIs existentes
- ✅ Implementação incremental possível
- ✅ Rollback strategy para cada fase

### Monitoring
- Métricas de performance de cada view materializada
- Alertas para queries lentas (>1s)
- Monitoring de cache hit rates
- Tracking de uso das APIs analytics

### Security
- Rate limiting nas APIs analytics (100 req/min por org)
- Audit log para acessos a dados sensíveis
- Row-level security mantida em todas as views

---

## 📋 Próximos Passos

1. **Aprovação do Plano:** Review com stakeholders
2. **Proof of Concept:** Implementar Fase 1 em ambiente de teste
3. **Benchmark Testing:** Validar ganhos de performance
4. **Rollout Gradual:** Deploy por organização (canary release)
5. **Monitoring & Iteration:** Ajustes baseados em uso real

---

**📞 Contato para Dúvidas:**
- Documentação técnica: `/docs/analytics/`
- Issues: GitHub Issues com tag `analytics-optimization`

**🎯 Objetivo Final:** Transformar o sistema ECA em uma plataforma de **Business Intelligence em tempo real** com capacidades preditivas e otimização automatizada.