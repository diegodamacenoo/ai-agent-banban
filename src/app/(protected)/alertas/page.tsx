import { Metadata } from 'next';
import { createSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { AlertasClient } from "./components/alertas-client";
import { SkeletonAlertasPage } from "./components/alert-skeletons";
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  DollarSign,
  RotateCcw,
  ArrowUpDown,

} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: 'Insights',
  description: 'Insights automatizados e inteligência operacional para gestão de estoque.',
};

// Tipos para os alertas
interface StagnantProduct {
  id: string;
  variant_id: string;
  location_id: string;
  days_without_movement: number;
  last_movement_date: string | null;
  current_stock: number;
  suggested_action: 'promotion' | 'transfer' | 'liquidation';
  core_product_variants: {
    size: string;
    color: string;
    core_products: {
      product_name: string;
      category: string;
    };
  };
  core_locations: {
    location_name: string;
  };
}

interface ReplenishmentAlert {
  id: string;
  variant_id: string;
  location_id: string;
  current_stock: number;
  avg_daily_sales: number;
  coverage_days: number;
  min_coverage_threshold: number;
  suggested_qty: number;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  core_product_variants: {
    size: string;
    color: string;
    core_products: {
      product_name: string;
    };
  };
  core_locations: {
    location_name: string;
  };
}

interface InventoryDivergence {
  id: string;
  variant_id: string;
  location_id: string;
  expected_qty: number;
  scanned_qty: number;
  difference_qty: number;
  difference_percentage: number;
  total_value_impact: number;
  severity: 'low' | 'medium' | 'high';
  core_product_variants: {
    size: string;
    color: string;
    core_products: {
      product_name: string;
    };
  };
  core_locations: {
    location_name: string;
  };
}

interface MarginAlert {
  id: string;
  variant_id: string;
  current_price: number;
  cost_price: number;
  current_margin_pct: number;
  min_acceptable_margin_pct: number;
  suggested_price: number;
  potential_revenue_impact: number;
  core_product_variants: {
    size: string;
    color: string;
    core_products: {
      product_name: string;
    };
  };
}

interface ReturnSpike {
  id: string;
  variant_id: string;
  location_id: string;
  returns_last_7_days: number;
  returns_previous_7_days: number;
  increase_percentage: number;
  total_return_value: number;
  suggested_investigation: string;
  core_product_variants: {
    size: string;
    color: string;
    core_products: {
      product_name: string;
    };
  };
  core_locations: {
    location_name: string;
  };
}

interface RedistributionSuggestion {
  id: string;
  variant_id: string;
  source_location_id: string;
  target_location_id: string;
  source_excess_qty: number;
  target_shortage_qty: number;
  suggested_transfer_qty: number;
  priority_score: number;
  estimated_revenue_gain: number;
  core_product_variants: {
    size: string;
    color: string;
    core_products: {
      product_name: string;
    };
  };
  source_location: {
    location_name: string;
  };
  target_location: {
    location_name: string;
  };
}

interface DailySummary {
  analysis_date: string;
  total_stagnant_products: number;
  total_replenishment_alerts: number;
  total_inventory_divergences: number;
  total_margin_alerts: number;
  total_return_spikes: number;
  total_redistribution_suggestions: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
}

// Dados mock para desenvolvimento e fallback
const MOCK_DATA = {
  summary: {
    analysis_date: new Date().toISOString().split('T')[0],
    total_stagnant_products: 23,
    total_replenishment_alerts: 18,
    total_inventory_divergences: 12,
    total_margin_alerts: 8,
    total_return_spikes: 5,
    total_redistribution_suggestions: 15,
    critical_alerts: 4,
    high_alerts: 12,
    medium_alerts: 28,
    low_alerts: 37
  } as DailySummary,

  stagnantProducts: [
    {
      id: 'sp1',
      variant_id: 'var1',
      location_id: 'loc1',
      days_without_movement: 45,
      last_movement_date: '2024-11-20',
      current_stock: 15,
      suggested_action: 'promotion' as const,
      core_product_variants: {
        size: 'M',
        color: 'Azul',
        core_products: {
          product_name: 'Tênis Running Pro',
          category: 'Calçados'
        }
      },
      core_locations: {
        location_name: 'Loja Shopping Center'
      }
    },
    {
      id: 'sp2',
      variant_id: 'var2',
      location_id: 'loc2',
      days_without_movement: 32,
      last_movement_date: '2024-12-03',
      current_stock: 8,
      suggested_action: 'transfer' as const,
      core_product_variants: {
        size: 'G',
        color: 'Preto',
        core_products: {
          product_name: 'Jaqueta Impermeável',
          category: 'Roupas'
        }
      },
      core_locations: {
        location_name: 'Loja Centro'
      }
    },
    {
      id: 'sp3',
      variant_id: 'var3',
      location_id: 'loc3',
      days_without_movement: 28,
      last_movement_date: '2024-12-07',
      current_stock: 22,
      suggested_action: 'liquidation' as const,
      core_product_variants: {
        size: 'P',
        color: 'Vermelho',
        core_products: {
          product_name: 'Camiseta Esportiva',
          category: 'Roupas'
        }
      },
      core_locations: {
        location_name: 'Loja Norte'
      }
    }
  ] as StagnantProduct[],

  replenishmentAlerts: [
    {
      id: 'ra1',
      variant_id: 'var4',
      location_id: 'loc1',
      current_stock: 3,
      avg_daily_sales: 2.5,
      coverage_days: 1.2,
      min_coverage_threshold: 7,
      suggested_qty: 20,
      priority_level: 'critical' as const,
      core_product_variants: {
        size: 'M',
        color: 'Branco',
        core_products: {
          product_name: 'Tênis Casual Premium'
        }
      },
      core_locations: {
        location_name: 'Loja Shopping Center'
      }
    },
    {
      id: 'ra2',
      variant_id: 'var5',
      location_id: 'loc2',
      current_stock: 7,
      avg_daily_sales: 1.8,
      coverage_days: 3.9,
      min_coverage_threshold: 10,
      suggested_qty: 15,
      priority_level: 'high' as const,
      core_product_variants: {
        size: 'G',
        color: 'Azul Marinho',
        core_products: {
          product_name: 'Calça Jeans Slim'
        }
      },
      core_locations: {
        location_name: 'Loja Centro'
      }
    },
    {
      id: 'ra3',
      variant_id: 'var6',
      location_id: 'loc3',
      current_stock: 12,
      avg_daily_sales: 1.2,
      coverage_days: 10,
      min_coverage_threshold: 15,
      suggested_qty: 8,
      priority_level: 'medium' as const,
      core_product_variants: {
        size: 'M',
        color: 'Cinza',
        core_products: {
          product_name: 'Moletom com Capuz'
        }
      },
      core_locations: {
        location_name: 'Loja Norte'
      }
    }
  ] as ReplenishmentAlert[],

  inventoryDivergences: [
    {
      id: 'id1',
      variant_id: 'var7',
      location_id: 'loc1',
      expected_qty: 25,
      scanned_qty: 18,
      difference_qty: -7,
      difference_percentage: -28,
      total_value_impact: 1890.50,
      severity: 'high' as const,
      core_product_variants: {
        size: 'M',
        color: 'Preto',
        core_products: {
          product_name: 'Sapato Social Couro'
        }
      },
      core_locations: {
        location_name: 'Loja Shopping Center'
      }
    },
    {
      id: 'id2',
      variant_id: 'var8',
      location_id: 'loc2',
      expected_qty: 40,
      scanned_qty: 46,
      difference_qty: 6,
      difference_percentage: 15,
      total_value_impact: 480.00,
      severity: 'medium' as const,
      core_product_variants: {
        size: 'P',
        color: 'Rosa',
        core_products: {
          product_name: 'Blusa Feminina'
        }
      },
      core_locations: {
        location_name: 'Loja Centro'
      }
    }
  ] as InventoryDivergence[],

  marginAlerts: [
    {
      id: 'ma1',
      variant_id: 'var9',
      current_price: 89.90,
      cost_price: 72.50,
      current_margin_pct: 19.4,
      min_acceptable_margin_pct: 25,
      suggested_price: 96.67,
      potential_revenue_impact: 156.80,
      core_product_variants: {
        size: 'G',
        color: 'Azul',
        core_products: {
          product_name: 'Bermuda Tactel'
        }
      }
    },
    {
      id: 'ma2',
      variant_id: 'var10',
      current_price: 159.90,
      cost_price: 135.20,
      current_margin_pct: 15.4,
      min_acceptable_margin_pct: 30,
      suggested_price: 193.14,
      potential_revenue_impact: 298.50,
      core_product_variants: {
        size: 'M',
        color: 'Marrom',
        core_products: {
          product_name: 'Bota Couro Masculina'
        }
      }
    }
  ] as MarginAlert[],

  returnSpikes: [
    {
      id: 'rs1',
      variant_id: 'var11',
      location_id: 'loc1',
      returns_last_7_days: 12,
      returns_previous_7_days: 3,
      increase_percentage: 300,
      total_return_value: 1679.40,
      suggested_investigation: 'Verificar qualidade e defeitos recorrentes',
      core_product_variants: {
        size: 'M',
        color: 'Branco',
        core_products: {
          product_name: 'Tênis Running Elite'
        }
      },
      core_locations: {
        location_name: 'Loja Shopping Center'
      }
    },
    {
      id: 'rs2',
      variant_id: 'var12',
      location_id: 'loc2',
      returns_last_7_days: 8,
      returns_previous_7_days: 2,
      increase_percentage: 200,
      total_return_value: 895.20,
      suggested_investigation: 'Analisar feedback dos clientes',
      core_product_variants: {
        size: 'G',
        color: 'Preto',
        core_products: {
          product_name: 'Camisa Polo Premium'
        }
      },
      core_locations: {
        location_name: 'Loja Centro'
      }
    }
  ] as ReturnSpike[],

  redistributionSuggestions: [
    {
      id: 'rds1',
      variant_id: 'var13',
      source_location_id: 'loc3',
      target_location_id: 'loc1',
      source_excess_qty: 15,
      target_shortage_qty: 8,
      suggested_transfer_qty: 8,
      priority_score: 95,
      estimated_revenue_gain: 2240.00,
      core_product_variants: {
        size: 'M',
        color: 'Azul',
        core_products: {
          product_name: 'Jeans Premium Masculino'
        }
      },
      source_location: {
        location_name: 'Loja Norte'
      },
      target_location: {
        location_name: 'Loja Shopping Center'
      }
    },
    {
      id: 'rds2',
      variant_id: 'var14',
      source_location_id: 'loc2',
      target_location_id: 'loc3',
      source_excess_qty: 22,
      target_shortage_qty: 12,
      suggested_transfer_qty: 12,
      priority_score: 87,
      estimated_revenue_gain: 1890.60,
      core_product_variants: {
        size: 'P',
        color: 'Cinza',
        core_products: {
          product_name: 'Vestido Casual Feminino'
        }
      },
      source_location: {
        location_name: 'Loja Centro'
      },
      target_location: {
        location_name: 'Loja Norte'
      }
    }
  ] as RedistributionSuggestion[]
};

export default async function AlertasPage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Buscar resumo diário
    const { data: summary } = await supabase
      .from('mart_daily_summary')
      .select('*')
      .eq('analysis_date', today)
      .single();

    // Buscar alertas específicos
    const [
      { data: stagnantProducts },
      { data: replenishmentAlerts },
      { data: inventoryDivergences },
      { data: marginAlerts },
      { data: returnSpikes },
      { data: redistributionSuggestions }
    ] = await Promise.all([
      // Produtos parados
      supabase
        .from('mart_stagnant_products')
        .select(`
          id,
          variant_id,
          location_id,
          days_without_movement,
          last_movement_date,
          current_stock,
          suggested_action,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name, category)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', today)
        .order('days_without_movement', { ascending: false })
        .limit(20),

      // Alertas de reposição
      supabase
        .from('mart_replenishment_alerts')
        .select(`
          id,
          variant_id,
          location_id,
          current_stock,
          avg_daily_sales,
          coverage_days,
          min_coverage_threshold,
          suggested_qty,
          priority_level,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', today)
        .order('priority_level', { ascending: true })
        .limit(20),

      // Divergências de estoque
      supabase
        .from('mart_inventory_divergences')
        .select(`
          id,
          variant_id,
          location_id,
          expected_qty,
          scanned_qty,
          difference_qty,
          difference_percentage,
          total_value_impact,
          severity,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', today)
        .order('total_value_impact', { ascending: false })
        .limit(15),

      // Alertas de margem
      supabase
        .from('mart_margin_alerts')
        .select(`
          id,
          variant_id,
          current_price,
          cost_price,
          current_margin_pct,
          min_acceptable_margin_pct,
          suggested_price,
          potential_revenue_impact,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name)
          )
        `)
        .eq('analysis_date', today)
        .order('potential_revenue_impact', { ascending: false })
        .limit(15),

      // Picos de devolução
      supabase
        .from('mart_return_spike_alerts')
        .select(`
          id,
          variant_id,
          location_id,
          returns_last_7_days,
          returns_previous_7_days,
          increase_percentage,
          total_return_value,
          suggested_investigation,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name)
          ),
          core_locations!inner(location_name)
        `)
        .eq('analysis_date', today)
        .order('increase_percentage', { ascending: false })
        .limit(10),

      // Sugestões de redistribuição
      supabase
        .from('mart_redistribution_suggestions')
        .select(`
          id,
          variant_id,
          source_location_id,
          target_location_id,
          source_excess_qty,
          target_shortage_qty,
          suggested_transfer_qty,
          priority_score,
          estimated_revenue_gain,
          core_product_variants!inner(
            size, color,
            core_products!inner(product_name)
          ),
          source_location:core_locations!source_location_id(location_name),
          target_location:core_locations!target_location_id(location_name)
        `)
        .eq('analysis_date', today)
        .order('priority_score', { ascending: false })
        .limit(10)
    ]);

    const initialData = {
      summary: summary || MOCK_DATA.summary,
      stagnantProducts: (stagnantProducts && stagnantProducts.length > 0) ? stagnantProducts : MOCK_DATA.stagnantProducts,
      replenishmentAlerts: (replenishmentAlerts && replenishmentAlerts.length > 0) ? replenishmentAlerts : MOCK_DATA.replenishmentAlerts,
      inventoryDivergences: (inventoryDivergences && inventoryDivergences.length > 0) ? inventoryDivergences : MOCK_DATA.inventoryDivergences,
      marginAlerts: (marginAlerts && marginAlerts.length > 0) ? marginAlerts : MOCK_DATA.marginAlerts,
      returnSpikes: (returnSpikes && returnSpikes.length > 0) ? returnSpikes : MOCK_DATA.returnSpikes,
      redistributionSuggestions: (redistributionSuggestions && redistributionSuggestions.length > 0) ? redistributionSuggestions : MOCK_DATA.redistributionSuggestions
    };

    return (
      <PageErrorBoundary>
        <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
          <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold">Insights</h2>
            </div>
            <div className="flex flex-row items-end gap-1">
              <div className="text-sm text-muted-foreground">
                Análise de {new Date(today).toLocaleDateString('pt-BR')}
              </div>
              <Badge variant="outline" className="text-xs">
                {summary ? 'Dados Reais' : 'Dados Demo'}
              </Badge>
            </div>
          </div>
        </header>
        <div className="p-6 space-y-6">

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Produtos Parados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {summary?.total_stagnant_products || MOCK_DATA.summary.total_stagnant_products}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary ? 'produtos sem movimento' : 'produtos em estoque parado'}
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    Média: 32 dias
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Reposição Urgente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-red-600">
                  {summary?.total_replenishment_alerts || MOCK_DATA.summary.total_replenishment_alerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  necessitam reposição imediata
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="destructive" className="text-xs">
                    4 críticos
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-blue-500" />
                  Divergências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {summary?.total_inventory_divergences || MOCK_DATA.summary.total_inventory_divergences}
                </div>
                <p className="text-xs text-muted-foreground">
                  diferenças no inventário
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Impact: R$ 8.4k
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Margem Baixa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {summary?.total_margin_alerts || MOCK_DATA.summary.total_margin_alerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  produtos com margem baixa
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Potencial: +R$ 12k
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-500" />
                  Picos Devolução
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-purple-600">
                  {summary?.total_return_spikes || MOCK_DATA.summary.total_return_spikes}
                </div>
                <p className="text-xs text-muted-foreground">
                  produtos com alto retorno
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    +125% vs semana anterior
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-indigo-500" />
                  Redistribuição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-indigo-600">
                  {summary?.total_redistribution_suggestions || MOCK_DATA.summary.total_redistribution_suggestions}
                </div>
                <p className="text-xs text-muted-foreground">
                  oportunidades de transferência
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Ganho: +R$ 6.8k
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Component com Suspense */}
          <Suspense fallback={<SkeletonAlertasPage />}>
            <AlertasClient initialData={initialData} />
          </Suspense>

        </div>
      </PageErrorBoundary>
    );

  } catch (error) {
    console.error('Erro ao carregar alertas, usando dados mock:', error);
    
    // Usar dados mock em caso de erro
    const initialData = {
      summary: MOCK_DATA.summary,
      stagnantProducts: MOCK_DATA.stagnantProducts,
      replenishmentAlerts: MOCK_DATA.replenishmentAlerts,
      inventoryDivergences: MOCK_DATA.inventoryDivergences,
      marginAlerts: MOCK_DATA.marginAlerts,
      returnSpikes: MOCK_DATA.returnSpikes,
      redistributionSuggestions: MOCK_DATA.redistributionSuggestions
    };

    return (
      <PageErrorBoundary>
        <div className="p-6 space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Insights</h1>
              <p className="text-muted-foreground mt-1">
                Insights automatizados e inteligência operacional para gestão de estoque
                <Badge variant="outline" className="ml-2">
                  Dados Demo
                </Badge>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-sm text-muted-foreground">
                Análise de {new Date(today).toLocaleDateString('pt-BR')}
              </div>
              <Badge variant="outline" className="text-xs">
                Dados Demo
              </Badge>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Produtos Parados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {MOCK_DATA.summary.total_stagnant_products}
                </div>
                <p className="text-xs text-muted-foreground">
                  produtos em estoque parado
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    Média: 32 dias
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Reposição Urgente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-red-600">
                  {MOCK_DATA.summary.total_replenishment_alerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  necessitam reposição imediata
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="destructive" className="text-xs">
                    4 críticos
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-blue-500" />
                  Divergências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {MOCK_DATA.summary.total_inventory_divergences}
                </div>
                <p className="text-xs text-muted-foreground">
                  diferenças no inventário
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Impact: R$ 8.4k
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Margem Baixa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {MOCK_DATA.summary.total_margin_alerts}
                </div>
                <p className="text-xs text-muted-foreground">
                  produtos com margem baixa
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Potencial: +R$ 12k
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-500" />
                  Picos Devolução
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-purple-600">
                  {MOCK_DATA.summary.total_return_spikes}
                </div>
                <p className="text-xs text-muted-foreground">
                  produtos com alto retorno
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    +125% vs semana anterior
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-indigo-500" />
                  Redistribuição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-indigo-600">
                  {MOCK_DATA.summary.total_redistribution_suggestions}
                </div>
                <p className="text-xs text-muted-foreground">
                  oportunidades de transferência
                </p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    Ganho: +R$ 6.8k
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Component com Suspense */}
          <Suspense fallback={<SkeletonAlertasPage />}>
            <AlertasClient initialData={initialData} />
          </Suspense>

        </div>
      </PageErrorBoundary>
    );
  }
} 