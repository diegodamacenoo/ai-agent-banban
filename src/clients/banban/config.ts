import type { ClientModuleInterface } from '@/shared/types/client-module-interface';

export const BANBAN_CONFIG: ClientModuleInterface = {
  clientId: 'banban',
  
  frontendConfig: {
    name: 'BanBan',
    type: 'banban',
    features: {
      inventoryOptimization: true
    },
    theme: {
      primary: '#FF4785',
      secondary: '#0EA5E9',
      accent: '#10B981'
    },
    modules: {
      performance: {
        enabled: true,
        features: [
          'kpi-analytics',
          'fashion-metrics',
          'dashboard-service'
        ]
      },
      insights: {
        enabled: true,
        features: [
          'data-analysis',
          'insights-engine',
          'cache-service'
        ]
      }
    }
  },
  
  // Referência explícita aos módulos de backend
  backendModules: ['banban-performance', 'banban-insights', 'banban-data-processing'],
  
  // Mapeamento de endpoints da API
  apiEndpoints: {
    performance: '/api/modules/banban/performance',
    insights: '/api/modules/banban/insights',
    dataProcessing: '/api/modules/banban/data-processing'
  },
  
  // Configurações específicas do cliente
  customConfig: {
    performanceAnalytics: true,
    insightsEngine: true,
    dataProcessingEnabled: true
  }
}; 
