'use client';

import { useState, useTransition } from 'react';
import { AlertSection } from './alert-section';
import { AlertFilters } from './alert-filters';
import { SkeletonAlertasPage } from './alert-skeletons';
import { exportAlertsToCSV } from '@/app/actions/alerts/export-alerts';
import { toast } from '@/hooks/use-toast';
import { SectionErrorBoundary } from '@/components/ui/error-boundary';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  DollarSign,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';

interface AlertasClientProps {
  initialData: {
    summary: any;
    stagnantProducts: any[];
    replenishmentAlerts: any[];
    inventoryDivergences: any[];
    marginAlerts: any[];
    returnSpikes: any[];
    redistributionSuggestions: any[];
  };
}

export function AlertasClient({ initialData }: AlertasClientProps) {
  const [isPending, startTransition] = useTransition();

  // Filtros de estado
  const [filters, setFilters] = useState({
    search: '',
    types: [] as string[],
    severities: [] as string[],
    sort: 'priority'
  });

  // Função para filtrar dados localmente
  const applyFilters = (data: any[], type: string) => {
    let filtered = [...data];

    // Filtro por tipo
    if (filters.types.length > 0) {
      if (!filters.types.includes(type)) {
        return [];
      }
    }

    // Filtro por busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((item: any) => {
        const productName = item.core_product_variants?.core_products?.product_name?.toLowerCase() || '';
        const locationName = item.core_locations?.location_name?.toLowerCase() || 
                            item.source_location?.location_name?.toLowerCase() || 
                            item.target_location?.location_name?.toLowerCase() || '';
        const variantInfo = `${item.core_product_variants?.size || ''} ${item.core_product_variants?.color || ''}`.toLowerCase();
        
        return productName.includes(searchTerm) || 
               locationName.includes(searchTerm) || 
               variantInfo.includes(searchTerm);
      });
    }

    // Ordenação
    switch (filters.sort) {
      case 'priority':
        filtered.sort((a, b) => {
          const getPriority = (item: any) => {
            if (item.priority_level) {
              const levels = { critical: 4, high: 3, medium: 2, low: 1 };
              return levels[item.priority_level as keyof typeof levels] || 0;
            }
            if (item.severity) {
              const levels = { high: 3, medium: 2, low: 1 };
              return levels[item.severity as keyof typeof levels] || 0;
            }
            return item.priority_score || 0;
          };
          return getPriority(b) - getPriority(a);
        });
        break;
      
      case 'date':
        filtered.sort((a, b) => {
          const aDate = new Date(a.last_movement_date || a.created_at || 0);
          const bDate = new Date(b.last_movement_date || b.created_at || 0);
          return bDate.getTime() - aDate.getTime();
        });
        break;
      
      case 'impact':
        filtered.sort((a, b) => {
          const getImpact = (item: any) => {
            return Math.abs(item.total_value_impact || 
                           item.potential_revenue_impact || 
                           item.estimated_revenue_gain || 
                           item.total_return_value || 0);
          };
          return getImpact(b) - getImpact(a);
        });
        break;
    }

    return filtered;
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleTypeFilter = (types: string[]) => {
    setFilters(prev => ({ ...prev, types }));
  };

  const handleSeverityFilter = (severities: string[]) => {
    setFilters(prev => ({ ...prev, severities }));
  };

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({ ...prev, sort }));
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        toast({
          title: 'Gerando export...',
          description: 'Processando...'
        });

        const result = await exportAlertsToCSV({
          search: filters.search || undefined,
          types: filters.types.length > 0 ? filters.types as any : undefined,
          severities: filters.severities.length > 0 ? filters.severities : undefined,
        });
        
        if (result.success && result.data) {
          // Criar e baixar arquivo
          const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = result.filename || 'alertas.csv';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          
          toast({
            title: 'Arquivo baixado com sucesso!',
            description: 'O export foi concluído.'
          });
        } else {
          throw new Error(result.error || 'Erro no export');
        }
      } catch (error) {
        toast({
          title: 'Erro ao gerar export',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive'
        });
      }
    });
  };

  // Calcular total de alertas após filtros
  const getTotalAlerts = () => {
    return applyFilters(initialData.stagnantProducts, 'stagnant').length +
           applyFilters(initialData.replenishmentAlerts, 'replenishment').length +
           applyFilters(initialData.inventoryDivergences, 'divergence').length +
           applyFilters(initialData.marginAlerts, 'margin').length +
           applyFilters(initialData.returnSpikes, 'returns').length +
           applyFilters(initialData.redistributionSuggestions, 'redistribution').length;
  };

  const iconMapping = {
    clock: <Clock className="w-5 h-5 text-orange-500" />,
    'alert-triangle': <AlertTriangle className="w-5 h-5 text-red-500" />,
    'trending-down': <TrendingDown className="w-5 h-5 text-blue-500" />,
    'dollar-sign': <DollarSign className="w-5 h-5 text-green-500" />,
    'rotate-ccw': <RotateCcw className="w-5 h-5 text-purple-500" />,
    'arrow-up-down': <ArrowUpDown className="w-5 h-5 text-indigo-500" />,
  };

  if (isPending) {
    return <SkeletonAlertasPage />;
  }

  return (
    <SectionErrorBoundary sectionName="Sistema de Alertas">
      <div className="space-y-6">
        {/* Filtros */}
        <AlertFilters
          onSearchChange={handleSearchChange}
          onTypeFilter={handleTypeFilter}
          onSeverityFilter={handleSeverityFilter}
          onSortChange={handleSortChange}
          onExport={handleExport}
          totalAlerts={getTotalAlerts()}
          isExporting={isPending}
        />

        {/* Seções de Alertas */}
        <div className="space-y-6">
          {/* Produtos Parados */}
          <AlertSection
            title="Produtos Parados"
            description="Produtos sem movimento por períodos prolongados"
            icon={iconMapping['clock']}
            data={applyFilters(initialData.stagnantProducts, 'stagnant')}
            columns={[
              { key: 'product', label: 'Produto' },
              { key: 'location', label: 'Local' },
              { key: 'days', label: 'Dias Parado' },
              { key: 'stock', label: 'Estoque' },
              { key: 'action', label: 'Ação Sugerida' }
            ]}
            renderRow={(item: any) => ({
              product: (
                <div>
                  <div className="font-medium">{item.core_product_variants?.core_products?.product_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.core_product_variants?.size} - {item.core_product_variants?.color}
                  </div>
                </div>
              ),
              location: item.core_locations?.location_name,
              days: `${item.days_without_movement} dias`,
              stock: `${item.current_stock} un`,
              action: item.suggested_action === 'promotion' ? 'Promoção' : 
                     item.suggested_action === 'transfer' ? 'Transferir' : 'Liquidação'
            })}
            totalCount={initialData.summary?.total_stagnant_products || 0}
            alertType="stagnant"
          />

          {/* Alertas de Reposição */}
          <AlertSection
            title="Alertas de Reposição"
            description="Produtos com estoque baixo que precisam de reposição"
            icon={iconMapping['alert-triangle']}
            data={applyFilters(initialData.replenishmentAlerts, 'replenishment')}
            columns={[
              { key: 'product', label: 'Produto' },
              { key: 'location', label: 'Local' },
              { key: 'stock', label: 'Estoque Atual' },
              { key: 'coverage', label: 'Cobertura' },
              { key: 'suggested', label: 'Repor' },
              { key: 'priority', label: 'Prioridade' }
            ]}
            renderRow={(item: any) => ({
              product: (
                <div>
                  <div className="font-medium">{item.core_product_variants?.core_products?.product_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.core_product_variants?.size} - {item.core_product_variants?.color}
                  </div>
                </div>
              ),
              location: item.core_locations?.location_name,
              stock: `${item.current_stock} un`,
              coverage: `${item.coverage_days.toFixed(1)} dias`,
              suggested: `${item.suggested_qty} un`,
              priority: item.priority_level
            })}
            totalCount={initialData.summary?.total_replenishment_alerts || 0}
            alertType="replenishment"
          />

          {/* Divergências de Estoque */}
          <AlertSection
            title="Divergências de Estoque"
            description="Diferenças entre estoque esperado e contado"
            icon={iconMapping['trending-down']}
            data={applyFilters(initialData.inventoryDivergences, 'divergence')}
            columns={[
              { key: 'product', label: 'Produto' },
              { key: 'location', label: 'Local' },
              { key: 'expected', label: 'Esperado' },
              { key: 'scanned', label: 'Contado' },
              { key: 'difference', label: 'Diferença' },
              { key: 'impact', label: 'Impacto' }
            ]}
            renderRow={(item: any) => ({
              product: (
                <div>
                  <div className="font-medium">{item.core_product_variants?.core_products?.product_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.core_product_variants?.size} - {item.core_product_variants?.color}
                  </div>
                </div>
              ),
              location: item.core_locations?.location_name,
              expected: `${item.expected_qty} un`,
              scanned: `${item.scanned_qty} un`,
              difference: `${item.difference_percentage.toFixed(1)}%`,
              impact: `R$ ${Math.abs(item.total_value_impact).toFixed(2)}`
            })}
            totalCount={initialData.summary?.total_inventory_divergences || 0}
            alertType="divergence"
          />

          {/* Alertas de Margem */}
          <AlertSection
            title="Alertas de Margem"
            description="Produtos com margem abaixo do mínimo aceitável"
            icon={iconMapping['dollar-sign']}
            data={applyFilters(initialData.marginAlerts, 'margin')}
            columns={[
              { key: 'product', label: 'Produto' },
              { key: 'current_margin', label: 'Margem Atual' },
              { key: 'current_price', label: 'Preço Atual' },
              { key: 'suggested_price', label: 'Preço Sugerido' },
              { key: 'impact', label: 'Impacto' }
            ]}
            renderRow={(item: any) => ({
              product: (
                <div>
                  <div className="font-medium">{item.core_product_variants?.core_products?.product_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.core_product_variants?.size} - {item.core_product_variants?.color}
                  </div>
                </div>
              ),
              current_margin: `${item.current_margin_pct.toFixed(1)}%`,
              current_price: `R$ ${item.current_price.toFixed(2)}`,
              suggested_price: `R$ ${item.suggested_price.toFixed(2)}`,
              impact: `+R$ ${item.potential_revenue_impact.toFixed(2)}`
            })}
            totalCount={initialData.summary?.total_margin_alerts || 0}
            alertType="margin"
          />

          {/* Picos de Devolução */}
          <AlertSection
            title="Picos de Devolução"
            description="Produtos com aumento significativo de devoluções"
            icon={iconMapping['rotate-ccw']}
            data={applyFilters(initialData.returnSpikes, 'returns')}
            columns={[
              { key: 'product', label: 'Produto' },
              { key: 'location', label: 'Local' },
              { key: 'returns_last', label: 'Última Semana' },
              { key: 'returns_previous', label: 'Semana Anterior' },
              { key: 'increase', label: 'Aumento' },
              { key: 'value', label: 'Valor' }
            ]}
            renderRow={(item: any) => ({
              product: (
                <div>
                  <div className="font-medium">{item.core_product_variants?.core_products?.product_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.core_product_variants?.size} - {item.core_product_variants?.color}
                  </div>
                </div>
              ),
              location: item.core_locations?.location_name,
              returns_last: `${item.returns_last_7_days} devoluções`,
              returns_previous: `${item.returns_previous_7_days} devoluções`,
              increase: `+${item.increase_percentage.toFixed(0)}%`,
              value: `R$ ${item.total_return_value.toFixed(2)}`
            })}
            totalCount={initialData.summary?.total_return_spikes || 0}
            alertType="returns"
          />

          {/* Sugestões de Redistribuição */}
          <AlertSection
            title="Sugestões de Redistribuição"
            description="Oportunidades de transferência entre locais"
            icon={iconMapping['arrow-up-down']}
            data={applyFilters(initialData.redistributionSuggestions, 'redistribution')}
            columns={[
              { key: 'product', label: 'Produto' },
              { key: 'from', label: 'De' },
              { key: 'to', label: 'Para' },
              { key: 'qty', label: 'Quantidade' },
              { key: 'priority', label: 'Prioridade' },
              { key: 'gain', label: 'Ganho Estimado' }
            ]}
            renderRow={(item: any) => ({
              product: (
                <div>
                  <div className="font-medium">{item.core_product_variants?.core_products?.product_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.core_product_variants?.size} - {item.core_product_variants?.color}
                  </div>
                </div>
              ),
              from: item.source_location?.location_name,
              to: item.target_location?.location_name,
              qty: `${item.suggested_transfer_qty} un`,
              priority: item.priority_score.toFixed(1),
              gain: `+R$ ${item.estimated_revenue_gain.toFixed(2)}`
            })}
            totalCount={initialData.summary?.total_redistribution_suggestions || 0}
            alertType="redistribution"
          />
        </div>
      </div>
    </SectionErrorBoundary>
  );
} 