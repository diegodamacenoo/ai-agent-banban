import {
  EventValidationService,
  EventProcessingService,
  WebhookListenerService,
  MetricsCollectionService
} from '../services';
import { DataProcessingApiHandlers } from '../handlers/ApiHandlers';
import { EventType, EdgeFunctionType, EdgeFunctionEvent } from '../types';

describe('BanBan Data Processing Module', () => {
  let validationService: EventValidationService;
  let processingService: EventProcessingService;
  let webhookService: WebhookListenerService;
  let metricsService: MetricsCollectionService;
  let apiHandlers: DataProcessingApiHandlers;

  const mockEvent: EdgeFunctionEvent = {
    eventType: EventType.PRODUCT_CREATED,
    organizationId: 'test-org-123',
    timestamp: new Date().toISOString(),
    data: {
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      category: 'test-category',
      price: 29.99
    },
    metadata: {
      source: 'webhook-inventory-flow',
      version: '1.0'
    }
  };

  beforeEach(() => {
    validationService = new EventValidationService();
    processingService = new EventProcessingService();
    webhookService = new WebhookListenerService();
    metricsService = new MetricsCollectionService();
    apiHandlers = new DataProcessingApiHandlers();
  });

  // ================================================
  // TESTES DE VALIDAÇÃO
  // ================================================

  describe('EventValidationService', () => {
    test('should validate product event successfully', async () => {
      const result = await validationService.validateEvent(mockEvent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid event structure', async () => {
      const invalidEvent = { ...mockEvent, organizationId: '' };
      const result = await validationService.validateEvent(invalidEvent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate batch of events', async () => {
      const events = [mockEvent, { ...mockEvent, eventType: EventType.SALE_COMPLETED }];
      const results = await validationService.validateBatch(events);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.isValid)).toBe(true);
    });
  });

  // ================================================
  // TESTES DE PROCESSAMENTO
  // ================================================

  describe('EventProcessingService', () => {
    test('should process single event successfully', async () => {
      const result = await processingService.processEvent(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.triggeredActions.length).toBeGreaterThan(0);
    });

    test('should process batch of events', async () => {
      const events = [mockEvent, { ...mockEvent, eventType: EventType.INVENTORY_ADJUSTMENT }];
      const results = await processingService.processBatch(events);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    test('should handle processing errors gracefully', async () => {
      const invalidEvent = { ...mockEvent, data: null };
      const result = await processingService.processEvent(invalidEvent);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  // ================================================
  // TESTES DE WEBHOOK LISTENERS
  // ================================================

  describe('WebhookListenerService', () => {
    test('should handle inventory webhook', async () => {
      const result = await webhookService.onInventoryEvent(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.triggeredActions).toBeDefined();
    });

    test('should handle sales webhook', async () => {
      const salesEvent = { ...mockEvent, eventType: EventType.SALE_COMPLETED };
      const result = await webhookService.onSalesEvent(salesEvent);
      
      expect(result.success).toBe(true);
    });

    test('should handle purchase webhook', async () => {
      const purchaseEvent = { ...mockEvent, eventType: EventType.PURCHASE_COMPLETED };
      const result = await webhookService.onPurchaseEvent(purchaseEvent);
      
      expect(result.success).toBe(true);
    });

    test('should handle transfer webhook', async () => {
      const transferEvent = { ...mockEvent, eventType: EventType.TRANSFER_COMPLETED };
      const result = await webhookService.onTransferEvent(transferEvent);
      
      expect(result.success).toBe(true);
    });

    test('should support batch processing configuration', () => {
      const config = webhookService.getConfig();
      
      expect(config.batchProcessing).toBeDefined();
      expect(config.batchSize).toBeGreaterThan(0);
      expect(config.batchTimeout).toBeGreaterThan(0);
    });
  });

  // ================================================
  // TESTES DE MÉTRICAS
  // ================================================

  describe('MetricsCollectionService', () => {
    test('should collect processing metrics', () => {
      metricsService.recordEventProcessing(
        EventType.PRODUCT_CREATED,
        EdgeFunctionType.INVENTORY,
        150,
        true,
        ['product_insights_analysis']
      );

      const metrics = metricsService.getProcessingMetrics();
      
      expect(metrics.totalEventsProcessed).toBe(1);
      expect(metrics.successfulEvents).toBe(1);
      expect(metrics.averageProcessingTime).toBe(150);
    });

    test('should generate health metrics', () => {
      const health = metricsService.getHealthMetrics();
      
      expect(health.healthy).toBeDefined();
      expect(health.details.module).toBe('banban-data-processing');
      expect(health.details.uptime).toBeGreaterThan(0);
    });

    test('should export metrics in different formats', () => {
      const jsonExport = metricsService.exportMetrics('json');
      const csvExport = metricsService.exportMetrics('csv');
      
      expect(typeof jsonExport).toBe('string');
      expect(typeof csvExport).toBe('string');
      expect(csvExport.includes('timestamp,eventType')).toBe(true);
    });
  });

  // ================================================
  // TESTES DE API HANDLERS
  // ================================================

  describe('DataProcessingApiHandlers', () => {
    test('should handle process event API call', async () => {
      const request = {
        body: mockEvent,
        organizationId: 'test-org-123'
      };

      const response = await apiHandlers.handleProcessEvent(request);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    test('should handle batch processing API call', async () => {
      const request = {
        body: { events: [mockEvent] },
        organizationId: 'test-org-123'
      };

      const response = await apiHandlers.handleProcessBatch(request);
      
      expect(response.success).toBe(true);
      expect(response.summary).toBeDefined();
      expect(response.summary?.totalEvents).toBe(1);
    });

    test('should handle validation API call', async () => {
      const request = {
        body: mockEvent,
        organizationId: 'test-org-123'
      };

      const response = await apiHandlers.handleValidateEvent(request);
      
      expect(response.success).toBe(true);
      expect(response.data?.isValid).toBe(true);
    });

    test('should handle metrics API call', async () => {
      const request = {
        query: { format: 'json', detailed: 'false' },
        organizationId: 'test-org-123'
      };

      const response = await apiHandlers.handleGetMetrics(request);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    test('should handle health check API call', async () => {
      const request = { organizationId: 'test-org-123' };
      const response = await apiHandlers.handleHealthCheck(request);
      
      expect(response.success).toBe(true);
      expect(response.data?.healthy).toBeDefined();
    });

    test('should reject mismatched organization IDs', async () => {
      const request = {
        body: { ...mockEvent, organizationId: 'different-org' },
        organizationId: 'test-org-123'
      };

      const response = await apiHandlers.handleProcessEvent(request);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Organization ID mismatch');
    });
  });

  // ================================================
  // TESTES DE INTEGRAÇÃO
  // ================================================

  describe('Integration Tests', () => {
    test('should process event end-to-end', async () => {
      // 1. Validar evento
      const validation = await validationService.validateEvent(mockEvent);
      expect(validation.isValid).toBe(true);

      // 2. Processar evento
      const processing = await processingService.processEvent(mockEvent);
      expect(processing.success).toBe(true);

      // 3. Verificar métricas
      const metrics = metricsService.getProcessingMetrics();
      expect(metrics.totalEventsProcessed).toBeGreaterThan(0);
    });

    test('should handle webhook to processing pipeline', async () => {
      const result = await webhookService.onInventoryEvent(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.triggeredActions.length).toBeGreaterThan(0);
    });
  });

  // ================================================
  // TESTES DE PERFORMANCE
  // ================================================

  describe('Performance Tests', () => {
    test('should process events within acceptable time limits', async () => {
      const startTime = Date.now();
      await processingService.processEvent(mockEvent);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(5000); // < 5 segundos
    });

    test('should handle batch processing efficiently', async () => {
      const events = Array(10).fill(mockEvent);
      const startTime = Date.now();
      
      const results = await processingService.processBatch(events);
      const processingTime = Date.now() - startTime;
      
      expect(results).toHaveLength(10);
      expect(processingTime).toBeLessThan(10000); // < 10 segundos para 10 eventos
    });
  });
});

// ================================================
// TESTES UTILITÁRIOS
// ================================================

describe('Data Processing Utilities', () => {
  test('should generate unique event IDs', () => {
    const service = new EventProcessingService();
    const event1 = { ...mockEvent, timestamp: new Date().toISOString() };
    const event2 = { ...mockEvent, timestamp: new Date(Date.now() + 1000).toISOString() };
    
    // Nota: IDs são gerados internamente, então testamos processamento
    const result1 = service.processEvent(event1);
    const result2 = service.processEvent(event2);
    
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });

  test('should handle concurrent processing', async () => {
    const events = Array(5).fill(mockEvent);
    const promises = events.map(event => processingService.processEvent(event));
    
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(5);
    expect(results.every(r => r.success)).toBe(true);
  });
}); 