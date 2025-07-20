import { z } from 'zod';
import { BanbanLogger, BanbanMetrics } from '../index';
import {
  EventValidationService,
  EventProcessingService,
  WebhookListenerService,
  MetricsCollectionService
} from './services';
import { DataProcessingApiHandlers } from './handlers/ApiHandlers';
import {
  EdgeFunctionEvent,
  ProcessingResult,
  EventType,
  EdgeFunctionType,
  ProcessingMetrics,
  HealthCheckResult,
  WebhookListenerConfig
} from './types';

// =============================================
// SCHEMAS DE VALIDAÇÃO ZOD
// =============================================

const EventTypeSchema = z.nativeEnum(EventType);

const EdgeFunctionEventSchema = z.object({
  eventType: EventTypeSchema,
  organizationId: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.record(z.any()),
  metadata: z.object({
    source: z.string(),
    version: z.string(),
    correlation_id: z.string().optional(),
    retry_count: z.number().optional(),
    processing_attempts: z.number().optional()
  }).optional()
});

const WebhookConfigSchema = z.object({
  enableInventoryListener: z.boolean().default(true),
  enableSalesListener: z.boolean().default(true),
  enablePurchaseListener: z.boolean().default(true),
  enableTransferListener: z.boolean().default(true),
  batchProcessing: z.boolean().default(true),
  batchSize: z.number().int().positive().default(50),
  batchTimeout: z.number().int().positive().default(5000)
});

/**
 * Módulo BanBan Data Processing - Versão Refatorada v2.0.0
 * 
 * Responsável por processar eventos das Edge Functions do Supabase
 * com arquitetura modular, validação robusta e métricas avançadas.
 * 
 * Funcionalidades principais:
 * - Processamento de eventos das 4 Edge Functions (inventory, sales, purchase, transfer)
 * - Validação avançada com schemas Zod
 * - Sistema de métricas e monitoramento
 * - API REST completa com 13+ endpoints
 * - Processamento em lote com configuração flexível
 * - Health checks e relatórios de performance
 */
export class BanbanDataProcessingModule {
  // Propriedades do módulo
  readonly id = 'banban-data-processing';
  readonly name = 'BanBan Data Processing';
  readonly version = '2.0.0';
  readonly category = 'custom';
  readonly vendor = 'Axon Development Team';

  private logger: BanbanLogger;
  private validationService: EventValidationService;
  private processingService: EventProcessingService;
  private webhookService: WebhookListenerService;
  private metricsService: MetricsCollectionService;
  private apiHandlers: DataProcessingApiHandlers;
  private isInitialized = false;
  private config: WebhookListenerConfig;

  constructor(config?: Partial<WebhookListenerConfig>) {
    this.logger = BanbanLogger.getInstance();
    
    // Validar e definir configuração
    this.config = WebhookConfigSchema.parse(config || {});
    
    // Inicializar serviços especializados
    this.validationService = new EventValidationService();
    this.processingService = new EventProcessingService();
    this.webhookService = new WebhookListenerService(this.config);
    this.metricsService = new MetricsCollectionService();
    this.apiHandlers = new DataProcessingApiHandlers();

    this.logger.info('data-processing', 'BanBan Data Processing Module created', {
      version: this.version,
      architecture: 'modular',
      services: 5,
      config: this.config
    });
  }

  // =============================================
  // IMPLEMENTAÇÃO DA MODULEINTERFACE
  // =============================================

  /**
   * Função obrigatória para registrar o módulo
   */
  register(): BanbanDataProcessingModule {
    this.logger.info('data-processing', 'Registering BanBan Data Processing Module', {
      id: this.id,
      version: this.version,
      category: this.category
    });
    return this;
  }

  /**
   * Inicializa o módulo
   */
  async initialize(): Promise<{ success: boolean; message: string; timestamp: Date; metadata?: any; error?: string }> {
    if (this.isInitialized) {
      this.logger.warn('data-processing', 'Module already initialized');
      return {
        success: true,
        message: 'Module already initialized',
        timestamp: new Date()
      };
    }

    try {
      this.logger.info('data-processing', 'Initializing BanBan Data Processing Module...');

             // Inicializar serviços (se tiverem método initialize)
       // Nota: Nem todos os serviços implementam initialize

      // Registrar métricas de inicialização
      BanbanMetrics.record('data-processing', 'module_initialized', 1, {
        version: this.version,
        timestamp: new Date().toISOString()
      });

      this.isInitialized = true;

      this.logger.info('data-processing', 'BanBan Data Processing Module initialized successfully', {
        webhookListeners: this.webhookService.getConfig(),
        healthStatus: this.metricsService.getHealthMetrics().healthy
      });

      return {
        success: true,
        message: 'Module initialized successfully',
        timestamp: new Date(),
        metadata: {
          services_initialized: 5,
          webhook_config: this.config,
          health_status: 'healthy'
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('data-processing', 'Failed to initialize module', {
        error: errorMessage
      });
      
      return {
        success: false,
        message: `Failed to initialize module: ${errorMessage}`,
        timestamp: new Date(),
        error: errorMessage
      };
    }
  }

  /**
   * Verifica a saúde do módulo
   */
  async healthCheck(): Promise<{ healthy: boolean; status: string; timestamp: string; details: any }> {
    try {
      const healthMetrics = this.metricsService.getHealthMetrics();
      const processingMetrics = this.metricsService.getProcessingMetrics();
      
             const isHealthy = this.isInitialized && 
                        healthMetrics.healthy && 
                        processingMetrics.totalEventsProcessed > 0;

       return {
         healthy: isHealthy,
         status: isHealthy ? 'healthy' : 'unhealthy',
         timestamp: new Date().toISOString(),
         details: {
           initialized: this.isInitialized,
           total_events_processed: processingMetrics.totalEventsProcessed,
           successful_events: processingMetrics.successfulEvents,
           failed_events: processingMetrics.failedEvents,
           avg_processing_time: processingMetrics.averageProcessingTime,
           uptime: healthMetrics.details.uptime,
           memory_usage: healthMetrics.details.memoryUsage,
          services_status: {
            validation: this.validationService ? 'healthy' : 'unavailable',
            processing: this.processingService ? 'healthy' : 'unavailable',
            webhook: this.webhookService ? 'healthy' : 'unavailable',
            metrics: this.metricsService ? 'healthy' : 'unavailable',
            api: this.apiHandlers ? 'healthy' : 'unavailable'
          }
        }
      };
    } catch (error) {
             return {
         healthy: false,
         status: 'error',
         timestamp: new Date().toISOString(),
         details: {
           error: error instanceof Error ? error.message : 'Unknown error',
           initialized: this.isInitialized
         }
       };
    }
  }

  /**
   * Finaliza o módulo
   */
  async shutdown(): Promise<{ success: boolean; message: string; timestamp: Date; error?: string }> {
    try {
      this.logger.info('data-processing', 'Shutting down BanBan Data Processing Module...');

             // Finalizar serviços (se tiverem método shutdown)
       // Nota: Nem todos os serviços implementam shutdown

      this.isInitialized = false;

      this.logger.info('data-processing', 'BanBan Data Processing Module shut down successfully');

      return {
        success: true,
        message: 'Module shut down successfully',
        timestamp: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('data-processing', 'Failed to shutdown module', {
        error: errorMessage
      });
      
      return {
        success: false,
        message: `Failed to shutdown module: ${errorMessage}`,
        timestamp: new Date(),
        error: errorMessage
      };
    }
  }

  /**
   * Retorna os endpoints do módulo
   */
  getEndpoints(): string[] {
    return [
      '/events',
      '/events/batch',
      '/events/validate',
      '/events/status/{event_id}',
      '/events/reprocess/{event_id}',
      '/queue',
      '/queue/flush',
      '/metrics',
      '/health',
      '/webhooks/inventory',
      '/webhooks/sales',
      '/webhooks/purchase',
      '/webhooks/transfer'
    ];
  }

  /**
   * Retorna a configuração do módulo
   */
  getConfig(): any {
    return {
      enabled: true,
      settings: this.config,
      metadata: {
        services_count: 5,
        features: [
          'event_processing',
          'batch_processing',
          'webhook_validation',
          'metrics_collection',
          'health_monitoring',
          'audit_logging'
        ]
      }
    };
  }

  /**
   * Retorna métricas do módulo
   */
  getMetrics(): any {
    return this.getProcessingMetrics();
  }

  // =============================================
  // MÉTODOS PRINCIPAIS DE PROCESSAMENTO
  // =============================================

  /**
   * Processa um evento individual
   */
  async processEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    this.ensureInitialized();
    
    // Validar evento
    const validationResult = EdgeFunctionEventSchema.safeParse(event);
    if (!validationResult.success) {
      throw new Error(`Invalid event format: ${validationResult.error.message}`);
    }
    
    return await this.processingService.processEvent(validationResult.data);
  }

  /**
   * Processa múltiplos eventos em lote
   */
  async processBatch(events: EdgeFunctionEvent[]): Promise<ProcessingResult[]> {
    this.ensureInitialized();
    
    // Validar eventos
    const validatedEvents = events.map(event => {
      const result = EdgeFunctionEventSchema.safeParse(event);
      if (!result.success) {
        throw new Error(`Invalid event format: ${result.error.message}`);
      }
      return result.data;
    });
    
    return await this.processingService.processBatch(validatedEvents);
  }

  /**
   * Valida um evento sem processá-lo
   */
  async validateEvent(event: EdgeFunctionEvent) {
    this.ensureInitialized();
    
    const validationResult = EdgeFunctionEventSchema.safeParse(event);
    if (!validationResult.success) {
      return {
        valid: false,
        errors: validationResult.error.errors
      };
    }
    
    return await this.validationService.validateEvent(validationResult.data);
  }

  // =============================================
  // WEBHOOK LISTENERS (COMPATIBILIDADE)
  // =============================================

  /**
   * Listener para webhook-inventory-flow
   */
  async onInventoryEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    this.ensureInitialized();
    return await this.webhookService.onInventoryEvent(event);
  }

  /**
   * Listener para webhook-sales-flow
   */
  async onSalesEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    this.ensureInitialized();
    return await this.webhookService.onSalesEvent(event);
  }

  /**
   * Listener para webhook-purchase-flow
   */
  async onPurchaseEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    this.ensureInitialized();
    return await this.webhookService.onPurchaseEvent(event);
  }

  /**
   * Listener para webhook-transfer-flow
   */
  async onTransferEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    this.ensureInitialized();
    return await this.webhookService.onTransferEvent(event);
  }

  // =============================================
  // MÉTODOS DE MÉTRICAS E MONITORAMENTO
  // =============================================

  /**
   * Obtém métricas de processamento
   */
  getProcessingMetrics(): ProcessingMetrics {
    this.ensureInitialized();
    return this.metricsService.getProcessingMetrics();
  }

  /**
   * Obtém métricas de saúde do módulo
   */
  getHealthMetrics(): HealthCheckResult {
    this.ensureInitialized();
    return this.metricsService.getHealthMetrics();
  }

  /**
   * Obtém relatório completo de métricas
   */
  getComprehensiveReport() {
    this.ensureInitialized();
    return this.metricsService.getComprehensiveReport();
  }

  /**
   * Exporta métricas em formato JSON ou CSV
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    this.ensureInitialized();
    return this.metricsService.exportMetrics(format);
  }

  // =============================================
  // MÉTODOS DE CONFIGURAÇÃO
  // =============================================

  /**
   * Atualiza configuração de webhook
   */
  updateWebhookConfig(config: Partial<WebhookListenerConfig>): void {
    this.ensureInitialized();
    const newConfig = WebhookConfigSchema.parse({ ...this.config, ...config });
    this.config = newConfig;
    this.webhookService.updateConfig(newConfig);
  }

  /**
   * Obtém configuração de webhook
   */
  getWebhookConfig(): WebhookListenerConfig {
    this.ensureInitialized();
    return this.config;
  }

  /**
   * Obtém estatísticas de webhook
   */
  getWebhookStats() {
    this.ensureInitialized();
    return this.webhookService.getStats();
  }

  // =============================================
  // MÉTODOS UTILITÁRIOS
  // =============================================

  /**
   * Obtém handlers da API
   */
  getApiHandlers(): DataProcessingApiHandlers {
    this.ensureInitialized();
    return this.apiHandlers;
  }

  /**
   * Força processamento do lote atual
   */
  async flushBatch(): Promise<ProcessingResult> {
    this.ensureInitialized();
    return await this.webhookService.flushBatch();
  }

  /**
   * Limpa cache e fila
   */
  clearCache(): { clearedFromQueue: number } {
    this.ensureInitialized();
    const cleared = this.webhookService.clearQueue();
    return { clearedFromQueue: cleared };
  }

  /**
   * Verifica se o módulo está inicializado
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Module not initialized. Call initialize() first.');
    }
  }

  /**
   * Obtém informações do módulo
   */
  getModuleInfo() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      category: this.category,
      vendor: this.vendor,
      description: 'Sistema robusto de processamento de dados para cliente BanBan Fashion especializado em receber, validar e processar dados do ERP via webhooks',
      initialized: this.isInitialized,
      config: this.config,
      endpoints: this.getEndpoints().length,
      features: [
        'Event Processing',
        'Batch Processing',
        'Webhook Validation',
        'Metrics Collection',
        'Health Monitoring',
        'Audit Logging',
        'Retry Logic',
        'Queue Management'
      ],
             supported_events: Object.values(EventType),
      integrations: [
        'banban-insights',
        'banban-performance',
        'banban-inventory',
        'edge-functions'
      ]
    };
  }
}

// =============================================
// EXPORTAÇÕES PRINCIPAIS
// =============================================

// Exportar serviços especializados
export {
  EventValidationService,
  EventProcessingService,
  WebhookListenerService,
  MetricsCollectionService
} from './services';

// Exportar handlers da API
export { DataProcessingApiHandlers } from './handlers/ApiHandlers';

// Exportar tipos e interfaces
export * from './types';

// ================================================
// INSTANCIA SINGLETON (COMPATIBILIDADE)
// ================================================

/**
 * Instancia singleton para compatibilidade com codigo existente
 * Permite uso direto sem instanciacao explicita
 */
let defaultInstance: BanbanDataProcessingModule | null = null;

/**
 * Obtem instancia singleton do modulo
 */
export function getDataProcessingModule(config?: Partial<WebhookListenerConfig>): BanbanDataProcessingModule {
  if (!defaultInstance) {
    defaultInstance = new BanbanDataProcessingModule(config);
  }
  return defaultInstance;
}

/**
 * Inicializa instancia singleton
 */
export async function initializeDataProcessing(config?: Partial<WebhookListenerConfig>): Promise<BanbanDataProcessingModule> {
  const instance = getDataProcessingModule(config);
  await instance.initialize();
  return instance;
}

// ================================================
// COMPATIBILIDADE COM VERSAO ANTERIOR
// ================================================

/**
 * Funcoes de compatibilidade que mantem a interface da versao anterior
 * Permite migracao gradual do codigo existente
 */

export async function processInventoryEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
  const instance = getDataProcessingModule();
  await instance.initialize();
  return await instance.onInventoryEvent(event);
}

export async function processSalesEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
  const instance = getDataProcessingModule();
  await instance.initialize();
  return await instance.onSalesEvent(event);
}

export async function processPurchaseEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
  const instance = getDataProcessingModule();
  await instance.initialize();
  return await instance.onPurchaseEvent(event);
}

export async function processTransferEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
  const instance = getDataProcessingModule();
  await instance.initialize();
  return await instance.onTransferEvent(event);
}

// ================================================
// DEFAULT EXPORT
// ================================================

export default BanbanDataProcessingModule;