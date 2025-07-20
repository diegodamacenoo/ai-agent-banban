import { BanbanLogger } from '../../index';
import {
  EdgeFunctionEvent,
  ProcessingResult,
  EventType,
  EdgeFunctionType,
  ProcessingMetrics,
  HealthCheckResult,
  EventValidationResult
} from '../types';
import {
  EventValidationService,
  EventProcessingService,
  WebhookListenerService,
  MetricsCollectionService
} from '../services';

/**
 * Handlers API especializados para o módulo data-processing
 * Responsável por expor funcionalidades via endpoints REST
 */
export class DataProcessingApiHandlers {
  private logger: BanbanLogger;
  private validationService: EventValidationService;
  private processingService: EventProcessingService;
  private webhookService: WebhookListenerService;
  private metricsService: MetricsCollectionService;

  constructor() {
    this.logger = BanbanLogger.getInstance();
    this.validationService = new EventValidationService();
    this.processingService = new EventProcessingService();
    this.webhookService = new WebhookListenerService();
    this.metricsService = new MetricsCollectionService();
  }

  /**
   * POST /api/modules/banban/data-processing/process
   * Processa um evento individual
   */
  async handleProcessEvent(request: {
    body: EdgeFunctionEvent;
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: ProcessingResult;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Processing single event', {
        eventType: request.body.eventType,
        organizationId: request.organizationId
      });

      // Validar que o organizationId do request bate com o do evento
      if (request.body.organizationId !== request.organizationId) {
        return {
          success: false,
          error: 'Organization ID mismatch between request and event'
        };
      }

      const result = await this.processingService.processEvent(request.body);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to process event', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/process-batch
   * Processa múltiplos eventos em lote
   */
  async handleProcessBatch(request: {
    body: { events: EdgeFunctionEvent[] };
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: ProcessingResult[];
    error?: string;
    summary?: {
      totalEvents: number;
      successfulEvents: number;
      failedEvents: number;
    };
  }> {
    try {
      const { events } = request.body;

      this.logger.info('data-processing', 'API: Processing event batch', {
        batchSize: events.length,
        organizationId: request.organizationId
      });

      // Validar que todos os eventos pertencem à organização
      const invalidEvents = events.filter(event => event.organizationId !== request.organizationId);
      if (invalidEvents.length > 0) {
        return {
          success: false,
          error: `${invalidEvents.length} events have mismatched organization ID`
        };
      }

      const results = await this.processingService.processBatch(events);

      const successfulEvents = results.filter(r => r.success).length;
      const failedEvents = results.length - successfulEvents;

      return {
        success: true,
        data: results,
        summary: {
          totalEvents: events.length,
          successfulEvents,
          failedEvents
        }
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to process batch', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/validate
   * Valida um evento sem processá-lo
   */
  async handleValidateEvent(request: {
    body: EdgeFunctionEvent;
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: EventValidationResult;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Validating event', {
        eventType: request.body.eventType,
        organizationId: request.organizationId
      });

      // Validar organization ID
      if (request.body.organizationId !== request.organizationId) {
        return {
          success: false,
          error: 'Organization ID mismatch between request and event'
        };
      }

      const validationResult = await this.validationService.validateEvent(request.body);

      return {
        success: true,
        data: validationResult
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to validate event', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/validate-batch
   * Valida múltiplos eventos em lote
   */
  async handleValidateBatch(request: {
    body: { events: EdgeFunctionEvent[] };
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: EventValidationResult[];
    error?: string;
    summary?: {
      totalEvents: number;
      validEvents: number;
      invalidEvents: number;
    };
  }> {
    try {
      const { events } = request.body;

      this.logger.info('data-processing', 'API: Validating event batch', {
        batchSize: events.length,
        organizationId: request.organizationId
      });

      // Validar organization IDs
      const invalidOrgEvents = events.filter(event => event.organizationId !== request.organizationId);
      if (invalidOrgEvents.length > 0) {
        return {
          success: false,
          error: `${invalidOrgEvents.length} events have mismatched organization ID`
        };
      }

      const results = await this.validationService.validateBatch(events);

      const validEvents = results.filter(r => r.isValid).length;
      const invalidEvents = results.length - validEvents;

      return {
        success: true,
        data: results,
        summary: {
          totalEvents: events.length,
          validEvents,
          invalidEvents
        }
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to validate batch', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET /api/modules/banban/data-processing/metrics
   * Obtém métricas de processamento
   */
  async handleGetMetrics(request: {
    query?: {
      format?: 'json' | 'csv';
      detailed?: 'true' | 'false';
    };
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const format = request.query?.format || 'json';
      const detailed = request.query?.detailed === 'true';

      this.logger.info('data-processing', 'API: Getting metrics', {
        format,
        detailed,
        organizationId: request.organizationId
      });

      if (detailed) {
        const comprehensiveReport = this.metricsService.getComprehensiveReport();
        
        if (format === 'csv') {
          return {
            success: true,
            data: this.metricsService.exportMetrics('csv')
          };
        }

        return {
          success: true,
          data: comprehensiveReport
        };
      } else {
        const basicMetrics = this.metricsService.getProcessingMetrics();
        
        return {
          success: true,
          data: basicMetrics
        };
      }

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to get metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET /api/modules/banban/data-processing/metrics/temporal
   * Obtém métricas temporais com intervalos configuráveis
   */
  async handleGetTemporalMetrics(request: {
    query?: {
      interval?: string; // em minutos
    };
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const intervalMinutes = parseInt(request.query?.interval || '10');

      this.logger.info('data-processing', 'API: Getting temporal metrics', {
        intervalMinutes,
        organizationId: request.organizationId
      });

      const temporalMetrics = this.metricsService.getTemporalMetrics(intervalMinutes);

      return {
        success: true,
        data: temporalMetrics
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to get temporal metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET /api/modules/banban/data-processing/metrics/edge-functions
   * Obtém métricas específicas por Edge Function
   */
  async handleGetEdgeFunctionMetrics(request: {
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: Record<EdgeFunctionType, any>;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Getting edge function metrics', {
        organizationId: request.organizationId
      });

      const edgeFunctionMetrics = this.metricsService.getEdgeFunctionMetrics();

      return {
        success: true,
        data: edgeFunctionMetrics
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to get edge function metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET /api/modules/banban/data-processing/health
   * Verifica a saúde do módulo
   */
  async handleHealthCheck(request: {
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: HealthCheckResult;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Health check requested', {
        organizationId: request.organizationId
      });

      const healthResult = this.metricsService.getHealthMetrics();

      return {
        success: true,
        data: healthResult
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET /api/modules/banban/data-processing/status
   * Obtém status geral do módulo
   */
  async handleGetStatus(request: {
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: {
      module: string;
      version: string;
      status: string;
      uptime: number;
      webhookListeners: any;
      processingQueue: any;
      lastActivity: string;
    };
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Status requested', {
        organizationId: request.organizationId
      });

      const webhookStats = this.webhookService.getStats();
      const healthMetrics = this.metricsService.getHealthMetrics();
      const processingMetrics = this.metricsService.getProcessingMetrics();

      const status = {
        module: 'banban-data-processing',
        version: '1.0.0',
        status: healthMetrics.healthy ? 'operational' : 'degraded',
        uptime: healthMetrics.details.uptime || 0,
        webhookListeners: {
          config: webhookStats.config,
          queueSize: webhookStats.queueSize,
          isProcessing: webhookStats.isProcessing,
          hasBatchTimer: webhookStats.hasBatchTimer
        },
        processingQueue: {
          totalProcessed: processingMetrics.totalEventsProcessed,
          successRate: processingMetrics.totalEventsProcessed > 0 
            ? (processingMetrics.successfulEvents / processingMetrics.totalEventsProcessed) * 100 
            : 0,
          averageProcessingTime: processingMetrics.averageProcessingTime
        },
        lastActivity: processingMetrics.lastProcessedAt
      };

      return {
        success: true,
        data: status
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to get status', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/webhook/inventory
   * Endpoint para webhook de inventário
   */
  async handleInventoryWebhook(request: {
    body: EdgeFunctionEvent;
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: ProcessingResult;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Inventory webhook received', {
        eventType: request.body.eventType,
        organizationId: request.organizationId
      });

      const result = await this.webhookService.onInventoryEvent(request.body);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Inventory webhook failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/webhook/sales
   * Endpoint para webhook de vendas
   */
  async handleSalesWebhook(request: {
    body: EdgeFunctionEvent;
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: ProcessingResult;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Sales webhook received', {
        eventType: request.body.eventType,
        organizationId: request.organizationId
      });

      const result = await this.webhookService.onSalesEvent(request.body);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Sales webhook failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/webhook/purchase
   * Endpoint para webhook de compras
   */
  async handlePurchaseWebhook(request: {
    body: EdgeFunctionEvent;
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: ProcessingResult;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Purchase webhook received', {
        eventType: request.body.eventType,
        organizationId: request.organizationId
      });

      const result = await this.webhookService.onPurchaseEvent(request.body);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Purchase webhook failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/webhook/transfer
   * Endpoint para webhook de transferências
   */
  async handleTransferWebhook(request: {
    body: EdgeFunctionEvent;
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: ProcessingResult;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Transfer webhook received', {
        eventType: request.body.eventType,
        organizationId: request.organizationId
      });

      const result = await this.webhookService.onTransferEvent(request.body);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Transfer webhook failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * POST /api/modules/banban/data-processing/config
   * Atualiza configuração dos webhook listeners
   */
  async handleUpdateConfig(request: {
    body: {
      webhookConfig?: Partial<any>;
    };
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Updating configuration', {
        organizationId: request.organizationId
      });

      if (request.body.webhookConfig) {
        this.webhookService.updateConfig(request.body.webhookConfig);
      }

      const currentConfig = this.webhookService.getConfig();

      return {
        success: true,
        data: {
          message: 'Configuration updated successfully',
          currentConfig
        }
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to update configuration', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * DELETE /api/modules/banban/data-processing/cache
   * Limpa cache e métricas antigas
   */
  async handleClearCache(request: {
    organizationId: string;
  }): Promise<{
    success: boolean;
    data?: {
      message: string;
      clearedItems: number;
    };
    error?: string;
  }> {
    try {
      this.logger.info('data-processing', 'API: Clearing cache', {
        organizationId: request.organizationId
      });

      // Limpar fila de webhook
      const clearedFromQueue = this.webhookService.clearQueue();
      
      // Reset de métricas (apenas para testes/desenvolvimento)
      this.metricsService.resetMetrics();

      return {
        success: true,
        data: {
          message: 'Cache cleared successfully',
          clearedItems: clearedFromQueue
        }
      };

    } catch (error) {
      this.logger.error('data-processing', 'API: Failed to clear cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}