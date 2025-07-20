'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { WidgetProps, WidgetSkeleton } from './BaseWidget';

// Interface para mapeamento de widgets
interface WidgetRegistry {
  [key: string]: {
    component: ComponentType<WidgetProps>;
    metadata: {
      module_id: string;
      name: string;
      description: string;
    };
  };
}

// Cache para componentes carregados
const componentCache = new Map<string, ComponentType<WidgetProps>>();

// Widgets implementados (para verificação antes do import)
const IMPLEMENTED_WIDGETS = [
  '/widgets/analytics/performance-kpis'
  // Adicionar aqui conforme implementamos mais widgets
];

// Lazy loading factory para widgets
function createLazyWidget(componentPath: string): ComponentType<WidgetProps> {
  if (componentCache.has(componentPath)) {
    return componentCache.get(componentPath)!;
  }

  const LazyComponent = lazy(async () => {
    try {
      // Verificar se o widget está implementado
      if (!IMPLEMENTED_WIDGETS.includes(componentPath)) {
        console.warn(`Widget não implementado ainda: ${componentPath}`);
        return { default: FallbackWidget };
      }

      // Mapear apenas widgets implementados
      const moduleMap: Record<string, () => Promise<any>> = {
        // Analytics widgets (apenas implementados)
        '/widgets/analytics/performance-kpis': () => import('./modules/analytics/PerformanceKPIsWidget'),
      };

      const moduleLoader = moduleMap[componentPath];
      
      if (!moduleLoader) {
        console.warn(`Widget não encontrado no mapa: ${componentPath}`);
        return { default: FallbackWidget };
      }

      const loadedModule = await moduleLoader();
      return { default: loadedModule.default || loadedModule };
    } catch (error) {
      console.error(`Erro ao carregar widget ${componentPath}:`, error);
      return { default: ErrorWidget };
    }
  });

  componentCache.set(componentPath, LazyComponent);
  return LazyComponent;
}

// Widget de fallback para componentes não encontrados
function FallbackWidget({ data, params }: WidgetProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mx-auto flex items-center justify-center">
          <span className="text-2xl">🚧</span>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Em Desenvolvimento</p>
          <p className="text-xs text-muted-foreground mt-1">
            Este widget será implementado em breve
          </p>
        </div>
        <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
          Próxima versão
        </div>
      </div>
    </div>
  );
}

// Widget de erro para componentes que falharam ao carregar
function ErrorWidget({ error }: WidgetProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 bg-destructive/10 rounded mx-auto flex items-center justify-center">
          <span className="text-destructive">⚠️</span>
        </div>
        <p className="text-sm text-muted-foreground">Erro ao carregar widget</p>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}

// Interface para propriedades do WidgetLoader
interface WidgetLoaderProps {
  componentPath: string;
  data?: any;
  params?: Record<string, any>;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onUpdateParams?: (params: Record<string, any>) => void;
}

// Componente principal do WidgetLoader
export function WidgetLoader({
  componentPath,
  data,
  params,
  loading,
  error,
  onRefresh,
  onUpdateParams
}: WidgetLoaderProps) {
  const Component = createLazyWidget(componentPath);

  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <Component
        data={data}
        params={params}
        loading={loading}
        error={error}
        onRefresh={onRefresh}
        onUpdateParams={onUpdateParams}
      />
    </Suspense>
  );
}

// Hook para pré-carregar widgets
export function useWidgetPreloader() {
  const preloadWidget = React.useCallback((componentPath: string) => {
    // Pré-carregar componente em background
    createLazyWidget(componentPath);
  }, []);

  const preloadModuleWidgets = React.useCallback((moduleId: string) => {
    const modulePaths = {
      'analytics': [
        '/widgets/analytics/performance-kpis',
        '/widgets/analytics/sales-overview',
        '/widgets/analytics/trend-chart',
        '/widgets/analytics/conversion-funnel'
      ],
      'inventory': [
        '/widgets/inventory/low-stock-alert',
        '/widgets/inventory/recent-movements',
        '/widgets/inventory/abc-analysis',
        '/widgets/inventory/stock-overview',
        '/widgets/inventory/turnover-rate'
      ],
      'performance': [
        '/widgets/performance/system-metrics',
        '/widgets/performance/uptime-status',
        '/widgets/performance/response-time',
        '/widgets/performance/error-rate',
        '/widgets/performance/throughput'
      ],
      'alerts': [
        '/widgets/alerts/active-alerts',
        '/widgets/alerts/alert-history',
        '/widgets/alerts/alert-configuration',
        '/widgets/alerts/alert-stats',
        '/widgets/alerts/notification-channels'
      ]
    };

    const paths = modulePaths[moduleId as keyof typeof modulePaths];
    if (paths) {
      paths.forEach(preloadWidget);
    }
  }, [preloadWidget]);

  return {
    preloadWidget,
    preloadModuleWidgets
  };
}

// Utilitário para verificar se um widget está disponível
export function isWidgetAvailable(componentPath: string): boolean {
  return IMPLEMENTED_WIDGETS.includes(componentPath);
}

// Registry de metadados dos widgets (para uso futuro)
export const WIDGET_METADATA = {
  // Analytics
  'performance-kpis': {
    module_id: 'analytics',
    name: 'Performance KPIs',
    description: 'Indicadores-chave de performance',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'sales-overview': {
    module_id: 'analytics',
    name: 'Sales Overview',
    description: 'Visão geral de vendas',
    defaultWidth: 4,
    defaultHeight: 3
  },
  'trend-chart': {
    module_id: 'analytics',
    name: 'Trend Chart',
    description: 'Gráfico de tendências',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'conversion-funnel': {
    module_id: 'analytics',
    name: 'Conversion Funnel',
    description: 'Funil de conversão',
    defaultWidth: 3,
    defaultHeight: 3
  },
  
  // Inventory
  'low-stock-alert': {
    module_id: 'inventory',
    name: 'Low Stock Alert',
    description: 'Alertas de estoque baixo',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'recent-movements': {
    module_id: 'inventory',
    name: 'Recent Movements',
    description: 'Movimentações recentes',
    defaultWidth: 4,
    defaultHeight: 3
  },
  'abc-analysis': {
    module_id: 'inventory',
    name: 'ABC Analysis',
    description: 'Análise ABC de produtos',
    defaultWidth: 3,
    defaultHeight: 3
  },
  'stock-overview': {
    module_id: 'inventory',
    name: 'Stock Overview',
    description: 'Visão geral do estoque',
    defaultWidth: 4,
    defaultHeight: 2
  },
  'turnover-rate': {
    module_id: 'inventory',
    name: 'Turnover Rate',
    description: 'Taxa de giro de produtos',
    defaultWidth: 3,
    defaultHeight: 2
  },
  
  // Performance
  'system-metrics': {
    module_id: 'performance',
    name: 'System Metrics',
    description: 'Métricas do sistema',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'uptime-status': {
    module_id: 'performance',
    name: 'Uptime Status',
    description: 'Status de disponibilidade',
    defaultWidth: 2,
    defaultHeight: 2
  },
  'response-time': {
    module_id: 'performance',
    name: 'Response Time',
    description: 'Tempo de resposta',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'error-rate': {
    module_id: 'performance',
    name: 'Error Rate',
    description: 'Taxa de erros',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'throughput': {
    module_id: 'performance',
    name: 'Throughput',
    description: 'Volume de requisições',
    defaultWidth: 3,
    defaultHeight: 2
  },
  
  // Alerts
  'active-alerts': {
    module_id: 'alerts',
    name: 'Active Alerts',
    description: 'Alertas ativos',
    defaultWidth: 3,
    defaultHeight: 3
  },
  'alert-history': {
    module_id: 'alerts',
    name: 'Alert History',
    description: 'Histórico de alertas',
    defaultWidth: 4,
    defaultHeight: 3
  },
  'alert-configuration': {
    module_id: 'alerts',
    name: 'Alert Configuration',
    description: 'Configuração de alertas',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'alert-stats': {
    module_id: 'alerts',
    name: 'Alert Statistics',
    description: 'Estatísticas de alertas',
    defaultWidth: 3,
    defaultHeight: 2
  },
  'notification-channels': {
    module_id: 'alerts',
    name: 'Notification Channels',
    description: 'Canais de notificação',
    defaultWidth: 2,
    defaultHeight: 2
  }
};

export default WidgetLoader;