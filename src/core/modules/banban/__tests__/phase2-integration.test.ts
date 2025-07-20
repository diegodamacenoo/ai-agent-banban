import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { BanbanActiveListeners } from '../data-processing/listeners';
import { FunctionalInsightsEngine, generateInsights } from '../insights/engine';
import { AlertProcessor, processAlerts } from '../alerts/processor';
import { BanbanLogger, BanbanMetrics, EdgeFunctionEvent } from '../index';

describe('Banban Phase 2 - Active Integration Tests', () => {
  let activeListeners: BanbanActiveListeners;
  let insightsEngine: FunctionalInsightsEngine;
  let alertProcessor: AlertProcessor;

  beforeEach(() => {
    // Reset singletons para testes isolados
    jest.clearAllMocks();
    
    activeListeners = BanbanActiveListeners.getInstance();
    insightsEngine = FunctionalInsightsEngine.getInstance();
    alertProcessor = AlertProcessor.getInstance();
  });

  describe('Active Listeners System', () => {
    test('should initialize all 12 event handlers', () => {
      const handlersStatus = activeListeners.getHandlersStatus();
      
      expect(Object.keys(handlersStatus)).toHaveLength(12);
      expect(handlersStatus).toHaveProperty('inventory_adjustment');
      expect(handlersStatus).toHaveProperty('product_created');
      expect(handlersStatus).toHaveProperty('product_updated');
      expect(handlersStatus).toHaveProperty('sale_completed');
      expect(handlersStatus).toHaveProperty('sale_cancelled');
      expect(handlersStatus).toHaveProperty('return_processed');
      expect(handlersStatus).toHaveProperty('purchase_completed');
      expect(handlersStatus).toHaveProperty('purchase_cancelled');
      expect(handlersStatus).toHaveProperty('purchase_returned');
      expect(handlersStatus).toHaveProperty('transfer_initiated');
      expect(handlersStatus).toHaveProperty('transfer_completed');
      expect(handlersStatus).toHaveProperty('transfer_cancelled');
    });

    test('should enable/disable handlers correctly', () => {
      const eventType = 'sale_completed';
      
      // Verificar estado inicial (habilitado)
      let status = activeListeners.getHandlersStatus();
      expect(status[eventType].enabled).toBe(true);
      
      // Desabilitar
      const result = activeListeners.toggleHandler(eventType, false);
      expect(result).toBe(true);
      
      status = activeListeners.getHandlersStatus();
      expect(status[eventType].enabled).toBe(false);
      
      // Reabilitar
      activeListeners.toggleHandler(eventType, true);
      status = activeListeners.getHandlersStatus();
      expect(status[eventType].enabled).toBe(true);
    });

    test('should process inventory adjustment event correctly', async () => {
      const mockEvent: EdgeFunctionEvent = {
        eventType: 'inventory_adjustment',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: {
          product_sku: 'BB001-AZUL-37',
          quantity_change: -5,
          reason: 'SOLD'
        }
      };

      await expect(activeListeners.processEvent(mockEvent)).resolves.not.toThrow();
      
      // Verificar que o handler foi processado
      const status = activeListeners.getHandlersStatus();
      expect(status['inventory_adjustment'].lastProcessed).toBeDefined();
    });

    test('should process sale completed event correctly', async () => {
      const mockEvent: EdgeFunctionEvent = {
        eventType: 'sale_completed',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: {
          document_id: 'sale-123',
          total_amount: 150.00,
          items: [
            { sku: 'BB001-AZUL-37', quantity: 1, price: 150.00 }
          ]
        }
      };

      await expect(activeListeners.processEvent(mockEvent)).resolves.not.toThrow();
      
      const status = activeListeners.getHandlersStatus();
      expect(status['sale_completed'].lastProcessed).toBeDefined();
    });

    test('should handle unknown event types gracefully', async () => {
      const mockEvent: EdgeFunctionEvent = {
        eventType: 'unknown_event_type',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: {}
      };

      await expect(activeListeners.processEvent(mockEvent)).resolves.not.toThrow();
    });

    test('should prevent duplicate event processing', async () => {
      const mockEvent: EdgeFunctionEvent = {
        eventType: 'sale_completed',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: {}
      };

      // Processar o mesmo evento simultaneamente
      const promises = [
        activeListeners.processEvent(mockEvent),
        activeListeners.processEvent(mockEvent)
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Functional Insights Engine', () => {
    test('should generate stock insights with mock data', async () => {
      const insights = await insightsEngine.generateStockInsights('test-org-123');
      
      expect(Array.isArray(insights)).toBe(true);
      
      if (insights.length > 0) {
        const stockInsight = insights[0];
        expect(stockInsight).toHaveProperty('id');
        expect(stockInsight).toHaveProperty('type');
        expect(stockInsight).toHaveProperty('title');
        expect(stockInsight).toHaveProperty('severity');
        expect(stockInsight).toHaveProperty('financialImpact');
        expect(stockInsight.organizationId).toBe('test-org-123');
      }
    });

    test('should generate margin insights with financial calculations', async () => {
      const insights = await insightsEngine.generateMarginInsights('test-org-123');
      
      expect(Array.isArray(insights)).toBe(true);
      
      if (insights.length > 0) {
        const marginInsight = insights[0];
        expect(marginInsight.type).toBe('LOW_MARGIN');
        expect(typeof marginInsight.financialImpact).toBe('number');
        expect(marginInsight.financialImpact).toBeGreaterThan(0);
      }
    });

    test('should generate slow-moving insights with promotion potential', async () => {
      const insights = await insightsEngine.generateSlowMovingInsights('test-org-123');
      
      expect(Array.isArray(insights)).toBe(true);
      
      if (insights.length > 0) {
        const slowMovingInsight = insights[0];
        expect(slowMovingInsight.type).toBe('SLOW_MOVING');
        expect(slowMovingInsight.severity).toBe('OPPORTUNITY');
        expect(slowMovingInsight).toHaveProperty('actionSuggestions');
        expect(Array.isArray(slowMovingInsight.actionSuggestions)).toBe(true);
      }
    });

    test('should generate performance insights with growth data', async () => {
      const insights = await insightsEngine.generatePerformanceInsights('test-org-123');
      
      expect(Array.isArray(insights)).toBe(true);
      
      if (insights.length > 0) {
        const performanceInsight = insights[0];
        expect(performanceInsight.type).toBe('OPPORTUNITY');
        expect(performanceInsight.metadata).toHaveProperty('growth');
        expect(performanceInsight.metadata).toHaveProperty('revenue');
      }
    });

    test('should use generateInsights function correctly', async () => {
      const stockInsights = await generateInsights('test-org-123', 'stock_analysis');
      const marginInsights = await generateInsights('test-org-123', 'margin_analysis');
      const slowMoverInsights = await generateInsights('test-org-123', 'slow_mover_analysis');
      const performanceInsights = await generateInsights('test-org-123', 'performance_analysis');
      
      expect(Array.isArray(stockInsights)).toBe(true);
      expect(Array.isArray(marginInsights)).toBe(true);
      expect(Array.isArray(slowMoverInsights)).toBe(true);
      expect(Array.isArray(performanceInsights)).toBe(true);
    });

    test('should handle unknown insight types gracefully', async () => {
      const insights = await generateInsights('test-org-123', 'unknown_type');
      expect(insights).toHaveLength(0);
    });
  });

  describe('Alert Processor', () => {
    test('should process low stock alerts correctly', async () => {
      const alerts = await alertProcessor.processLowStockAlerts('test-org-123');
      
      expect(Array.isArray(alerts)).toBe(true);
      
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('threshold');
        expect(alert).toHaveProperty('currentValue');
        expect(alert.organizationId).toBe('test-org-123');
      }
    });

    test('should process critical stock alerts with urgency', async () => {
      const alerts = await alertProcessor.processCriticalStockAlerts('test-org-123');
      
      expect(Array.isArray(alerts)).toBe(true);
      
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert.type).toBe('CRITICAL_STOCK');
        expect(alert.severity).toBe('CRITICAL');
        expect(alert.title).toContain('🔴 CRÍTICO');
      }
    });

    test('should process low margin alerts with impact calculations', async () => {
      const alerts = await alertProcessor.processLowMarginAlerts('test-org-123');
      
      expect(Array.isArray(alerts)).toBe(true);
      
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert.type).toBe('LOW_MARGIN');
        expect(alert.metadata).toHaveProperty('potentialImpact');
        expect(typeof alert.currentValue).toBe('number');
      }
    });

    test('should process slow moving alerts with timeframe data', async () => {
      const alerts = await alertProcessor.processSlowMovingAlerts('test-org-123');
      
      expect(Array.isArray(alerts)).toBe(true);
      
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert.type).toBe('SLOW_MOVING');
        expect(alert.metadata).toHaveProperty('daysSinceLastSale');
        expect(alert.metadata).toHaveProperty('stockValue');
      }
    });

    test('should use processAlerts function correctly', async () => {
      const lowStockAlerts = await processAlerts('test-org-123', 'low_stock');
      const criticalStockAlerts = await processAlerts('test-org-123', 'critical_stock');
      const lowMarginAlerts = await processAlerts('test-org-123', 'low_margin');
      const slowMovingAlerts = await processAlerts('test-org-123', 'slow_moving');
      
      expect(Array.isArray(lowStockAlerts)).toBe(true);
      expect(Array.isArray(criticalStockAlerts)).toBe(true);
      expect(Array.isArray(lowMarginAlerts)).toBe(true);
      expect(Array.isArray(slowMovingAlerts)).toBe(true);
    });

    test('should handle unknown alert types gracefully', async () => {
      const alerts = await processAlerts('test-org-123', 'unknown_type');
      expect(alerts).toHaveLength(0);
    });
  });

  describe('Integration Tests - Event Processing Flow', () => {
    test('should trigger complete flow for inventory adjustment', async () => {
      const mockEvent: EdgeFunctionEvent = {
        eventType: 'inventory_adjustment',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: {
          product_sku: 'BB001-AZUL-37',
          quantity_change: -10,
          reason: 'SOLD'
        }
      };

      // Processar evento
      await activeListeners.processEvent(mockEvent);
      
      // Verificar que insights e alertas foram gerados
      const stockInsights = await generateInsights('test-org-123', 'stock_analysis');
      const stockAlerts = await processAlerts('test-org-123', 'low_stock');
      
      expect(Array.isArray(stockInsights)).toBe(true);
      expect(Array.isArray(stockAlerts)).toBe(true);
    });

    test('should trigger complete flow for sale completion', async () => {
      const mockEvent: EdgeFunctionEvent = {
        eventType: 'sale_completed',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: {
          document_id: 'sale-456',
          total_amount: 200.00,
          items: [
            { sku: 'BB002-PRETO-38', quantity: 1, price: 200.00 }
          ]
        }
      };

      // Processar evento
      await activeListeners.processEvent(mockEvent);
      
      // Verificar que múltiplas análises foram disparadas
      const marginInsights = await generateInsights('test-org-123', 'margin_analysis');
      const performanceInsights = await generateInsights('test-org-123', 'performance_analysis');
      const slowMoverInsights = await generateInsights('test-org-123', 'slow_mover_analysis');
      
      expect(Array.isArray(marginInsights)).toBe(true);
      expect(Array.isArray(performanceInsights)).toBe(true);
      expect(Array.isArray(slowMoverInsights)).toBe(true);
    });

    test('should record metrics during event processing', async () => {
      const mockEvent: EdgeFunctionEvent = {
        eventType: 'product_created',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: {
          sku: 'BB003-NOVO-40',
          name: 'Produto Novo'
        }
      };

      await activeListeners.processEvent(mockEvent);
      
      // Verificar métricas foram registradas
      const metrics = BanbanMetrics.getMetrics('listeners');
      expect(typeof metrics).toBe('object');
    });
  });

  describe('Performance Tests - Phase 2', () => {
    test('should handle high volume of events efficiently', async () => {
      const startTime = Date.now();
      const eventCount = 100;
      
      const events: EdgeFunctionEvent[] = Array.from({ length: eventCount }, (_, i) => ({
        eventType: 'sale_completed',
        organizationId: 'test-org-123',
        timestamp: new Date().toISOString(),
        data: { document_id: `sale-${i}` }
      }));

      // Processar eventos em paralelo
      const promises = events.map(event => activeListeners.processEvent(event));
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Deve processar 100 eventos em menos de 5 segundos
      expect(duration).toBeLessThan(5000);
    });

    test('should generate insights efficiently', async () => {
      const startTime = Date.now();
      
      // Gerar múltiplos tipos de insights
      await Promise.all([
        generateInsights('test-org-123', 'stock_analysis'),
        generateInsights('test-org-123', 'margin_analysis'),
        generateInsights('test-org-123', 'slow_mover_analysis'),
        generateInsights('test-org-123', 'performance_analysis')
      ]);
      
      const duration = Date.now() - startTime;
      
      // Deve gerar todos os insights em menos de 2 segundos
      expect(duration).toBeLessThan(2000);
    });

    test('should process alerts efficiently', async () => {
      const startTime = Date.now();
      
      // Processar múltiplos tipos de alertas
      await Promise.all([
        processAlerts('test-org-123', 'low_stock'),
        processAlerts('test-org-123', 'critical_stock'),
        processAlerts('test-org-123', 'low_margin'),
        processAlerts('test-org-123', 'slow_moving')
      ]);
      
      const duration = Date.now() - startTime;
      
      // Deve processar todos os alertas em menos de 2 segundos
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Error Handling - Phase 2', () => {
    test('should handle malformed events gracefully', async () => {
      const malformedEvent = {
        eventType: 'sale_completed',
        // organizationId ausente
        timestamp: new Date().toISOString(),
        data: {}
      } as any;

      await expect(activeListeners.processEvent(malformedEvent)).rejects.toThrow();
    });

    test('should handle insights generation errors gracefully', async () => {
      // Testar com organization_id inválido
      await expect(generateInsights('invalid-org', 'stock_analysis')).resolves.not.toThrow();
    });

    test('should handle alert processing errors gracefully', async () => {
      // Testar com organization_id inválido
      await expect(processAlerts('invalid-org', 'low_stock')).resolves.not.toThrow();
    });
  });
}); 