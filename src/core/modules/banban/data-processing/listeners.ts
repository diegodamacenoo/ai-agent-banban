import { BanbanLogger, BanbanMetrics, EdgeFunctionEvent } from '../index';
import { generateInsights } from '../insights/engine';
import { processAlerts } from '../../banban-backup/alerts-backup/processor';
import { getLogger } from '@/shared/utils/logger';

const logger = getLogger();

// Interface para representar um handler ativo
export interface ActiveEventHandler {
  enabled: boolean;
  handler: (event: EdgeFunctionEvent) => Promise<void>;
  retryCount?: number;
  lastProcessed?: Date;
}

/**
 * Sistema de processamento ativo de eventos para módulos Banban
 * 
 * Este sistema processa eventos em tempo real das Edge Functions,
 * disparando análises e alertas conforme necessário.
 */
export class BanbanActiveListeners {
  private static instance: BanbanActiveListeners;
  private handlers: Map<string, ActiveEventHandler> = new Map();
  private processing: Set<string> = new Set();

  private constructor() {
    this.initializeHandlers();
  }

  static getInstance(): BanbanActiveListeners {
    if (!BanbanActiveListeners.instance) {
      BanbanActiveListeners.instance = new BanbanActiveListeners();
    }
    return BanbanActiveListeners.instance;
  }

  /**
   * Inicializa todos os handlers de eventos
   */
  private initializeHandlers(): void {
    this.handlers.set('inventory.adjustment', {
      enabled: true,
      handler: this.handleInventoryAdjustment.bind(this)
    });

    this.handlers.set('inventory.product_created', {
      enabled: true,
      handler: this.handleProductCreated.bind(this)
    });

    this.handlers.set('inventory.product_updated', {
      enabled: true,
      handler: this.handleProductUpdated.bind(this)
    });

    this.handlers.set('sales.sale_completed', {
      enabled: true,
      handler: this.handleSaleCompleted.bind(this)
    });

    this.handlers.set('sales.sale_cancelled', {
      enabled: true,
      handler: this.handleSaleCancelled.bind(this)
    });

    this.handlers.set('sales.return_processed', {
      enabled: true,
      handler: this.handleReturnProcessed.bind(this)
    });

    this.handlers.set('purchase.purchase_completed', {
      enabled: true,
      handler: this.handlePurchaseCompleted.bind(this)
    });

    this.handlers.set('purchase.purchase_cancelled', {
      enabled: true,
      handler: this.handlePurchaseCancelled.bind(this)
    });

    this.handlers.set('purchase.purchase_returned', {
      enabled: true,
      handler: this.handlePurchaseReturned.bind(this)
    });

    this.handlers.set('transfer.transfer_initiated', {
      enabled: true,
      handler: this.handleTransferInitiated.bind(this)
    });

    this.handlers.set('transfer.transfer_completed', {
      enabled: true,
      handler: this.handleTransferCompleted.bind(this)
    });

    this.handlers.set('transfer.transfer_cancelled', {
      enabled: true,
      handler: this.handleTransferCancelled.bind(this)
    });
  }

  /**
   * Processa um evento da Edge Function
   */
  async processEvent(event: EdgeFunctionEvent): Promise<void> {
    const eventKey = `${event.eventType}_${event.organizationId}_${Date.now()}`;
    
    if (this.processing.has(eventKey)) {
      logger.warn('banban-listeners', 'Event already processing', { eventType: event.eventType });
      return;
    }

    this.processing.add(eventKey);

    try {
      const handler = this.handlers.get(event.eventType);
      
      if (!handler) {
        logger.warn('banban-listeners', 'No handler found for event type', { eventType: event.eventType });
        return;
      }

      if (!handler.enabled) {
        logger.debug('banban-listeners', 'Handler disabled for event type', { eventType: event.eventType });
        return;
      }

      BanbanMetrics.record('listeners', 'event_processed', 1, {
        eventType: event.eventType,
        organizationId: event.organizationId
      });

      await handler.handler(event);

      // Atualizar estatísticas do handler
      handler.lastProcessed = new Date();
      handler.retryCount = 0;

    } catch (error) {
      logger.error('banban-listeners', 'Error processing event', {
        eventType: event.eventType,
        organizationId: event.organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Incrementar contador de retry
      const handler = this.handlers.get(event.eventType);
      if (handler) {
        handler.retryCount = (handler.retryCount || 0) + 1;
      }

      BanbanMetrics.record('listeners', 'event_error', 1, {
        eventType: event.eventType,
        organizationId: event.organizationId
      });

      throw error;

    } finally {
      this.processing.delete(eventKey);
    }
  }

  // ========== INVENTORY EVENT HANDLERS ==========

  private async handleInventoryAdjustment(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing inventory adjustment', { organizationId: event.organizationId });

    // Disparar análises de estoque
    await this.triggerStockAnalysis(event.organizationId);
    await this.triggerStockAlerts(event.organizationId);
  }

  private async handleProductCreated(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing new product creation', { organizationId: event.organizationId });

    // Disparar análise para produtos novos
    await this.triggerNewProductAnalysis(event.organizationId);
  }

  private async handleProductUpdated(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing product update', { organizationId: event.organizationId });

    // Disparar análise de alterações
    await this.triggerProductChangeAnalysis(event.organizationId);
  }

  // ========== SALES EVENT HANDLERS ==========

  private async handleSaleCompleted(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing sale completion', { organizationId: event.organizationId });

    // Disparar análises de margem e performance
    await this.triggerMarginAnalysis(event.organizationId);
    await this.triggerPerformanceAnalysis(event.organizationId);
    
    // Atualizar análises de slow-movers
    await this.triggerSlowMoverAnalysis(event.organizationId);
  }

  private async handleSaleCancelled(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing sale cancellation', { organizationId: event.organizationId });

    // Reverter análises se necessário
    await this.triggerSaleCancellationAnalysis(event.organizationId);
  }

  private async handleReturnProcessed(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing return', { organizationId: event.organizationId });

    // Disparar análises de devoluções
    await this.triggerReturnAnalysis(event.organizationId);
  }

  // ========== PURCHASE EVENT HANDLERS ==========

  private async handlePurchaseCompleted(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing purchase completion', { organizationId: event.organizationId });

    // Disparar análises de fornecedores
    await this.triggerSupplierAnalysis(event.organizationId);
    
    // Atualizar análises de reposição
    await this.triggerReplenishmentAnalysis(event.organizationId);
  }

  private async handlePurchaseCancelled(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing purchase cancellation', { organizationId: event.organizationId });

    // Reverter análises de compra
    await this.triggerPurchaseCancellationAnalysis(event.organizationId);
  }

  private async handlePurchaseReturned(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing purchase return', { organizationId: event.organizationId });

    // Disparar análises de devolução para fornecedor
    await this.triggerPurchaseReturnAnalysis(event.organizationId);
  }

  // ========== TRANSFER EVENT HANDLERS ==========

  private async handleTransferInitiated(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing transfer initiation', { organizationId: event.organizationId });

    // Disparar análises de distribuição
    await this.triggerDistributionAnalysis(event.organizationId);
  }

  private async handleTransferCompleted(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing transfer completion', { organizationId: event.organizationId });

    // Atualizar análises de estoque entre lojas
    await this.triggerStoreBalancingAnalysis(event.organizationId);
  }

  private async handleTransferCancelled(event: EdgeFunctionEvent): Promise<void> {
    logger.info('banban-listeners', 'Processing transfer cancellation', { organizationId: event.organizationId });

    // Reverter análises de transferência
    await this.triggerTransferCancellationAnalysis(event.organizationId);
  }

  // ========== ANALYSIS TRIGGERS ==========

  private async triggerStockAnalysis(organizationId: string): Promise<void> {
    try {
      await generateInsights(organizationId, 'stock_analysis');
      await processAlerts(organizationId, 'low_stock');
    } catch (error) {
      logger.error('banban-listeners', 'Error in stock analysis', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async triggerStockAlerts(organizationId: string): Promise<void> {
    try {
      await processAlerts(organizationId, 'critical_stock');
    } catch (error) {
      logger.error('banban-listeners', 'Error in stock alerts', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async triggerMarginAnalysis(organizationId: string): Promise<void> {
    try {
      await generateInsights(organizationId, 'margin_analysis');
      await processAlerts(organizationId, 'low_margin');
    } catch (error) {
      logger.error('banban-listeners', 'Error in margin analysis', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async triggerPerformanceAnalysis(organizationId: string): Promise<void> {
    try {
      await generateInsights(organizationId, 'performance_analysis');
    } catch (error) {
      logger.error('banban-listeners', 'Error in performance analysis', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async triggerSlowMoverAnalysis(organizationId: string): Promise<void> {
    try {
      await generateInsights(organizationId, 'slow_mover_analysis');
      await processAlerts(organizationId, 'slow_moving');
    } catch (error) {
      logger.error('banban-listeners', 'Error in slow mover analysis', {
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Placeholder methods for additional analyses
  private async triggerNewProductAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de produtos novos
    logger.debug('banban-listeners', 'New product analysis triggered', { organizationId });
  }

  private async triggerProductChangeAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de alterações
    logger.debug('banban-listeners', 'Product change analysis triggered', { organizationId });
  }

  private async triggerSaleCancellationAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de cancelamentos
    logger.debug('banban-listeners', 'Sale cancellation analysis triggered', { organizationId });
  }

  private async triggerReturnAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de devoluções
    logger.debug('banban-listeners', 'Return analysis triggered', { organizationId });
  }

  private async triggerSupplierAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de fornecedores
    logger.debug('banban-listeners', 'Supplier analysis triggered', { organizationId });
  }

  private async triggerReplenishmentAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de reposição
    logger.debug('banban-listeners', 'Replenishment analysis triggered', { organizationId });
  }

  private async triggerPurchaseCancellationAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de cancelamentos de compra
    logger.debug('banban-listeners', 'Purchase cancellation analysis triggered', { organizationId });
  }

  private async triggerPurchaseReturnAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de devoluções para fornecedor
    logger.debug('banban-listeners', 'Purchase return analysis triggered', { organizationId });
  }

  private async triggerDistributionAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de distribuição
    logger.debug('banban-listeners', 'Distribution analysis triggered', { organizationId });
  }

  private async triggerStoreBalancingAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de balanceamento entre lojas
    logger.debug('banban-listeners', 'Store balancing analysis triggered', { organizationId });
  }

  private async triggerTransferCancellationAnalysis(organizationId: string): Promise<void> {
    // TODO: Implementar análise de cancelamento de transferência
    logger.debug('banban-listeners', 'Transfer cancellation analysis triggered', { organizationId });
  }

  // ========== MANAGEMENT METHODS ==========

  /**
   * Obtém o status de todos os handlers
   */
  getHandlersStatus(): Record<string, { enabled: boolean; lastProcessed?: Date; retryCount?: number }> {
    const status: Record<string, { enabled: boolean; lastProcessed?: Date; retryCount?: number }> = {};
    
    for (const [eventType, handler] of this.handlers.entries()) {
      status[eventType] = {
        enabled: handler.enabled,
        lastProcessed: handler.lastProcessed,
        retryCount: handler.retryCount
      };
    }
    
    return status;
  }

  /**
   * Ativa ou desativa um handler específico
   */
  toggleHandler(eventType: string, enabled: boolean): boolean {
    const handler = this.handlers.get(eventType);
    if (handler) {
      handler.enabled = enabled;
      logger.info('banban-listeners', `Handler ${enabled ? 'enabled' : 'disabled'}`, { eventType });
      return true;
    }
    
    logger.warn('banban-listeners', 'Handler not found', { eventType });
    return false;
  }

  /**
   * Obtém eventos atualmente sendo processados
   */
  getProcessingEvents(): string[] {
    return Array.from(this.processing);
  }
}

export default BanbanActiveListeners; 