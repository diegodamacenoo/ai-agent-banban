import { Metadata } from 'next';
import { getCachedUserProps } from "@/lib/auth/getUserData";
import { createSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Calendar,
  Download,
  RefreshCcw
} from 'lucide-react';
import { KPICardsSimple } from "@/components/home/kpi-summary/kpi-cards-simple";
import { InsightsFeed } from "@/components/home/insights-feed/insights-feed";
import { ChatWrapper } from "@/components/home/chat-interface/chat-wrapper";
import { InsightsProcessor } from "@/components/home/insights-feed/insights-processor";
import { HomePageClient } from "./components/home-page-client";

export const metadata: Metadata = {
  title: 'Home',
  description: 'Página inicial com insights personalizados e visão executiva.',
};

// Dados mock para fallback
const MOCK_METRICS = {
  sales: 125000,
  margin: 38000,
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
    core_product_variants: {
      sku: 'CAM-002-WHT-M',
      color: 'Branco',
      core_products: { product_name: 'Camisa Polo Clássica' }
    },
    core_locations: { location_name: 'Loja Centro' }
  },
  {
    variant_id: '3',
    location_id: '1',
    current_stock: 12,
    avg_daily_sales: 1.8,
    projected_days_coverage: 6.7,
    core_product_variants: {
      sku: 'JEA-003-BLU-38',
      color: 'Azul',
      core_products: { product_name: 'Jeans Skinny Premium' }
    },
    core_locations: { location_name: 'Loja Shopping Center' }
  }
];

const MOCK_ABC_DATA = [
  {
    variant_id: '1',
    abc_classification: 'A',
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
    abc_classification: 'A',
    revenue_contribution: 38000,
    stock_value: 9500,
    cumulative_revenue_percentage: 28.1,
    turnover_rate: 7.2,
    days_of_inventory: 51,
    priority_score: 88.3,
    core_product_variants: {
      sku: 'CAM-002-WHT-M',
      core_products: { product_name: 'Camisa Polo Clássica' }
    },
    analysis_date: new Date().toISOString().split('T')[0]
  },
  {
    variant_id: '3',
    abc_classification: 'B',
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
  },
  {
    id: '2',
    supplier_id: 'SUPP-002',
    analysis_period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    analysis_period_end: new Date().toISOString(),
    total_orders: 38,
    avg_lead_time_days: 18.2,
    sla_lead_time_days: 20,
    lead_time_variance: 4.1,
    fill_rate_percentage: 87.3,
    divergence_rate_percentage: 12.7,
    on_time_delivery_rate: 76.8,
    quality_score: 85.5,
    performance_score: 82.4,
    trade_name: 'Beta Confecções',
    legal_name: 'Beta Confecções e Comércio S/A'
  },
  {
    id: '3',
    supplier_id: 'SUPP-003',
    analysis_period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    analysis_period_end: new Date().toISOString(),
    total_orders: 52,
    avg_lead_time_days: 8.7,
    sla_lead_time_days: 10,
    lead_time_variance: 1.5,
    fill_rate_percentage: 98.1,
    divergence_rate_percentage: 1.9,
    on_time_delivery_rate: 95.2,
    quality_score: 96.8,
    performance_score: 97.1,
    trade_name: 'Gamma Sports',
    legal_name: 'Gamma Artigos Esportivos Ltda'
  }
];

export default async function HomePage() {
  // Obter dados do usuário
  const userData = await getCachedUserProps();
  const userName = userData.firstName || userData.user_metadata?.first_name || userData.email?.split('@')[0] || 'Usuário';

  // Buscar dados do Supabase
  let metrics = MOCK_METRICS;
  let alerts: any[] = [];
  let forecastData: any[] = MOCK_FORECAST_DATA;
  let coverageData: any[] = MOCK_COVERAGE_DATA;
  let abcData: any[] = MOCK_ABC_DATA;
  let supplierData: any[] = MOCK_SUPPLIER_DATA;

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    // Buscar métricas
    const { data: dailyMetrics, error } = await supabase
      .from('daily_metrics')
      .select('sales, margin, cover_days, sell_through')
      .order('day', { ascending: false })
      .limit(1)
      .single();

    if (!error && dailyMetrics) {
      metrics = {
        sales: parseFloat(dailyMetrics.sales) || MOCK_METRICS.sales,
        margin: parseFloat(dailyMetrics.margin) || MOCK_METRICS.margin,
        cover_days: parseFloat(dailyMetrics.cover_days) || MOCK_METRICS.cover_days,
        sell_through: parseFloat(dailyMetrics.sell_through) || MOCK_METRICS.sell_through
      };
    }

    // Buscar alertas mais recentes (últimos 7 dias)
    const { data: alertsData, error: alertsError } = await supabase
      .from('alert_digest')
      .select('id, alert_ts, severity, title, description, resolved')
      .gte('alert_ts', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('alert_ts', { ascending: false })
      .limit(10);

    if (!alertsError && alertsData) {
      alerts = alertsData;
    }

    // Buscar dados de coverage (resumidos)
    const today = new Date().toISOString().split('T')[0];
    const { data: coverageRaw, error: coverageError } = await supabase
      .from('projected_coverage')
      .select(`
        variant_id,
        current_stock,
        avg_daily_sales,
        projected_days_coverage,
        core_product_variants!inner(
          sku,
          core_products(product_name)
        ),
        core_locations(location_name)
      `)
      .eq('analysis_date', today)
      .order('projected_days_coverage', { ascending: true })
      .limit(20);

    if (!coverageError && coverageRaw) {
      coverageData = coverageRaw;
    }

    // Dados de fornecedores (usando mock por enquanto)
    supplierData = [];

  } catch (error) {
    console.log('Usando dados mock - Supabase não disponível:', error);
  }

  // Gerar insights inteligentes
  const insights = InsightsProcessor.generateInsights(
    alerts,
    metrics,
    coverageData,
    abcData,
    supplierData
  );

  // Se não tiver insights dos dados reais, usar mock
  const displayInsights = insights.length > 0 ? insights : InsightsProcessor.generateMockInsights();

  return (
    <PageErrorBoundary>
      <HomePageClient 
        userName={userName}
        insights={displayInsights}
      />
    </PageErrorBoundary>
  );
} 