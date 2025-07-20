import { BanbanLogger } from '../../index';
import {
  EdgeFunctionEvent,
  EventValidationResult,
  ValidationError,
  ValidationWarning,
  EventType,
  EdgeFunctionType,
  productEventSchema,
  movementEventSchema,
  saleEventSchema,
  purchaseEventSchema,
  transferEventSchema,
  EVENT_TO_EDGE_FUNCTION
} from '../types';

/**
 * Serviço especializado para validação de eventos das Edge Functions
 * Responsável por validar estrutura, dados e regras de negócio
 */
export class EventValidationService {
  private logger: BanbanLogger;
  private readonly MAX_EVENT_AGE = 300000; // 5 minutos
  private readonly MIN_EVENT_AGE = 1000; // 1 segundo

  constructor() {
    this.logger = BanbanLogger.getInstance();
  }

  /**
   * Valida um evento completo com todas as regras
   */
  async validateEvent(event: EdgeFunctionEvent): Promise<EventValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validações básicas obrigatórias
      this.validateBasicStructure(event, errors);
      this.validateEventAge(event, errors, warnings);
      this.validateOrganizationId(event, errors);
      
      // Validações específicas por tipo de evento
      await this.validateEventTypeSpecific(event, errors, warnings);
      
      // Validações de regras de negócio
      this.validateBusinessRules(event, errors, warnings);
      
      // Validações de dados específicos do Banban
      this.validateBanbanSpecificData(event, warnings);

      const isValid = errors.length === 0;
      
      this.logger.info('data-processing', 'Event validation completed', {
        eventType: event.eventType,
        isValid,
        errorsCount: errors.length,
        warningsCount: warnings.length
      });

      return {
        isValid,
        errors,
        warnings
      };

    } catch (error) {
      this.logger.error('data-processing', 'Event validation failed', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      errors.push({
        field: 'validation',
        message: 'Validation process failed',
        code: 'VALIDATION_ERROR'
      });

      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Valida múltiplos eventos em lote
   */
  async validateBatch(events: EdgeFunctionEvent[]): Promise<EventValidationResult[]> {
    const results: EventValidationResult[] = [];
    
    for (const event of events) {
      const result = await this.validateEvent(event);
      results.push(result);
    }

    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;

    this.logger.info('data-processing', 'Batch validation completed', {
      totalEvents: events.length,
      validEvents: validCount,
      invalidEvents: invalidCount
    });

    return results;
  }

  /**
   * Valida apenas a estrutura básica (validação rápida)
   */
  validateQuick(event: EdgeFunctionEvent): boolean {
    try {
      return !!(
        event &&
        event.eventType &&
        event.organizationId &&
        event.timestamp &&
        event.data &&
        Object.values(EventType).includes(event.eventType)
      );
    } catch {
      return false;
    }
  }

  /**
   * Valida estrutura básica do evento
   */
  private validateBasicStructure(event: EdgeFunctionEvent, errors: ValidationError[]): void {
    if (!event) {
      errors.push({
        field: 'event',
        message: 'Event object is required',
        code: 'MISSING_EVENT'
      });
      return;
    }

    if (!event.eventType) {
      errors.push({
        field: 'eventType',
        message: 'Event type is required',
        code: 'MISSING_EVENT_TYPE'
      });
    } else if (!Object.values(EventType).includes(event.eventType)) {
      errors.push({
        field: 'eventType',
        message: `Invalid event type: ${event.eventType}`,
        code: 'INVALID_EVENT_TYPE'
      });
    }

    if (!event.timestamp) {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp is required',
        code: 'MISSING_TIMESTAMP'
      });
    }

    if (!event.data) {
      errors.push({
        field: 'data',
        message: 'Event data is required',
        code: 'MISSING_DATA'
      });
    }
  }

  /**
   * Valida idade do evento
   */
  private validateEventAge(
    event: EdgeFunctionEvent, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (!event.timestamp) return;

    try {
      const eventTime = new Date(event.timestamp).getTime();
      const currentTime = Date.now();
      const eventAge = currentTime - eventTime;

      if (eventAge < 0) {
        errors.push({
          field: 'timestamp',
          message: 'Event timestamp is in the future',
          code: 'FUTURE_TIMESTAMP'
        });
      } else if (eventAge > this.MAX_EVENT_AGE) {
        warnings.push({
          field: 'timestamp',
          message: `Event is older than ${this.MAX_EVENT_AGE / 1000} seconds`,
          code: 'STALE_EVENT'
        });
      } else if (eventAge < this.MIN_EVENT_AGE) {
        warnings.push({
          field: 'timestamp',
          message: 'Event is very recent, might be duplicate',
          code: 'RECENT_EVENT'
        });
      }
    } catch (error) {
      errors.push({
        field: 'timestamp',
        message: 'Invalid timestamp format',
        code: 'INVALID_TIMESTAMP'
      });
    }
  }

  /**
   * Valida organization ID
   */
  private validateOrganizationId(event: EdgeFunctionEvent, errors: ValidationError[]): void {
    if (!event.organizationId) {
      errors.push({
        field: 'organizationId',
        message: 'Organization ID is required',
        code: 'MISSING_ORGANIZATION_ID'
      });
      return;
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(event.organizationId)) {
      errors.push({
        field: 'organizationId',
        message: 'Organization ID must be a valid UUID',
        code: 'INVALID_ORGANIZATION_ID'
      });
    }
  }

  /**
   * Valida dados específicos por tipo de evento usando schemas Zod
   */
  private async validateEventTypeSpecific(
    event: EdgeFunctionEvent, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      const edgeFunction = EVENT_TO_EDGE_FUNCTION[event.eventType];
      
      switch (edgeFunction) {
        case EdgeFunctionType.INVENTORY:
          await this.validateInventoryEvent(event, errors, warnings);
          break;
        case EdgeFunctionType.SALES:
          await this.validateSalesEvent(event, errors, warnings);
          break;
        case EdgeFunctionType.PURCHASE:
          await this.validatePurchaseEvent(event, errors, warnings);
          break;
        case EdgeFunctionType.TRANSFER:
          await this.validateTransferEvent(event, errors, warnings);
          break;
        default:
          errors.push({
            field: 'eventType',
            message: `Unknown edge function for event type: ${event.eventType}`,
            code: 'UNKNOWN_EDGE_FUNCTION'
          });
      }
    } catch (error) {
      errors.push({
        field: 'eventType',
        message: `Event type validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'EVENT_TYPE_VALIDATION_ERROR'
      });
    }
  }

  /**
   * Valida eventos de inventário
   */
  private async validateInventoryEvent(
    event: EdgeFunctionEvent, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): Promise<void> {
    // Para eventos de produto, usar schema específico
    if ([EventType.PRODUCT_CREATED, EventType.PRODUCT_UPDATED].includes(event.eventType)) {
      try {
        productEventSchema.parse({
          event_type: event.eventType,
          organization_id: event.organizationId,
          timestamp: event.timestamp,
          data: event.data
        });
      } catch (zodError: any) {
        zodError.errors?.forEach((err: any) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            code: 'SCHEMA_VALIDATION_ERROR'
          });
        });
      }
    }

    // Para ajustes de inventário, usar schema de movimento
    if (event.eventType === EventType.INVENTORY_ADJUSTMENT) {
      try {
        movementEventSchema.parse({
          event_type: event.eventType,
          organization_id: event.organizationId,
          timestamp: event.timestamp,
          data: event.data
        });
      } catch (zodError: any) {
        zodError.errors?.forEach((err: any) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            code: 'SCHEMA_VALIDATION_ERROR'
          });
        });
      }
    }

    // Validações específicas de inventário
    if (event.data.quantity !== undefined && event.data.quantity === 0) {
      warnings.push({
        field: 'data.quantity',
        message: 'Zero quantity adjustment might be intentional',
        code: 'ZERO_QUANTITY'
      });
    }
  }

  /**
   * Valida eventos de vendas
   */
  private async validateSalesEvent(
    event: EdgeFunctionEvent, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      saleEventSchema.parse({
        event_type: event.eventType,
        organization_id: event.organizationId,
        timestamp: event.timestamp,
        data: event.data
      });
    } catch (zodError: any) {
      zodError.errors?.forEach((err: any) => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          code: 'SCHEMA_VALIDATION_ERROR'
        });
      });
    }

    // Validações específicas de vendas
    if (event.data.sale?.total_amount && event.data.sale.total_amount < 0) {
      errors.push({
        field: 'data.sale.total_amount',
        message: 'Sale total amount cannot be negative',
        code: 'NEGATIVE_SALE_AMOUNT'
      });
    }

    if (event.data.sale?.items && event.data.sale.items.length === 0) {
      errors.push({
        field: 'data.sale.items',
        message: 'Sale must have at least one item',
        code: 'EMPTY_SALE_ITEMS'
      });
    }
  }

  /**
   * Valida eventos de compras
   */
  private async validatePurchaseEvent(
    event: EdgeFunctionEvent, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      purchaseEventSchema.parse({
        event_type: event.eventType,
        organization_id: event.organizationId,
        timestamp: event.timestamp,
        data: event.data
      });
    } catch (zodError: any) {
      zodError.errors?.forEach((err: any) => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          code: 'SCHEMA_VALIDATION_ERROR'
        });
      });
    }

    // Validações específicas de compras
    if (event.data.purchase?.total_amount && event.data.purchase.total_amount < 0) {
      errors.push({
        field: 'data.purchase.total_amount',
        message: 'Purchase total amount cannot be negative',
        code: 'NEGATIVE_PURCHASE_AMOUNT'
      });
    }
  }

  /**
   * Valida eventos de transferência
   */
  private async validateTransferEvent(
    event: EdgeFunctionEvent, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      transferEventSchema.parse({
        event_type: event.eventType,
        organization_id: event.organizationId,
        timestamp: event.timestamp,
        data: event.data
      });
    } catch (zodError: any) {
      zodError.errors?.forEach((err: any) => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          code: 'SCHEMA_VALIDATION_ERROR'
        });
      });
    }

    // Validações específicas de transferência
    if (event.data.transfer?.from_store_id === event.data.transfer?.to_store_id) {
      errors.push({
        field: 'data.transfer',
        message: 'Transfer cannot be between the same store',
        code: 'SAME_STORE_TRANSFER'
      });
    }
  }

  /**
   * Valida regras de negócio específicas
   */
  private validateBusinessRules(
    event: EdgeFunctionEvent, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Regra: Eventos de cancelamento devem ter referência ao evento original
    if ([EventType.SALE_CANCELLED, EventType.PURCHASE_CANCELLED, EventType.TRANSFER_CANCELLED].includes(event.eventType)) {
      if (!event.data.reference_document && !event.metadata?.correlation_id) {
        warnings.push({
          field: 'data.reference_document',
          message: 'Cancellation events should have reference to original event',
          code: 'MISSING_CANCELLATION_REFERENCE'
        });
      }
    }

    // Regra: Eventos de alta prioridade devem ser processados rapidamente
    const highPriorityEvents = [EventType.SALE_COMPLETED, EventType.INVENTORY_ADJUSTMENT];
    if (highPriorityEvents.includes(event.eventType)) {
      const eventAge = Date.now() - new Date(event.timestamp).getTime();
      if (eventAge > 60000) { // 1 minuto
        warnings.push({
          field: 'timestamp',
          message: 'High priority event is older than 1 minute',
          code: 'DELAYED_HIGH_PRIORITY'
        });
      }
    }
  }

  /**
   * Valida dados específicos do Banban
   */
  private validateBanbanSpecificData(
    event: EdgeFunctionEvent, 
    warnings: ValidationWarning[]
  ): void {
    if (!event.data.banban_specific) return;

    const banbanData = event.data.banban_specific;

    // Validar doc_status específico do Banban (25 valores possíveis)
    if (banbanData.doc_status && !this.isValidBanbanDocStatus(banbanData.doc_status)) {
      warnings.push({
        field: 'data.banban_specific.doc_status',
        message: `Unknown Banban doc_status: ${banbanData.doc_status}`,
        code: 'UNKNOWN_DOC_STATUS'
      });
    }

    // Validar season format
    if (banbanData.season && !this.isValidSeasonFormat(banbanData.season)) {
      warnings.push({
        field: 'data.banban_specific.season',
        message: 'Season should be in format YYYY-SS (e.g., 2024-SS)',
        code: 'INVALID_SEASON_FORMAT'
      });
    }

    // Validar collection_year
    if (banbanData.collection_year) {
      const currentYear = new Date().getFullYear();
      if (banbanData.collection_year < 2020 || banbanData.collection_year > currentYear + 2) {
        warnings.push({
          field: 'data.banban_specific.collection_year',
          message: 'Collection year seems out of reasonable range',
          code: 'UNUSUAL_COLLECTION_YEAR'
        });
      }
    }
  }

  /**
   * Verifica se o doc_status é válido para o Banban
   */
  private isValidBanbanDocStatus(docStatus: string): boolean {
    // Lista dos 25 status específicos do Banban
    const validStatuses = [
      'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_PRODUCTION',
      'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED',
      'RETURNED', 'REFUNDED', 'PARTIAL_DELIVERY', 'BACKORDER', 'DISCONTINUED',
      'SEASONAL_HOLD', 'PROMOTIONAL', 'CLEARANCE', 'RESERVED', 'ALLOCATED',
      'TRANSFER_PENDING', 'TRANSFER_COMPLETE', 'DAMAGED', 'LOST', 'EXPIRED'
    ];
    
    return validStatuses.includes(docStatus);
  }

  /**
   * Verifica formato da season
   */
  private isValidSeasonFormat(season: string): boolean {
    // Formato: YYYY-SS (Spring/Summer) ou YYYY-AW (Autumn/Winter)
    const seasonRegex = /^\d{4}-(SS|AW)$/;
    return seasonRegex.test(season);
  }
}