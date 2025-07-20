import { BanbanLogger, BanbanMetrics } from '../../index';
import {
  EdgeFunctionEvent,
  EventType,
  EdgeFunctionType,
  WebhookListenerConfig,
  ProcessingResult
} from '../types';
import { EventProcessingService } from './EventProcessingService';

/**
 * Serviço especializado para gerenciar webhook listeners das Edge Functions
 * Responsável por receber, filtrar e distribuir eventos para processamento
 */
export class WebhookListenerService {
  private logger: BanbanLogger;
  private processingService: EventProcessingService;
  private config: WebhookListenerConfig;
  private eventQueue: EdgeFunctionEvent[] = [];
  private isProcessing = false;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<WebhookListenerConfig>) {
    this.logger = BanbanLogger.getInstance();
    this.processingService = new EventProcessingService();
    
    // Configuração padrão
    this.config = {
      enableInventoryListener: true,
      enableSalesListener: true,
      enablePurchaseListener: true,
      enableTransferListener: true,
      batchProcessing: true,
      batchSize: 10,
      batchTimeout: 5000, // 5 segundos
      ...config
    };

    this.logger.info('data-processing', 'WebhookListenerService initialized', {
      config: this.config
    });
  }

  /**
   * Processa eventos do webhook-inventory-flow
   * Responsável por produtos e ajustes de estoque
   */
  async onInventoryEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.config.enableInventoryListener) {
        this.logger.warn('data-processing', 'Inventory listener is disabled', {
          eventType: event.eventType
        });
        return {
          success: false,
          eventId: 'disabled',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'LISTENER_DISABLED',
            message: 'Inventory listener is disabled',
            timestamp: new Date().toISOString()
          }]
        };
      }

      this.logger.info('data-processing', 'Processing inventory event', {
        eventType: event.eventType,
        organizationId: event.organizationId
      });

      // Validar tipos de evento suportados
      const supportedEvents = [
        EventType.PRODUCT_CREATED,
        EventType.PRODUCT_UPDATED,
        EventType.PRODUCT_DELETED,
        EventType.INVENTORY_ADJUSTMENT,
        EventType.INVENTORY_COUNT,
        EventType.INVENTORY_TRANSFER
      ];

      if (!supportedEvents.includes(event.eventType)) {
        this.logger.warn('data-processing', `Unsupported inventory event type: ${event.eventType}`);
        return {
          success: false,
          eventId: 'unsupported',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'UNSUPPORTED_EVENT_TYPE',
            message: `Unsupported inventory event type: ${event.eventType}`,
            timestamp: new Date().toISOString()
          }]
        };
      }

      // Processar evento
      const result = await this.processEventWithBatching(event, EdgeFunctionType.INVENTORY);

      // Registrar métricas específicas de inventário
      BanbanMetrics.record('data-processing', 'inventory_events_received', 1, {
        event_type: event.eventType,
        status: result.success ? 'success' : 'error'
      });

      return result;

    } catch (error) {
      this.logger.error('data-processing', 'Failed to process inventory event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      BanbanMetrics.record('data-processing', 'inventory_events_received', 1, {
        event_type: event.eventType,
        status: 'error'
      });

      return {
        success: false,
        eventId: 'error',
        processingTimeMs: Date.now() - startTime,
        triggeredActions: [],
        errors: [{
          code: 'INVENTORY_LISTENER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]
      };
    }
  }

  /**
   * Processa eventos do webhook-sales-flow
   * Responsável por vendas e devoluções
   */
  async onSalesEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.config.enableSalesListener) {
        this.logger.warn('data-processing', 'Sales listener is disabled', {
          eventType: event.eventType
        });
        return {
          success: false,
          eventId: 'disabled',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'LISTENER_DISABLED',
            message: 'Sales listener is disabled',
            timestamp: new Date().toISOString()
          }]
        };
      }

      this.logger.info('data-processing', 'Processing sales event', {
        eventType: event.eventType,
        organizationId: event.organizationId
      });

      // Validar tipos de evento suportados
      const supportedEvents = [
        EventType.SALE_COMPLETED,
        EventType.SALE_CANCELLED,
        EventType.RETURN_PROCESSED
      ];

      if (!supportedEvents.includes(event.eventType)) {
        this.logger.warn('data-processing', `Unsupported sales event type: ${event.eventType}`);
        return {
          success: false,
          eventId: 'unsupported',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'UNSUPPORTED_EVENT_TYPE',
            message: `Unsupported sales event type: ${event.eventType}`,
            timestamp: new Date().toISOString()
          }]
        };
      }

      // Processar evento
      const result = await this.processEventWithBatching(event, EdgeFunctionType.SALES);

      // Registrar métricas específicas de vendas
      BanbanMetrics.record('data-processing', 'sales_events_received', 1, {
        event_type: event.eventType,
        status: result.success ? 'success' : 'error'
      });

      return result;

    } catch (error) {
      this.logger.error('data-processing', 'Failed to process sales event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      BanbanMetrics.record('data-processing', 'sales_events_received', 1, {
        event_type: event.eventType,
        status: 'error'
      });

      return {
        success: false,
        eventId: 'error',
        processingTimeMs: Date.now() - startTime,
        triggeredActions: [],
        errors: [{
          code: 'SALES_LISTENER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]
      };
    }
  }

  /**
   * Processa eventos do webhook-purchase-flow
   * Responsável por compras e recebimentos
   */
  async onPurchaseEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.config.enablePurchaseListener) {
        this.logger.warn('data-processing', 'Purchase listener is disabled', {
          eventType: event.eventType
        });
        return {
          success: false,
          eventId: 'disabled',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'LISTENER_DISABLED',
            message: 'Purchase listener is disabled',
            timestamp: new Date().toISOString()
          }]
        };
      }

      this.logger.info('data-processing', 'Processing purchase event', {
        eventType: event.eventType,
        organizationId: event.organizationId
      });

      // Validar tipos de evento suportados
      const supportedEvents = [
        EventType.PURCHASE_COMPLETED,
        EventType.PURCHASE_CANCELLED,
        EventType.PURCHASE_RETURNED
      ];

      if (!supportedEvents.includes(event.eventType)) {
        this.logger.warn('data-processing', `Unsupported purchase event type: ${event.eventType}`);
        return {
          success: false,
          eventId: 'unsupported',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'UNSUPPORTED_EVENT_TYPE',
            message: `Unsupported purchase event type: ${event.eventType}`,
            timestamp: new Date().toISOString()
          }]
        };
      }

      // Processar evento
      const result = await this.processEventWithBatching(event, EdgeFunctionType.PURCHASE);

      // Registrar métricas específicas de compras
      BanbanMetrics.record('data-processing', 'purchase_events_received', 1, {
        event_type: event.eventType,
        status: result.success ? 'success' : 'error'
      });

      return result;

    } catch (error) {
      this.logger.error('data-processing', 'Failed to process purchase event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      BanbanMetrics.record('data-processing', 'purchase_events_received', 1, {
        event_type: event.eventType,
        status: 'error'
      });

      return {
        success: false,
        eventId: 'error',
        processingTimeMs: Date.now() - startTime,
        triggeredActions: [],
        errors: [{
          code: 'PURCHASE_LISTENER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]
      };
    }
  }

  /**
   * Processa eventos do webhook-transfer-flow
   * Responsável por transferências entre lojas
   */
  async onTransferEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.config.enableTransferListener) {
        this.logger.warn('data-processing', 'Transfer listener is disabled', {
          eventType: event.eventType
        });
        return {
          success: false,
          eventId: 'disabled',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'LISTENER_DISABLED',
            message: 'Transfer listener is disabled',
            timestamp: new Date().toISOString()
          }]
        };
      }

      this.logger.info('data-processing', 'Processing transfer event', {
        eventType: event.eventType,
        organizationId: event.organizationId
      });

      // Validar tipos de evento suportados
      const supportedEvents = [
        EventType.TRANSFER_INITIATED,
        EventType.TRANSFER_COMPLETED,
        EventType.TRANSFER_CANCELLED
      ];

      if (!supportedEvents.includes(event.eventType)) {
        this.logger.warn('data-processing', `Unsupported transfer event type: ${event.eventType}`);
        return {
          success: false,
          eventId: 'unsupported',
          processingTimeMs: Date.now() - startTime,
          triggeredActions: [],
          errors: [{
            code: 'UNSUPPORTED_EVENT_TYPE',
            message: `Unsupported transfer event type: ${event.eventType}`,
            timestamp: new Date().toISOString()
          }]
        };
      }

      // Processar evento
      const result = await this.processEventWithBatching(event, EdgeFunctionType.TRANSFER);

      // Registrar métricas específicas de transferências
      BanbanMetrics.record('data-processing', 'transfer_events_received', 1, {
        event_type: event.eventType,
        status: result.success ? 'success' : 'error'
      });

      return result;

    } catch (error) {
      this.logger.error('data-processing', 'Failed to process transfer event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      BanbanMetrics.record('data-processing', 'transfer_events_received', 1, {
        event_type: event.eventType,
        status: 'error'
      });

      return {
        success: false,
        eventId: 'error',
        processingTimeMs: Date.now() - startTime,
        triggeredActions: [],
        errors: [{
          code: 'TRANSFER_LISTENER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]
      };
    }
  }

  /**
   * Processa evento com lógica de batching opcional
   */
  private async processEventWithBatching(
    event: EdgeFunctionEvent, 
    edgeFunction: EdgeFunctionType
  ): Promise<ProcessingResult> {
    if (!this.config.batchProcessing) {
      // Processamento imediato
      return await this.processingService.processEvent(event);
    }

    // Adicionar à fila de batch
    this.eventQueue.push(event);
    
    this.logger.info('data-processing', 'Event added to batch queue', {
      eventType: event.eventType,
      queueSize: this.eventQueue.length,
      batchSize: this.config.batchSize
    });

    // Verificar se deve processar o batch
    if (this.eventQueue.length >= this.config.batchSize) {
      return await this.processBatch();
    }

    // Configurar timer para batch timeout
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(async () => {
        if (this.eventQueue.length > 0) {
          await this.processBatch();
        }
      }, this.config.batchTimeout);
    }

    // Retornar resultado provisório para o evento atual
    return {
      success: true,
      eventId: 'batched',
      processingTimeMs: 0,
      triggeredActions: ['added_to_batch'],
      metadata: {
        batchMode: true,
        queueSize: this.eventQueue.length
      }
    };
  }

  /**
   * Processa batch de eventos
   */
  private async processBatch(): Promise<ProcessingResult> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return {
        success: false,
        eventId: 'batch_skip',
        processingTimeMs: 0,
        triggeredActions: [],
        errors: [{
          code: 'BATCH_SKIP',
          message: 'Batch processing already in progress or queue is empty',
          timestamp: new Date().toISOString()
        }]
      };
    }

    this.isProcessing = true;
    
    // Limpar timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batchEvents = [...this.eventQueue];
    this.eventQueue = [];

    try {
      this.logger.info('data-processing', 'Processing event batch', {
        batchSize: batchEvents.length
      });

      const results = await this.processingService.processBatch(batchEvents);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      this.logger.info('data-processing', 'Batch processing completed', {
        totalEvents: batchEvents.length,
        successfulEvents: successCount,
        failedEvents: failureCount
      });

      // Registrar métricas de batch
      BanbanMetrics.record('data-processing', 'batch_processed', 1, {
        batch_size: batchEvents.length.toString(),
        success_rate: ((successCount / batchEvents.length) * 100).toString()
      });

      return {
        success: failureCount === 0,
        eventId: 'batch',
        processingTimeMs: 0, // Será calculado individualmente
        triggeredActions: [`batch_processed_${batchEvents.length}_events`],
        metadata: {
          batchSize: batchEvents.length,
          successCount,
          failureCount,
          results
        }
      };

    } catch (error) {
      this.logger.error('data-processing', 'Batch processing failed', {
        batchSize: batchEvents.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        eventId: 'batch_error',
        processingTimeMs: 0,
        triggeredActions: [],
        errors: [{
          code: 'BATCH_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          context: { batchSize: batchEvents.length }
        }]
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Atualiza configuração dos listeners
   */
  updateConfig(newConfig: Partial<WebhookListenerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logger.info('data-processing', 'Webhook listener configuration updated', {
      config: this.config
    });
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): WebhookListenerConfig {
    return { ...this.config };
  }

  /**
   * Obtém estatísticas dos listeners
   */
  getStats(): {
    queueSize: number;
    isProcessing: boolean;
    hasBatchTimer: boolean;
    config: WebhookListenerConfig;
  } {
    return {
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
      hasBatchTimer: this.batchTimer !== null,
      config: this.config
    };
  }

  /**
   * Força processamento do batch atual
   */
  async flushBatch(): Promise<ProcessingResult> {
    if (this.eventQueue.length === 0) {
      return {
        success: true,
        eventId: 'flush_empty',
        processingTimeMs: 0,
        triggeredActions: ['batch_flush_empty']
      };
    }

    return await this.processBatch();
  }

  /**
   * Limpa a fila de eventos (usado para testes ou emergências)
   */
  clearQueue(): number {
    const queueSize = this.eventQueue.length;
    this.eventQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.logger.warn('data-processing', 'Event queue cleared', {
      clearedEvents: queueSize
    });

    return queueSize;
  }

  /**
   * Shutdown graceful do serviço
   */
  async shutdown(): Promise<void> {
    this.logger.info('data-processing', 'Shutting down webhook listener service');

    // Processar eventos restantes na fila
    if (this.eventQueue.length > 0) {
      await this.flushBatch();
    }

    // Limpar timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.logger.info('data-processing', 'Webhook listener service shutdown completed');
  }
}