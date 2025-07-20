// Configuração do Módulo Banban
// TODO: Importar Fastify quando backend estiver integrado
// import { FastifyInstance } from 'fastify';
// import routes from '@/core/modules/banban/api/endpoints';

export interface BanbanModuleConfig {
  enabled: boolean;
  routes: {
    prefix: string;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  insights: {
    updateInterval: number; // segundos
    cacheTimeout: number;   // segundos
    maxInsightsPerType: number;
  };
  dataProcessing: {
    maxEventQueueSize: number;
    processingTimeout: number; // milliseconds
    retryAttempts: number;
  };
  performance: {
    metricsRetentionDays: number;
    maxMetricsPerModule: number;
  };
}

const defaultConfig: BanbanModuleConfig = {
  enabled: true,
  routes: {
    prefix: '/api/modules/banban'
  },
  logging: {
    enabled: true,
    level: 'info'
  },
  insights: {
    updateInterval: 300,      // 5 minutos
    cacheTimeout: 1800,       // 30 minutos
    maxInsightsPerType: 50
  },
  dataProcessing: {
    maxEventQueueSize: 1000,
    processingTimeout: 30000,  // 30 segundos
    retryAttempts: 3
  },
  performance: {
    metricsRetentionDays: 30,
    maxMetricsPerModule: 100
  }
};

export class BanbanModule {
  private config: BanbanModuleConfig;
  private fastify: any; // TODO: Tipar com FastifyInstance quando disponível

  constructor(fastify: any, config?: Partial<BanbanModuleConfig>) {
    this.fastify = fastify;
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.fastify.log.info('Módulo Banban está desabilitado');
      return;
    }

    try {
      // TODO: Registrar rotas quando backend estiver integrado
      // await this.fastify.register(routes, {
      //   prefix: this.config.routes.prefix
      // });

      // Configura o logger do módulo
      if (this.config.logging.enabled) {
        this.fastify.log.level = this.config.logging.level;
      }

      // Inicializar listeners ativos se configurado
      if (this.config.dataProcessing) {
        await this.initializeDataProcessing();
      }

      // Inicializar sistema de insights
      if (this.config.insights) {
        await this.initializeInsights();
      }


      this.fastify.log.info('Módulo Banban inicializado com sucesso', {
        config: {
          insights: this.config.insights.updateInterval,
          dataProcessing: this.config.dataProcessing.maxEventQueueSize
        }
      });

    } catch (error) {
      this.fastify.log.error('Erro ao inicializar módulo Banban:', error);
      throw error;
    }
  }

  private async initializeDataProcessing(): Promise<void> {
    // TODO: Inicializar sistema de processamento de dados
    this.fastify.log.info('Sistema de processamento de dados inicializado');
  }

  private async initializeInsights(): Promise<void> {
    // TODO: Inicializar motor de insights
    this.fastify.log.info('Motor de insights inicializado');
  }


  // Getters para acessar configurações
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  get routePrefix(): string {
    return this.config.routes.prefix;
  }

  get insightsConfig() {
    return this.config.insights;
  }


  get dataProcessingConfig() {
    return this.config.dataProcessing;
  }

  get performanceConfig() {
    return this.config.performance;
  }

  // Método para atualizar configuração em runtime
  updateConfig(newConfig: Partial<BanbanModuleConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    this.fastify.log.info('Configuração do módulo Banban atualizada', { newConfig });
  }
}

export { defaultConfig as BANBAN_DEFAULT_CONFIG }; 