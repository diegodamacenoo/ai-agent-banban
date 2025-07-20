# 🎯 Exemplo Prático de Uso dos Templates - Sistema Axon

**Versão:** 2.0.0  
**Data:** 02/01/2025  
**Tipo:** Guia prático com exemplos reais

Este documento demonstra como usar os templates atualizados para criar módulos no sistema Axon, com exemplos práticos e casos de uso reais.

---

## 🚀 Exemplo 1: Módulo Standard (Analytics Avançado)

### **Cenário**
Criar um módulo de analytics avançado que seja disponível para todos os clientes do sistema.

### **Comando de Geração**

```powershell
# Windows PowerShell
.\scripts\generate-module.ps1 -ModuleSlug "advanced-analytics" -ModuleType "standard" -Category "analytics" -Author "Axon Team"

# Ou Linux/macOS Bash
./scripts/generate-module.sh "advanced-analytics" "standard" "analytics" "Axon Team"
```

### **Resultado Esperado**

```
🚀 Axon Module Generator v2.0.0
==================================

📋 Configuração do Módulo:
   Nome: Advanced Analytics
   Slug: advanced-analytics
   Classe: AdvancedAnalytics
   Tipo: standard
   Categoria: analytics
   Autor: Axon Team
   Localização: src/core/modules/standard/advanced-analytics
   Pricing: free

✅ Módulo Advanced Analytics gerado com sucesso!
```

### **Estrutura Criada**

```
src/core/modules/standard/advanced-analytics/
├── module.json                     # Manifesto configurado
├── README.md                       # Documentação inicial
├── package.json                    # Dependencies configuradas
├── tsconfig.json                   # TypeScript config
├── jest.config.js                  # Jest para testes
├── .env.example                    # Variáveis de ambiente
├── types/
│   └── index.ts                   # Tipos e schemas Zod
├── services/
│   └── AdvancedAnalyticsService.ts # Serviço principal
├── handlers/
│   └── index.ts                   # API handlers
├── components/
│   ├── AdvancedAnalyticsWidget.tsx # Widget dashboard
│   └── AdvancedAnalyticsConfig.tsx # Painel configuração
├── utils/
│   └── index.ts                   # Utilitários
├── tests/
│   └── unit/                      # Testes unitários
├── migrations/
│   └── 20250102000000_initial_advanced_analytics.sql
└── docs/
    ├── API.md
    ├── SETUP.md
    └── EXAMPLES.md
```

### **Próximos Passos**

1. **Instalar dependências:**
```bash
cd src/core/modules/standard/advanced-analytics
npm install
```

2. **Implementar lógica específica em `services/AdvancedAnalyticsService.ts`:**
```typescript
// Adicionar métodos específicos de analytics
async getInsights(organizationId: string): Promise<AdvancedAnalyticsResponse<Insight[]>> {
  // Implementar lógica de insights com IA
}

async generateReport(filters: ReportFilters): Promise<AdvancedAnalyticsResponse<Report>> {
  // Implementar geração de relatórios
}
```

3. **Customizar tipos em `types/index.ts`:**
```typescript
export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'forecast';
  title: string;
  description: string;
  confidence: number;
  data: Record<string, unknown>;
}

export interface ReportFilters {
  dateRange: { start: Date; end: Date };
  metrics: string[];
  groupBy?: string;
}
```

4. **Escrever testes:**
```bash
npm test -- --coverage
```

---

## 🏢 Exemplo 2: Módulo Custom (BanBan Fashion Insights)

### **Cenário**
Criar um módulo específico para o cliente BanBan com insights de moda e analytics customizados.

### **Comando de Geração**

```powershell
# Windows PowerShell
.\scripts\generate-module.ps1 -ModuleSlug "fashion-insights" -ModuleType "custom" -Category "insights" -Author "BanBan Team" -ClientSlug "banban"

# Ou Linux/macOS Bash  
./scripts/generate-module.sh "fashion-insights" "custom" "insights" "BanBan Team" "banban"
```

### **Resultado Esperado**

```
🚀 Axon Module Generator v2.0.0
==================================

📋 Configuração do Módulo:
   Nome: Fashion Insights
   Slug: fashion-insights
   Classe: FashionInsights
   Tipo: custom
   Categoria: insights
   Autor: BanBan Team
   Localização: src/core/modules/banban/fashion-insights
   Pricing: premium
   Cliente: banban
   Organização: banban Organization

✅ Módulo Fashion Insights gerado com sucesso!
```

### **Diferenças do Módulo Custom**

#### **1. module.json - Configuração Premium**
```json
{
  "name": "Fashion Insights",
  "slug": "fashion-insights",
  "category": "custom",
  "pricing_tier": "premium",
  "author": "BanBan Team",
  "vendor": "banban Organization",
  "supported_client_types": ["banban"],
  "usage_based_pricing": {
    "enabled": true,
    "per_call": 0.001,
    "per_token": 0.0001,
    "per_gb": 0.10,
    "minimum_monthly": 50.00
  },
  "ml_features": {
    "enabled": true,
    "models": [
      {
        "name": "trend_analysis",
        "type": "forecasting",
        "endpoint": "/ml/trend-analysis"
      }
    ]
  }
}
```

#### **2. Tabelas com Prefix do Cliente**
```sql
-- banban_fashion_insights_data
-- banban_fashion_insights_config  
-- banban_fashion_insights_metrics
```

#### **3. Funcionalidades Avançadas**
```typescript
// types/index.ts - Tipos específicos do BanBan
export interface FashionTrend {
  id: string;
  category: 'clothing' | 'accessories' | 'shoes';
  seasonality: 'spring' | 'summer' | 'fall' | 'winter';
  popularity: number;
  priceRange: { min: number; max: number };
  colors: string[];
  materials: string[];
  aiPredictions: {
    nextSeasonDemand: number;
    suggestedStockLevel: number;
    competitorAnalysis: Record<string, unknown>;
  };
}

// services/FashionInsightsService.ts - Métodos avançados
async analyzeFashionTrends(filters: TrendFilters): Promise<FashionInsightsResponse<FashionTrend[]>> {
  // IA para análise de tendências de moda
}

async predictSeasonalDemand(category: string): Promise<FashionInsightsResponse<SeasonalPrediction>> {
  // Machine learning para previsão de demanda
}

async competitorAnalysis(brandId: string): Promise<FashionInsightsResponse<CompetitorReport>> {
  // Análise de concorrência
}
```

---

## 🧪 Exemplo 3: Testando o Módulo Criado

### **1. Executar Testes Unitários**

```bash
cd src/core/modules/standard/advanced-analytics
npm test

# Com coverage
npm run test:coverage

# Expected output:
# ✅ AdvancedAnalyticsService.test.ts
# ✅ healthCheck should return healthy status
# ✅ initialize should setup correctly  
# ✅ processData should validate input
# 
# Coverage: 85% (target: ≥70%)
```

### **2. Testar Health Check**

```bash
# Via API
curl -X GET http://localhost:3000/api/modules/advanced-analytics/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "details": {
      "moduleEnabled": true,
      "databaseConnection": true,
      "version": "1.0.0"
    }
  },
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

### **3. Testar Integration com Supabase**

```typescript
// tests/integration/supabase.test.ts
import { createSupabaseServerClient } from '@/core/supabase/server';
import AdvancedAnalyticsService from '../../services/AdvancedAnalyticsService';

describe('Supabase Integration', () => {
  it('should connect to database and create tables', async () => {
    const supabase = createSupabaseServerClient();
    const service = new AdvancedAnalyticsService({
      organizationId: 'test-org',
      supabase
    });

    const result = await service.initialize();
    expect(result.success).toBe(true);

    // Verificar tabelas criadas
    const { data } = await supabase
      .from('advanced_analytics_data')
      .select('count(*)');
    
    expect(data).toBeDefined();
  });
});
```

---

## 🚀 Exemplo 4: Deploy e Produção

### **1. Aplicar Migrações**

```sql
-- Execute no Supabase SQL Editor
-- File: migrations/20250102000000_initial_advanced_analytics.sql

-- Verificar se migração foi aplicada
SELECT * FROM migrations_log 
WHERE name = '20250102000000_initial_advanced_analytics';
```

### **2. Registrar Módulo no Sistema**

```typescript
// src/core/registry/modules.ts
import { AdvancedAnalyticsService } from '../modules/standard/advanced-analytics';

export const moduleRegistry = {
  'advanced-analytics': {
    service: AdvancedAnalyticsService,
    type: 'standard',
    enabled: true,
    healthCheckInterval: 300000 // 5 minutos
  }
};
```

### **3. Configurar Rotas API**

```typescript
// src/pages/api/modules/advanced-analytics/[...params].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AdvancedAnalyticsService } from '@/core/modules/standard/advanced-analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { params } = req.query;
  const [action] = params as string[];

  const service = new AdvancedAnalyticsService({
    organizationId: req.headers['x-organization-id'] as string
  });

  switch (action) {
    case 'health':
      const health = await service.healthCheck();
      return res.json(health);
      
    case 'data':
      if (req.method === 'GET') {
        // Implementar GET data
      }
      break;
      
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}
```

### **4. Validar em Produção**

```bash
# Health check
curl https://app.axon.dev/api/modules/advanced-analytics/health

# Monitoramento
curl https://app.axon.dev/api/modules/advanced-analytics/metrics

# Logs
tail -f /var/log/axon/modules/advanced-analytics.log
```

---

## 📊 Exemplo 5: Monitoramento e Métricas

### **1. Configurar Alertas**

```typescript
// utils/monitoring.ts
export const setupModuleMonitoring = (moduleSlug: string) => {
  // Configurar Prometheus metrics
  const moduleHealthGauge = new Gauge({
    name: `axon_module_health_${moduleSlug}`,
    help: `Health status for module ${moduleSlug}`
  });

  // Configurar alertas
  const alerts = {
    healthCheckFail: {
      condition: 'health_status != 1',
      severity: 'critical',
      message: `Module ${moduleSlug} health check failed`
    },
    highErrorRate: {
      condition: 'error_rate > 5%',
      severity: 'warning', 
      message: `Module ${moduleSlug} has high error rate`
    }
  };

  return { metrics: moduleHealthGauge, alerts };
};
```

### **2. Dashboard Custom (BanBan)**

```typescript
// components/FashionInsightsDashboard.tsx
export function FashionInsightsDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trends Analysis */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tendências de Moda</CardTitle>
        </CardHeader>
        <CardContent>
          <FashionTrendsChart />
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights IA</CardTitle>
        </CardHeader>
        <CardContent>
          <AIInsightsList />
        </CardContent>
      </Card>

      {/* Seasonal Predictions */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Previsões Sazonais</CardTitle>
        </CardHeader>
        <CardContent>
          <SeasonalPredictionsChart />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔧 Troubleshooting Comum

### **1. Erro de Dependências**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar versões
npm list @supabase/supabase-js zod
```

### **2. Erro de Conexão Supabase**
```typescript
// Verificar configuração
const supabase = createSupabaseServerClient();
const { error } = await supabase.from('organizations').select('*').limit(1);
if (error) {
  console.error('Supabase connection error:', error);
}
```

### **3. RLS Bloqueando Queries**
```sql
-- Verificar usuário atual
SELECT auth.uid();

-- Verificar organização do usuário
SELECT organization_id FROM profiles WHERE id = auth.uid();

-- Testar política manualmente
SELECT * FROM advanced_analytics_data 
WHERE organization_id = 'organization-id-here';
```

### **4. Testes Falhando**
```bash
# Executar apenas um teste
npm test -- --testNamePattern="healthCheck"

# Debug mode
npm test -- --verbose --detectOpenHandles

# Limpar cache de testes
npm test -- --clearCache
```

---

## 📋 Checklist Final

### **Antes do Deploy**
- [ ] Todos os testes passando (coverage ≥ 70%)
- [ ] Health check endpoint funcionando
- [ ] Migrações aplicadas no Supabase
- [ ] RLS policies testadas
- [ ] Documentação atualizada
- [ ] Variáveis de ambiente configuradas

### **Pós-Deploy**
- [ ] Health check em produção OK
- [ ] Métricas sendo coletadas
- [ ] Logs estruturados funcionando
- [ ] Alertas configurados
- [ ] Performance baseline estabelecida

### **Para Módulos Custom**
- [ ] Billing tracking configurado
- [ ] Usage metrics sendo coletadas  
- [ ] Cliente-specific features testadas
- [ ] Integração com APIs externas validada
- [ ] ML models deployados (se aplicável)

---

**Este exemplo prático demonstra como usar efetivamente os templates atualizados para criar módulos robustos e profissionais no sistema Axon, seguindo todas as melhores práticas identificadas na arquitetura atual.** 