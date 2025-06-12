import { Metadata } from 'next';
import { getCachedUserProps } from "@/lib/auth/getUserData";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ForecastWidget } from "@/app/ui/dashboard/forecast-widget";
import { ABCAnalysisWidget } from "@/app/ui/dashboard/abc-analysis-widget";
import { CoverageWidget } from "@/app/ui/dashboard/coverage-widget";
import { SupplierScorecardWidget } from "@/app/ui/dashboard/supplier-scorecard-widget";
import { LeadTimeChartWidget } from "@/app/ui/dashboard/lead-time-chart-widget";
import { FillRateMetricsWidget } from "@/app/ui/dashboard/fill-rate-metrics-widget";
import { getSupplierMetrics } from "@/app/query/suppliers";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Performance',
  description: 'Painel de performance com métricas e KPIs do negócio.',
};

// Dados mock para fallback
const MOCK_METRICS = {
  sales: 125000,
  margin: 38,
  cover_days: 32,
  sell_through: 64
};

// Dados mock para módulos analíticos avançados
const generateForecastData = () => {
  const products = [
    { id: '1', sku: 'TEN-001-BLK-42', name: 'Tênis Running Elite', base_sales: 5, accuracy: 0.85 },
    { id: '2', sku: 'CAM-002-WHT-M', name: 'Camisa Polo Clássica', base_sales: 3, accuracy: 0.78 },
    { id: '3', sku: 'JEA-003-BLU-38', name: 'Jeans Skinny Premium', base_sales: 2, accuracy: 0.82 }
  ];

  const horizons = [7, 14, 30];
  const forecastData = [];

  for (const product of products) {
    for (const horizon of horizons) {
      for (let day = 1; day <= horizon; day++) {
        // Simular variação nas vendas ao longo dos dias
        const variation = 0.8 + (Math.sin(day * 0.5) * 0.4);
        const predicted_sales = Math.round(product.base_sales * variation * (1 + Math.random() * 0.3));
        
        forecastData.push({
          variant_id: product.id,
          sku: product.sku,
          product_name: product.name,
          forecast_horizon_days: horizon,
          predicted_sales: predicted_sales,
          confidence_interval_low: Math.round(predicted_sales * 0.8),
          confidence_interval_high: Math.round(predicted_sales * 1.2),
          model_accuracy: product.accuracy,
          forecast_date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }

  return forecastData;
};

const MOCK_FORECAST_DATA = generateForecastData();

const MOCK_COVERAGE_DATA = [
  {
    variant_id: '1',
    location_id: '1',
    current_stock: 25,
    avg_daily_sales: 3.2,
    projected_days_coverage: 7.8,
    risk_level: 'high' as const,
    core_product_variants: {
      sku: 'TEN-001-BLK-42',
      color: 'Preto',
      core_products: { product_name: 'Tênis Running Elite' }
    },
    core_locations: { location_name: 'Loja Shopping Center' }
  },
  {
    variant_id: '2',
    location_id: '2',
    current_stock: 45,
    avg_daily_sales: 2.1,
    projected_days_coverage: 21.4,
    risk_level: 'low' as const,
    core_product_variants: {
      sku: 'CAM-002-WHT-M',
      color: 'Branco',
      core_products: { product_name: 'Camisa Polo Clássica' }
    },
    core_locations: { location_name: 'Loja Centro' }
  }
];

const MOCK_ABC_DATA = [
  {
    variant_id: '1',
    abc_classification: 'A',
    abc_category: 'A' as const,
    revenue_contribution: 45000,
    stock_value: 12000,
    cumulative_revenue_percentage: 15.2,
    turnover_rate: 8.5,
    days_of_inventory: 43,
    priority_score: 92.5,
    core_product_variants: {
      sku: 'TEN-001-BLK-42',
      core_products: { product_name: 'Tênis Running Elite' }
    },
    analysis_date: new Date().toISOString().split('T')[0]
  },
  {
    variant_id: '2',
    abc_classification: 'B',
    abc_category: 'B' as const,
    revenue_contribution: 25000,
    stock_value: 8000,
    cumulative_revenue_percentage: 36.6,
    turnover_rate: 4.8,
    days_of_inventory: 76,
    priority_score: 72.1,
    core_product_variants: {
      sku: 'JEA-003-BLU-38',
      core_products: { product_name: 'Jeans Skinny Premium' }
    },
    analysis_date: new Date().toISOString().split('T')[0]
  }
];

const MOCK_SUPPLIER_DATA = [
  {
    id: '1',
    supplier_id: 'SUPP-001',
    analysis_period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    analysis_period_end: new Date().toISOString(),
    total_orders: 45,
    avg_lead_time_days: 12.5,
    sla_lead_time_days: 15,
    lead_time_variance: 2.3,
    fill_rate_percentage: 94.2,
    divergence_rate_percentage: 5.8,
    on_time_delivery_rate: 89.5,
    quality_score: 92.0,
    performance_score: 91.2,
    trade_name: 'Fornecedor Alpha',
    legal_name: 'Alpha Indústria Têxtil Ltda'
  }
];

export default async function PerformancePage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);
  const userProps = await getCachedUserProps();
  const userId = userProps?.id;
  const organizationId = userProps?.user_metadata?.organization_id;

  // Fetch de dados com fallback para mock
  let metrics = MOCK_METRICS;
  let supplierData = MOCK_SUPPLIER_DATA;
  let forecastData = MOCK_FORECAST_DATA;
  let coverageData = MOCK_COVERAGE_DATA;
  let abcData = MOCK_ABC_DATA;

  try {
    if (userId && organizationId) {
      // Tentar buscar métricas reais
      const metricsResponse = await supabase
        .from('business_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (metricsResponse.data) {
        metrics = metricsResponse.data;
      }

             // Tentar buscar dados de fornecedores
       try {
         const suppliersResult = await getSupplierMetrics();
         if (suppliersResult && suppliersResult.length > 0) {
           supplierData = suppliersResult as any;
         }
       } catch (error) {
         console.warn('Usando dados mock para fornecedores:', error);
       }
    }
  } catch (error) {
    console.warn('Usando dados mock para métricas:', error);
  }

  return (
    <PageErrorBoundary>
      {/* Header */}
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Performance</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" />
              Período
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </header>
      
      <div className="p-6 space-y-6">
        {/* Grid de KPIs */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total de Vendas */}
            <Card>
              <CardHeader className="relative">
                <CardDescription>Total de Vendas</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {metrics.sales > 1000 ? `R$ ${(metrics.sales / 1000).toFixed(0)}k` : `R$ ${metrics.sales.toFixed(2)}`}
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    <TrendingUp className="size-3" />
                    +18%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Crescimento este mês <TrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Performance acima do esperado
                </div>
              </CardFooter>
            </Card>

            {/* Margem */}
            <Card>
              <CardHeader className="relative">
                <CardDescription>Margem</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {metrics.margin.toFixed(1)}%
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    <TrendingUp className="size-3" />
                    +2.3%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Margem saudável <TrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Dentro da meta estabelecida
                </div>
              </CardFooter>
            </Card>

            {/* Dias de Cobertura */}
            <Card>
              <CardHeader className="relative">
                <CardDescription>Dias de Cobertura</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {metrics.cover_days.toFixed(1)}
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    <TrendingDown className="size-3" />
                    -3
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Estoque otimizado <TrendingDown className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Giro mais rápido que o período anterior
                </div>
              </CardFooter>
            </Card>

            {/* Sell-through */}
            <Card>
              <CardHeader className="relative">
                <CardDescription>Sell-through</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {metrics.sell_through.toFixed(1)}%
                </CardTitle>
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    <TrendingUp className="size-3" />
                    +5.2%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Vendas em alta <TrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Taxa de conversão acima da média
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Módulos Analíticos Avançados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Módulos Analíticos Avançados</h3>
              <p className="text-sm text-muted-foreground">
                Insights preditivos e análises avançadas para tomada de decisão
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ForecastWidget forecastData={forecastData} />
            <CoverageWidget coverageData={coverageData} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ABCAnalysisWidget abcData={abcData} />
          </div>
        </div>

        {/* Logística e Fornecedores */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Logística e Fornecedores</h3>
              <p className="text-sm text-muted-foreground">
                Performance de fornecedores, lead times e métricas operacionais
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <SupplierScorecardWidget supplierData={supplierData} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <LeadTimeChartWidget supplierData={supplierData} />
            <FillRateMetricsWidget supplierData={supplierData} />
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
