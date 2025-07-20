import { BanbanLogger, BanbanMetrics } from '../../index';
import {
  EdgeFunctionEvent,
  ProcessingResult,
  ProcessingError,
  EventType,
  EdgeFunctionType,
  ProcessingStatus,
  PROCESSING_PRIORITIES,
  EVENT_TO_EDGE_FUNCTION
} from '../types';
import { EventValidationService } from './EventValidationService';

/**
 * Serviço especializado para processamento de eventos das Edge Functions
 * Responsável pela lógica de negócio e coordenação com outros módulos
 */
export class EventProcessingService {
  private logger: BanbanLogger;
  private validationService: EventValidationService;
  private processingQueue: Map<string, EdgeFunctionEvent> = new Map();
  private processingStatus: Map<string, ProcessingStatus> = new Map();

  constructor() {
    this.logger = BanbanLogger.getInstance();
    this.validationService = new EventValidationService();
  }

  /**
   * Processa um evento completo com validação e lógica de negócio
   */
  async processEvent(event: EdgeFunctionEvent): Promise<ProcessingResult> {
    const startTime = Date.now();
    const eventId = this.generateEventId(event);
    const triggeredActions: string[] = [];
    const errors: ProcessingError[] = [];

    try {
      this.logger.info('data-processing', 'Starting event processing', {
        eventId,
        eventType: event.eventType,
        organizationId: event.organizationId
      });

      // Marcar como processando
      this.processingStatus.set(eventId, ProcessingStatus.PROCESSING);

      // 1. Validação do evento
      const validationResult = await this.validationService.validateEvent(event);
      if (!validationResult.isValid) {
        const validationErrors = validationResult.errors.map(err => ({
          code: err.code,
          message: err.message,
          timestamp: new Date().toISOString(),
          context: { field: err.field }
        }));
        
        errors.push(...validationErrors);
        this.processingStatus.set(eventId, ProcessingStatus.FAILED);
        
        return {
          success: false,
          eventId,
          processingTimeMs: Date.now() - startTime,
          triggeredActions,
          errors
        };
      }

      // 2. Processar baseado no tipo de Edge Function
      const edgeFunction = EVENT_TO_EDGE_FUNCTION[event.eventType];
      const processingResult = await this.processEventByType(event, edgeFunction);
      
      triggeredActions.push(...processingResult.triggeredActions);
      if (processingResult.errors) {
        errors.push(...processingResult.errors);
      }

      // 3. Registrar métricas de sucesso
      const processingTime = Date.now() - startTime;
      BanbanMetrics.record('data-processing', 'events_processed', 1, {
        event_type: event.eventType,
        edge_function: edgeFunction,
        status: 'success'
      });

      BanbanMetrics.record('data-processing', 'processing_time', processingTime, {
        event_type: event.eventType
      });

      this.processingStatus.set(eventId, ProcessingStatus.COMPLETED);

      this.logger.info('data-processing', 'Event processing completed successfully', {
        eventId,
        eventType: event.eventType,
        processingTimeMs: processingTime,
        triggeredActions: triggeredActions.length
      });

      return {
        success: true,
        eventId,
        processingTimeMs: processingTime,
        triggeredActions,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          edgeFunction,
          priority: PROCESSING_PRIORITIES[event.eventType],
          validationWarnings: validationResult.warnings.length
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('data-processing', 'Event processing failed', {
        eventId,
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: processingTime
      });

      errors.push({
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown processing error',
        timestamp: new Date().toISOString(),
        context: { eventType: event.eventType }
      });

      // Registrar métricas de erro
      BanbanMetrics.record('data-processing', 'events_processed', 1, {
        event_type: event.eventType,
        status: 'error'
      });

      this.processingStatus.set(eventId, ProcessingStatus.FAILED);

      return {
        success: false,
        eventId,
        processingTimeMs: processingTime,
        triggeredActions,
        errors
      };
    }
  }

  /**
   * Processa múltiplos eventos em lote
   */
  async processBatch(events: EdgeFunctionEvent[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    // Ordenar eventos por prioridade
    const sortedEvents = this.sortEventsByPriority(events);
    
    this.logger.info('data-processing', 'Starting batch processing', {
      totalEvents: events.length,
      highPriorityEvents: sortedEvents.filter(e => PROCESSING_PRIORITIES[e.eventType] >= 8).length
    });

    for (const event of sortedEvents) {
      const result = await this.processEvent(event);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    this.logger.info('data-processing', 'Batch processing completed', {
      totalEvents: events.length,
      successfulEvents: successCount,
      failedEvents: failureCount
    });

    return results;
  }

  /**
   * Processa evento baseado no tipo de Edge Function
   */
  private async processEventByType(
    event: EdgeFunctionEvent, 
    edgeFunction: EdgeFunctionType
  ): Promise<{ triggeredActions: string[]; errors?: ProcessingError[] }> {
    const triggeredActions: string[] = [];
    const errors: ProcessingError[] = [];

    try {
      switch (edgeFunction) {
        case EdgeFunctionType.INVENTORY:
          return await this.processInventoryEvent(event);
        case EdgeFunctionType.SALES:
          return await this.processSalesEvent(event);
        case EdgeFunctionType.PURCHASE:
          return await this.processPurchaseEvent(event);
        case EdgeFunctionType.TRANSFER:
          return await this.processTransferEvent(event);
        default:
          errors.push({
            code: 'UNKNOWN_EDGE_FUNCTION',
            message: `Unknown edge function: ${edgeFunction}`,
            timestamp: new Date().toISOString(),
            context: { edgeFunction }
          });
          return { triggeredActions, errors };
      }
    } catch (error) {
      errors.push({
        code: 'EDGE_FUNCTION_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        context: { edgeFunction, eventType: event.eventType }
      });
      return { triggeredActions, errors };
    }
  }

  /**
   * Processa eventos de inventário
   */
  private async processInventoryEvent(event: EdgeFunctionEvent): Promise<{
    triggeredActions: string[]; 
    errors?: ProcessingError[];
  }> {
    const triggeredActions: string[] = [];
    const errors: ProcessingError[] = [];

    try {
      switch (event.eventType) {
        case EventType.PRODUCT_CREATED:
        case EventType.PRODUCT_UPDATED:
          await this.processProductEvent(event);
          triggeredActions.push('product_insights_analysis');
          triggeredActions.push('category_analysis_update');
          break;

        case EventType.INVENTORY_ADJUSTMENT:
          await this.processInventoryAdjustment(event);
          triggeredActions.push('stock_level_alert_check');
          triggeredActions.push('reorder_point_analysis');
          break;

        case EventType.INVENTORY_COUNT:
          await this.processInventoryCount(event);
          triggeredActions.push('variance_analysis');
          triggeredActions.push('accuracy_metrics_update');
          break;

        case EventType.INVENTORY_TRANSFER:
          await this.processInventoryTransfer(event);
          triggeredActions.push('distribution_optimization');
          triggeredActions.push('transfer_efficiency_analysis');
          break;

        default:
          errors.push({
            code: 'UNKNOWN_INVENTORY_EVENT',
            message: `Unknown inventory event type: ${event.eventType}`,
            timestamp: new Date().toISOString(),
            context: { eventType: event.eventType }
          });
      }

      return { triggeredActions, errors: errors.length > 0 ? errors : undefined };

    } catch (error) {
      errors.push({
        code: 'INVENTORY_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        context: { eventType: event.eventType }
      });
      return { triggeredActions, errors };
    }
  }

  /**
   * Processa eventos de vendas
   */
  private async processSalesEvent(event: EdgeFunctionEvent): Promise<{
    triggeredActions: string[]; 
    errors?: ProcessingError[];
  }> {
    const triggeredActions: string[] = [];
    const errors: ProcessingError[] = [];

    try {
      switch (event.eventType) {
        case EventType.SALE_COMPLETED:
          await this.processSaleCompleted(event);
          triggeredActions.push('margin_analysis');
          triggeredActions.push('customer_behavior_analysis');
          triggeredActions.push('sales_performance_update');
          triggeredActions.push('inventory_impact_calculation');
          break;

        case EventType.SALE_CANCELLED:
          await this.processSaleCancelled(event);
          triggeredActions.push('cancellation_analysis');
          triggeredActions.push('inventory_reversal');
          break;

        case EventType.RETURN_PROCESSED:
          await this.processReturnProcessed(event);
          triggeredActions.push('return_pattern_analysis');
          triggeredActions.push('quality_issue_detection');
          break;

        default:
          errors.push({
            code: 'UNKNOWN_SALES_EVENT',
            message: `Unknown sales event type: ${event.eventType}`,
            timestamp: new Date().toISOString(),
            context: { eventType: event.eventType }
          });
      }

      return { triggeredActions, errors: errors.length > 0 ? errors : undefined };

    } catch (error) {
      errors.push({
        code: 'SALES_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        context: { eventType: event.eventType }
      });
      return { triggeredActions, errors };
    }
  }

  /**
   * Processa eventos de compras
   */
  private async processPurchaseEvent(event: EdgeFunctionEvent): Promise<{
    triggeredActions: string[]; 
    errors?: ProcessingError[];
  }> {
    const triggeredActions: string[] = [];
    const errors: ProcessingError[] = [];

    try {
      switch (event.eventType) {
        case EventType.PURCHASE_COMPLETED:
          await this.processPurchaseCompleted(event);
          triggeredActions.push('supplier_performance_analysis');
          triggeredActions.push('cost_analysis_update');
          triggeredActions.push('inventory_forecasting_update');
          break;

        case EventType.PURCHASE_CANCELLED:
          await this.processPurchaseCancelled(event);
          triggeredActions.push('supplier_reliability_analysis');
          triggeredActions.push('demand_forecast_adjustment');
          break;

        case EventType.PURCHASE_RETURNED:
          await this.processPurchaseReturned(event);
          triggeredActions.push('quality_issue_analysis');
          triggeredActions.push('supplier_quality_metrics');
          break;

        default:
          errors.push({
            code: 'UNKNOWN_PURCHASE_EVENT',
            message: `Unknown purchase event type: ${event.eventType}`,
            timestamp: new Date().toISOString(),
            context: { eventType: event.eventType }
          });
      }

      return { triggeredActions, errors: errors.length > 0 ? errors : undefined };

    } catch (error) {
      errors.push({
        code: 'PURCHASE_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        context: { eventType: event.eventType }
      });
      return { triggeredActions, errors };
    }
  }

  /**
   * Processa eventos de transferência
   */
  private async processTransferEvent(event: EdgeFunctionEvent): Promise<{
    triggeredActions: string[]; 
    errors?: ProcessingError[];
  }> {
    const triggeredActions: string[] = [];
    const errors: ProcessingError[] = [];

    try {
      switch (event.eventType) {
        case EventType.TRANSFER_INITIATED:
          await this.processTransferInitiated(event);
          triggeredActions.push('transfer_tracking_setup');
          triggeredActions.push('eta_calculation');
          break;

        case EventType.TRANSFER_COMPLETED:
          await this.processTransferCompleted(event);
          triggeredActions.push('distribution_efficiency_analysis');
          triggeredActions.push('store_balance_optimization');
          triggeredActions.push('transfer_performance_metrics');
          break;

        case EventType.TRANSFER_CANCELLED:
          await this.processTransferCancelled(event);
          triggeredActions.push('cancellation_reason_analysis');
          triggeredActions.push('alternative_distribution_planning');
          break;

        default:
          errors.push({
            code: 'UNKNOWN_TRANSFER_EVENT',
            message: `Unknown transfer event type: ${event.eventType}`,
            timestamp: new Date().toISOString(),
            context: { eventType: event.eventType }
          });
      }

      return { triggeredActions, errors: errors.length > 0 ? errors : undefined };

    } catch (error) {
      errors.push({
        code: 'TRANSFER_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        context: { eventType: event.eventType }
      });
      return { triggeredActions, errors };
    }
  }

  // ================================================
  // MÉTODOS DE PROCESSAMENTO ESPECÍFICOS
  // ================================================

  private async processProductEvent(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing product event for advanced analytics', {
      sku: event.data.sku,
      name: event.data.name,
      category: event.data.category
    });

    // Integração futura com módulo insights para análise de produtos
    // Análise de categorização automática
    // Detecção de produtos similares
    // Previsão de demanda inicial
  }

  private async processInventoryAdjustment(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing inventory adjustment for alert analysis', {
      productSku: event.data.product_sku,
      quantity: event.data.quantity,
      movementType: event.data.movement_type
    });

    // Integração futura com módulo alerts para:
    // Verificação de estoque baixo
    // Análise de variações significativas
    // Detecção de padrões anômalos
  }

  private async processInventoryCount(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing inventory count for accuracy analysis', {
      productSku: event.data.product_sku,
      countedQuantity: event.data.quantity
    });

    // Análise de precisão do inventário
    // Cálculo de variações
    // Métricas de acuracidade por loja
  }

  private async processInventoryTransfer(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing inventory transfer for optimization', {
      fromStore: event.data.transfer?.from_store_id,
      toStore: event.data.transfer?.to_store_id,
      itemsCount: event.data.transfer?.items?.length
    });

    // Análise de eficiência de distribuição
    // Otimização de rotas de transferência
    // Balanceamento de estoque entre lojas
  }

  private async processSaleCompleted(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing sale completion for comprehensive analysis', {
      saleId: event.data.sale?.sale_id,
      totalAmount: event.data.sale?.total_amount,
      itemsCount: event.data.sale?.items?.length
    });

    // Integração com módulo insights para:
    // Análise de margem de lucro
    // Padrões de comportamento do cliente
    // Performance de vendas por produto/categoria
    // Impacto no estoque
  }

  private async processSaleCancelled(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing sale cancellation for pattern analysis', {
      saleId: event.data.sale?.sale_id,
      reason: event.data.reference_document
    });

    // Análise de padrões de cancelamento
    // Ajuste de métricas de performance
    // Reversão de impacto no estoque
  }

  private async processReturnProcessed(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing return for quality analysis', {
      saleId: event.data.sale?.sale_id,
      returnedItems: event.data.sale?.items?.length
    });

    // Análise de padrões de devolução
    // Detecção de problemas de qualidade
    // Métricas de satisfação do cliente
  }

  private async processPurchaseCompleted(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing purchase completion for supplier analysis', {
      purchaseId: event.data.purchase?.purchase_id,
      supplierId: event.data.purchase?.supplier_id,
      totalAmount: event.data.purchase?.total_amount
    });

    // Análise de performance de fornecedores
    // Atualização de custos e margens
    // Previsão de estoque futuro
  }

  private async processPurchaseCancelled(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing purchase cancellation for reliability analysis', {
      purchaseId: event.data.purchase?.purchase_id,
      supplierId: event.data.purchase?.supplier_id
    });

    // Análise de confiabilidade do fornecedor
    // Ajuste de previsões de demanda
    // Impacto no planejamento de compras
  }

  private async processPurchaseReturned(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing purchase return for quality metrics', {
      purchaseId: event.data.purchase?.purchase_id,
      supplierId: event.data.purchase?.supplier_id
    });

    // Análise de qualidade de produtos recebidos
    // Métricas de qualidade por fornecedor
    // Detecção de problemas recorrentes
  }

  private async processTransferInitiated(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing transfer initiation for tracking setup', {
      transferId: event.data.transfer?.transfer_id,
      fromStore: event.data.transfer?.from_store_id,
      toStore: event.data.transfer?.to_store_id
    });

    // Setup de rastreamento de transferência
    // Cálculo de ETA
    // Notificações de progresso
  }

  private async processTransferCompleted(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing transfer completion for efficiency analysis', {
      transferId: event.data.transfer?.transfer_id,
      itemsTransferred: event.data.transfer?.items?.length
    });

    // Análise de eficiência de distribuição
    // Otimização de balanceamento de estoque
    // Métricas de performance de transferência
  }

  private async processTransferCancelled(event: EdgeFunctionEvent): Promise<void> {
    this.logger.info('data-processing', 'Processing transfer cancellation for reason analysis', {
      transferId: event.data.transfer?.transfer_id,
      reason: event.data.reference_document
    });

    // Análise de motivos de cancelamento
    // Planejamento de distribuição alternativa
    // Impacto no balanceamento de estoque
  }

  // ================================================
  // MÉTODOS UTILITÁRIOS
  // ================================================

  /**
   * Gera ID único para o evento
   */
  private generateEventId(event: EdgeFunctionEvent): string {
    const timestamp = new Date(event.timestamp).getTime();
    const hash = this.simpleHash(`${event.eventType}-${event.organizationId}-${timestamp}`);
    return `evt_${hash}`;
  }

  /**
   * Hash simples para geração de IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Ordena eventos por prioridade
   */
  private sortEventsByPriority(events: EdgeFunctionEvent[]): EdgeFunctionEvent[] {
    return events.sort((a, b) => {
      const priorityA = PROCESSING_PRIORITIES[a.eventType] || 0;
      const priorityB = PROCESSING_PRIORITIES[b.eventType] || 0;
      return priorityB - priorityA; // Ordem decrescente (maior prioridade primeiro)
    });
  }

  /**
   * Obtém status de processamento de um evento
   */
  getProcessingStatus(eventId: string): ProcessingStatus | undefined {
    return this.processingStatus.get(eventId);
  }

  /**
   * Limpa status de processamento antigos
   */
  cleanupOldStatuses(maxAge: number = 3600000): void { // 1 hora
    const cutoff = Date.now() - maxAge;
    const toDelete: string[] = [];

    for (const [eventId, status] of this.processingStatus.entries()) {
      // Assumir que IDs começam com timestamp
      try {
        const eventTime = parseInt(eventId.split('_')[1], 16);
        if (eventTime < cutoff) {
          toDelete.push(eventId);
        }
      } catch {
        // Se não conseguir extrair timestamp, manter o status
      }
    }

    toDelete.forEach(eventId => {
      this.processingStatus.delete(eventId);
      this.processingQueue.delete(eventId);
    });

    if (toDelete.length > 0) {
      this.logger.info('data-processing', 'Cleaned up old processing statuses', {
        cleanedCount: toDelete.length
      });
    }
  }
}