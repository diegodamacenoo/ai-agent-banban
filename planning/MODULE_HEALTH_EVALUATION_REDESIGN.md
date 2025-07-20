# Redesign da Lógica de Avaliação de Saúde dos Módulos

**Data**: 2025-07-18  
**Autor**: Sistema de Planejamento  
**Versão**: 1.0

## 📋 Resumo Executivo

Este documento apresenta um redesign completo da lógica de avaliação de saúde dos módulos, evoluindo de um sistema simplista baseado em mapeamento direto de status para uma abordagem multidimensional e inteligente baseada em métricas objetivas.

## 🔍 Análise da Situação Atual

### Lógica Atual (Simplificada)

**Localização**: `TenantOperationalStatusService.ts:74-91`

```typescript
// Mapeamento direto: operational_status → health_status
case 'ENABLED':
case 'UP_TO_DATE':
  updateData.health_status = 'healthy';
  break;
case 'ERROR':
  updateData.health_status = 'critical';
  break;
case 'SUSPENDED':
  updateData.health_status = 'warning';
  break;
case 'DISABLED':
case 'ARCHIVED':
  updateData.health_status = 'unknown';
  break;
```

### ⚠️ Limitações Identificadas

1. **Mapeamento Simplista**
   - Relação 1:1 entre operational_status e health_status
   - Não considera métricas reais de performance
   - Não avalia dados de uso ou comportamento

2. **Falta de Contexto**
   - Não considera histórico de falhas
   - Não avalia tendências ou padrões
   - Não leva em conta dependências entre módulos

3. **Sem Métricas Objetivas**
   - Não há coleta de métricas de performance
   - Não monitora uptime ou disponibilidade
   - Não rastreia erros ou latência

4. **Granularidade Limitada**
   - Apenas 4 estados de saúde: healthy, warning, critical, unknown
   - Não diferencia tipos de problemas
   - Não oferece insights acionáveis

## 🎯 Proposta de Nova Lógica

### 1. Sistema de Múltiplas Dimensões

```typescript
interface ModuleHealthMetrics {
  // Dimensões de saúde
  operational_health: HealthScore;    // Status operacional
  performance_health: HealthScore;    // Métricas de performance
  reliability_health: HealthScore;    // Confiabilidade/uptime
  usage_health: HealthScore;          // Padrões de uso
  
  // Score agregado
  overall_health: HealthScore;
  health_trend: 'improving' | 'stable' | 'degrading';
  
  // Detalhes e contexto
  last_health_check: string;
  health_factors: HealthFactor[];
  recommendations: string[];
}

interface HealthScore {
  score: number;          // 0-100
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  confidence: number;     // 0-100
  last_updated: string;
}

interface HealthFactor {
  category: 'operational' | 'performance' | 'reliability' | 'usage';
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}
```

### 2. Métricas por Dimensão

#### A. Saúde Operacional (25% do score)

```typescript
const operationalFactors = {
  status_stability: {
    metric: 'Tempo no status atual',
    healthy: '> 7 dias stable',
    warning: '1-7 dias ou mudanças frequentes',
    critical: '< 1 dia ou loops de erro'
  },
  provisioning_success: {
    metric: 'Taxa de sucesso de provisioning',
    healthy: '95-100%',
    warning: '80-95%',
    critical: '< 80%'
  },
  retry_count: {
    metric: 'Tentativas de retry',
    healthy: '0-1 retries',
    warning: '2-5 retries',
    critical: '> 5 retries'
  }
};
```

#### B. Saúde de Performance (30% do score)

```typescript
const performanceFactors = {
  response_time: {
    metric: 'Tempo de resposta médio',
    healthy: '< 500ms',
    warning: '500ms-2s',
    critical: '> 2s'
  },
  throughput: {
    metric: 'Requisições por minuto',
    healthy: 'Dentro da baseline',
    warning: '20% abaixo da baseline',
    critical: '50% abaixo da baseline'
  },
  error_rate: {
    metric: 'Taxa de erro',
    healthy: '< 1%',
    warning: '1-5%',
    critical: '> 5%'
  }
};
```

#### C. Saúde de Confiabilidade (25% do score)

```typescript
const reliabilityFactors = {
  uptime: {
    metric: 'Uptime nos últimos 30 dias',
    healthy: '> 99.5%',
    warning: '99.0-99.5%',
    critical: '< 99.0%'
  },
  mtbf: {
    metric: 'Mean Time Between Failures',
    healthy: '> 30 dias',
    warning: '7-30 dias',
    critical: '< 7 dias'
  },
  recovery_time: {
    metric: 'Tempo médio de recuperação',
    healthy: '< 5 min',
    warning: '5-30 min',
    critical: '> 30 min'
  }
};
```

#### D. Saúde de Uso (20% do score)

```typescript
const usageFactors = {
  active_users: {
    metric: 'Usuários ativos',
    healthy: 'Crescimento ou estável',
    warning: 'Declínio leve (< 20%)',
    critical: 'Declínio significativo (> 20%)'
  },
  feature_adoption: {
    metric: 'Adoção de features',
    healthy: '> 60% features usadas',
    warning: '30-60% features usadas',
    critical: '< 30% features usadas'
  },
  user_satisfaction: {
    metric: 'Feedback dos usuários',
    healthy: 'Score > 4.0',
    warning: 'Score 3.0-4.0',
    critical: 'Score < 3.0'
  }
};
```

### 3. Algoritmo de Cálculo

```typescript
class ModuleHealthEvaluator {
  calculateOverallHealth(metrics: ModuleHealthMetrics): HealthScore {
    const weights = {
      operational_health: 0.25,
      performance_health: 0.30,
      reliability_health: 0.25,
      usage_health: 0.20
    };
    
    const weightedScore = 
      (metrics.operational_health.score * weights.operational_health) +
      (metrics.performance_health.score * weights.performance_health) +
      (metrics.reliability_health.score * weights.reliability_health) +
      (metrics.usage_health.score * weights.usage_health);
    
    const confidence = Math.min(
      metrics.operational_health.confidence,
      metrics.performance_health.confidence,
      metrics.reliability_health.confidence,
      metrics.usage_health.confidence
    );
    
    return {
      score: Math.round(weightedScore),
      status: this.scoreToStatus(weightedScore),
      confidence: Math.round(confidence),
      last_updated: new Date().toISOString()
    };
  }
  
  private scoreToStatus(score: number): HealthStatus {
    if (score >= 80) return 'healthy';
    if (score >= 60) return 'warning';
    if (score >= 0) return 'critical';
    return 'unknown';
  }
}
```

### 4. Coleta de Métricas

```typescript
interface MetricsCollector {
  // Métricas operacionais
  trackStatusChange(moduleId: string, from: string, to: string): void;
  trackProvisioningAttempt(moduleId: string, success: boolean): void;
  
  // Métricas de performance
  trackResponseTime(moduleId: string, endpoint: string, duration: number): void;
  trackThroughput(moduleId: string, requestCount: number): void;
  trackError(moduleId: string, errorType: string, details: any): void;
  
  // Métricas de confiabilidade
  trackUptime(moduleId: string, isUp: boolean): void;
  trackIncident(moduleId: string, incident: IncidentData): void;
  
  // Métricas de uso
  trackUserAction(moduleId: string, userId: string, action: string): void;
  trackFeatureUsage(moduleId: string, feature: string, usage: number): void;
}
```

## 🚀 Plano de Implementação

### Fase 1: Fundação (Semana 1-2)

#### 1.1 Estrutura de Dados
- **Objetivo**: Criar infraestrutura básica para métricas
- **Entregáveis**:
  - Tabelas: `module_health_metrics`, `module_health_history`
  - Tipos TypeScript expandidos
  - Service base para coleta de métricas
- **Complexidade**: Média
- **Dependências**: Nenhuma

#### 1.2 Coleta Básica
- **Objetivo**: Implementar tracking operacional
- **Entregáveis**:
  - Tracking operacional (extensão do existente)
  - Endpoints para métricas básicas
  - Jobs para cálculo periódico
- **Complexidade**: Baixa
- **Dependências**: 1.1

### Fase 2: Métricas Avançadas (Semana 3-4)

#### 2.1 Performance Monitoring
- **Objetivo**: Instrumentar APIs e tracking de performance
- **Entregáveis**:
  - Métricas de tempo de resposta
  - Tracking de throughput
  - Sistema de alertas automáticos
- **Complexidade**: Alta
- **Dependências**: 1.1, 1.2

#### 2.2 Reliability Tracking
- **Objetivo**: Implementar monitoramento de confiabilidade
- **Entregáveis**:
  - Health checks automáticos
  - Sistema de incident tracking
  - Métricas de uptime
- **Complexidade**: Alta
- **Dependências**: 1.1, 1.2

### Fase 3: Inteligência (Semana 5-6)

#### 3.1 Analytics e Tendências
- **Objetivo**: Implementar análise inteligente
- **Entregáveis**:
  - Análise de tendências
  - Sistema de recomendações
  - Dashboard de saúde
- **Complexidade**: Muito Alta
- **Dependências**: Todas anteriores

#### 3.2 Integração
- **Objetivo**: Integrar com sistemas existentes
- **Entregáveis**:
  - Integração com notificações
  - APIs para consumo externo
  - Exportação de dados
- **Complexidade**: Média
- **Dependências**: 3.1

## 📊 Estrutura de Dados Necessária

### Tabela: module_health_metrics

```sql
CREATE TABLE module_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  
  -- Scores por dimensão
  operational_score INTEGER CHECK (operational_score >= 0 AND operational_score <= 100),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
  usage_score INTEGER CHECK (usage_score >= 0 AND usage_score <= 100),
  
  -- Score agregado
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  health_status TEXT CHECK (health_status IN ('healthy', 'warning', 'critical', 'unknown')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Tendências
  health_trend TEXT CHECK (health_trend IN ('improving', 'stable', 'degrading')),
  
  -- Fatores de saúde
  health_factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  
  -- Metadados
  last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices e constraints
  CONSTRAINT fk_module_health_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT uk_module_health_org_module 
    UNIQUE (organization_id, module_id)
);
```

### Tabela: module_health_history

```sql
CREATE TABLE module_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  
  -- Snapshot das métricas
  snapshot_data JSONB NOT NULL,
  
  -- Metadados
  snapshot_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT fk_module_health_history_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Índices para performance
CREATE INDEX idx_module_health_history_org_module_time 
  ON module_health_history(organization_id, module_id, snapshot_timestamp);
```

## 🔄 Estratégia de Migração

### Migração Gradual
1. **Manter Sistema Atual**: Sistema existente como fallback
2. **Feature Flag**: Implementar feature flag para nova lógica
3. **Rollout Gradual**: Migrar gradualmente por módulo/tenant
4. **Monitoramento**: Comparar resultados entre sistemas
5. **Rollback**: Plano de rollback em caso de problemas

### Compatibilidade
- Manter APIs existentes funcionando
- Gradualmente deprecar endpoints antigos
- Documentar mudanças de comportamento
- Comunicar timeline de migração

## 🎯 Benefícios Esperados

### 1. Visibilidade Completa
- **Métricas objetivas** e mensuráveis
- **Histórico e tendências** de saúde
- **Insights acionáveis** para melhorias

### 2. Detecção Proativa
- **Identificação precoce** de problemas
- **Alertas automáticos** baseados em thresholds
- **Recomendações** de ações preventivas

### 3. Gestão Inteligente
- **Priorização** baseada em impacto
- **Otimização** de recursos
- **Tomada de decisão** data-driven

## 📈 Métricas de Sucesso

### KPIs Técnicos
- **Redução de 50%** no tempo de detecção de problemas
- **Melhoria de 30%** na precisão de alertas
- **Aumento de 40%** na confiança dos scores de saúde

### KPIs de Negócio
- **Redução de 25%** em incidents críticos
- **Melhoria de 35%** na satisfação dos usuários
- **Aumento de 20%** na adoção de módulos

## 🔧 Considerações Técnicas

### Performance
- Cálculos assíncronos para evitar impacto na UX
- Cache de métricas para consultas frequentes
- Agregação inteligente de dados históricos

### Escalabilidade
- Particionamento de dados por organização
- Arquivamento automático de dados antigos
- Otimização de queries para grandes volumes

### Segurança
- Controle de acesso baseado em organização
- Auditoria de acessos às métricas
- Anonimização de dados sensíveis

## 📋 Próximos Passos

1. **Revisão e Aprovação** deste plano
2. **Estimativa detalhada** de esforço por fase
3. **Definição da equipe** e responsabilidades
4. **Setup do ambiente** de desenvolvimento
5. **Início da Fase 1** - Estrutura de Dados

---

**Documento vivo**: Este plano será atualizado conforme o progresso da implementação e feedback da equipe.