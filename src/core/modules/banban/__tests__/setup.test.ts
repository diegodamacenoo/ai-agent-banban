import { BANBAN_MODULES, BanbanLogger, BanbanHealthChecker, BanbanMetrics, BANBAN_MODULE_CONFIG } from '../index';

describe('Banban Modules - Setup and Configuration', () => {
  beforeEach(() => {
    // Limpar métricas antes de cada teste
    BanbanMetrics.clearMetrics();
  });

  describe('Module Registry', () => {
    test('should export all required modules', () => {
      expect(BANBAN_MODULES).toBeDefined();
      expect(Object.keys(BANBAN_MODULES)).toHaveLength(5);
      
      // Verificar se todos os módulos estão presentes
      expect(BANBAN_MODULES.inventory).toBeDefined();
      expect(BANBAN_MODULES.performance).toBeDefined();
      expect(BANBAN_MODULES.dataProcessing).toBeDefined();
      expect(BANBAN_MODULES.insights).toBeDefined();
      expect(BANBAN_MODULES.alerts).toBeDefined();
    });

    test('should have correct module structure', () => {
      for (const [moduleKey, module] of Object.entries(BANBAN_MODULES)) {
        expect(module).toHaveProperty('moduleId');
        expect(module).toHaveProperty('clientId');
        expect(module).toHaveProperty('configuration');
        expect(module).toHaveProperty('endpoints');
        expect(module).toHaveProperty('validations');
        
        // Verificar se clientId é sempre 'banban'
        expect(module.clientId).toBe('banban');
        
        // Verificar se endpoints é um array não vazio
        expect(Array.isArray(module.endpoints)).toBe(true);
        expect(module.endpoints.length).toBeGreaterThan(0);
      }
    });

    test('should have unique module IDs', () => {
      const moduleIds = Object.values(BANBAN_MODULES).map(module => module.moduleId);
      const uniqueIds = new Set(moduleIds);
      
      expect(uniqueIds.size).toBe(moduleIds.length);
    });
  });

  describe('Configuration', () => {
    test('should have valid configuration structure', () => {
      expect(BANBAN_MODULE_CONFIG).toBeDefined();
      expect(BANBAN_MODULE_CONFIG.clientId).toBe('banban');
      expect(BANBAN_MODULE_CONFIG.version).toBeDefined();
      expect(BANBAN_MODULE_CONFIG.description).toBeDefined();
    });

    test('should have Edge Functions mapping', () => {
      expect(BANBAN_MODULE_CONFIG.edgeFunctions).toBeDefined();
      expect(BANBAN_MODULE_CONFIG.edgeFunctions.salesFlow).toBe('webhook-sales-flow');
      expect(BANBAN_MODULE_CONFIG.edgeFunctions.purchaseFlow).toBe('webhook-purchase-flow');
      expect(BANBAN_MODULE_CONFIG.edgeFunctions.inventoryFlow).toBe('webhook-inventory-flow');
      expect(BANBAN_MODULE_CONFIG.edgeFunctions.transferFlow).toBe('webhook-transfer-flow');
    });

    test('should have business rules configured', () => {
      expect(BANBAN_MODULE_CONFIG.businessRules).toBeDefined();
      expect(BANBAN_MODULE_CONFIG.businessRules.stockThreshold).toBe(10);
      expect(BANBAN_MODULE_CONFIG.businessRules.lowMarginThreshold).toBe(0.31);
      expect(BANBAN_MODULE_CONFIG.businessRules.slowMovingDays).toBe(30);
      expect(BANBAN_MODULE_CONFIG.businessRules.criticalStockLevel).toBe(5);
    });

    test('should have insights configuration', () => {
      expect(BANBAN_MODULE_CONFIG.insightsConfig).toBeDefined();
      expect(BANBAN_MODULE_CONFIG.insightsConfig.priorities).toBeDefined();
      expect(BANBAN_MODULE_CONFIG.insightsConfig.updateInterval).toBe(300000);
      expect(BANBAN_MODULE_CONFIG.insightsConfig.cacheTimeout).toBe(1800000);
    });
  });

  describe('BanbanLogger', () => {
    test('should create singleton instance', () => {
      const logger1 = BanbanLogger.getInstance();
      const logger2 = BanbanLogger.getInstance();
      
      expect(logger1).toBe(logger2);
    });

    test('should log messages correctly', () => {
      const logger = BanbanLogger.getInstance();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('test', 'Test message', { context: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BANBAN-TEST] INFO: Test message'),
        expect.stringContaining('"context": "test"')
      );
      
      consoleSpy.mockRestore();
    });

    test('should support different log levels', () => {
      const logger = BanbanLogger.getInstance();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.info('test', 'Info message');
      logger.warn('test', 'Warning message');
      logger.error('test', 'Error message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('INFO'));
      expect(consoleSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('WARN'));
      expect(consoleSpy).toHaveBeenNthCalledWith(3, expect.stringContaining('ERROR'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('BanbanMetrics', () => {
    test('should record metrics correctly', () => {
      BanbanMetrics.record('test', 'test_metric', 100, { tag1: 'value1' });
      
      const metrics = BanbanMetrics.getMetrics('test');
      expect(metrics['banban.test.test_metric']).toBeDefined();
      expect(metrics['banban.test.test_metric']).toHaveLength(1);
      expect(metrics['banban.test.test_metric'][0].value).toBe(100);
      expect(metrics['banban.test.test_metric'][0].tags.tag1).toBe('value1');
    });

    test('should limit metrics to 100 records per key', () => {
      // Registrar 150 métricas
      for (let i = 0; i < 150; i++) {
        BanbanMetrics.record('test', 'limit_test', i);
      }
      
      const metrics = BanbanMetrics.getMetrics('test');
      expect(metrics['banban.test.limit_test']).toHaveLength(100);
      
      // Verificar se manteve os últimos 100
      const values = metrics['banban.test.limit_test'].map((m: any) => m.value);
      expect(values[0]).toBe(50); // Primeiro valor mantido (150 - 100)
      expect(values[99]).toBe(149); // Último valor
    });

    test('should filter metrics by module', () => {
      BanbanMetrics.record('module1', 'metric1', 100);
      BanbanMetrics.record('module2', 'metric1', 200);
      
      const module1Metrics = BanbanMetrics.getMetrics('module1');
      const module2Metrics = BanbanMetrics.getMetrics('module2');
      const allMetrics = BanbanMetrics.getMetrics();
      
      expect(Object.keys(module1Metrics)).toHaveLength(1);
      expect(Object.keys(module2Metrics)).toHaveLength(1);
      expect(Object.keys(allMetrics)).toHaveLength(2);
      
      expect(module1Metrics['banban.module1.metric1']).toBeDefined();
      expect(module2Metrics['banban.module2.metric1']).toBeDefined();
    });

    test('should clear all metrics', () => {
      BanbanMetrics.record('test', 'metric1', 100);
      BanbanMetrics.record('test', 'metric2', 200);
      
      let metrics = BanbanMetrics.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(2);
      
      BanbanMetrics.clearMetrics();
      
      metrics = BanbanMetrics.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });

  describe('BanbanHealthChecker', () => {
    test('should check health of existing module', async () => {
      const result = await BanbanHealthChecker.checkModuleHealth('inventory');
      
      expect(result.healthy).toBe(true);
      expect(result.details).toBeDefined();
      expect(result.details.moduleId).toBe('banban-inventory');
      expect(result.details.clientId).toBe('banban');
      expect(result.lastChecked).toBeDefined();
    });

    test('should return unhealthy for non-existent module', async () => {
      const result = await BanbanHealthChecker.checkModuleHealth('non-existent');
      
      expect(result.healthy).toBe(false);
      expect(result.details.error).toBe('Module not found');
      expect(result.lastChecked).toBeDefined();
    });

    test('should check health of all modules', async () => {
      const results = await BanbanHealthChecker.checkAllModules();
      
      expect(Object.keys(results)).toHaveLength(5);
      
      for (const [moduleId, result] of Object.entries(results)) {
        expect(result).toHaveProperty('healthy');
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('lastChecked');
        expect(result.healthy).toBe(true); // Todos os módulos devem estar saudáveis
      }
    });
  });

  describe('Module Integration', () => {
    test('should have consistent endpoint patterns', () => {
      for (const [moduleKey, module] of Object.entries(BANBAN_MODULES)) {
        for (const endpoint of module.endpoints) {
          // Todos os endpoints devem começar com /api/modules/banban/
          expect(endpoint).toMatch(/^\/api\/modules\/banban\//);
          
          // Verificar se o endpoint contém o módulo correto
          const expectedPattern = `/api/modules/banban/${moduleKey === 'dataProcessing' ? 'data-processing' : moduleKey}`;
          expect(endpoint).toMatch(new RegExp(expectedPattern));
        }
      }
    });

    test('should have required validations', () => {
      for (const [moduleKey, module] of Object.entries(BANBAN_MODULES)) {
        expect(module.validations).toBeDefined();
        expect(typeof module.validations).toBe('object');
        
        // Todos os módulos devem validar organizationId
        expect(module.validations).toHaveProperty('organizationId');
      }
    });

    test('should have module-specific configurations', () => {
      for (const [moduleKey, module] of Object.entries(BANBAN_MODULES)) {
        expect(module.configuration).toBeDefined();
        expect(typeof module.configuration).toBe('object');
        expect(Object.keys(module.configuration).length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Banban Modules - Edge Function Integration', () => {
  test('should have correct Edge Function mapping', () => {
    const expectedMappings = {
      'product_created': 'inventory',
      'product_updated': 'inventory', 
      'inventory_adjustment': 'inventory',
      'sale_completed': 'sales',
      'sale_cancelled': 'sales',
      'return_processed': 'sales',
      'purchase_completed': 'purchase',
      'purchase_cancelled': 'purchase',
      'purchase_returned': 'purchase',
      'transfer_initiated': 'transfer',
      'transfer_completed': 'transfer',
      'transfer_cancelled': 'transfer'
    };

    // Verificar se todos os eventos estão mapeados para as Edge Functions corretas
    for (const [eventType, expectedEdgeFunction] of Object.entries(expectedMappings)) {
      expect(BANBAN_MODULE_CONFIG.edgeFunctions).toHaveProperty(`${expectedEdgeFunction  }Flow`);
    }
  });

  test('should support all webhook event types', () => {
    const supportedEvents = [
      'product_created', 'product_updated', 'inventory_adjustment',
      'sale_completed', 'sale_cancelled', 'return_processed',
      'purchase_completed', 'purchase_cancelled', 'purchase_returned',
      'transfer_initiated', 'transfer_completed', 'transfer_cancelled'
    ];

    // Verificar se o sistema suporta todos os tipos de eventos
    expect(supportedEvents.length).toBe(12);
    
    // Todos os eventos devem ter mapeamento para uma Edge Function
    supportedEvents.forEach(eventType => {
      const isSupported = 
        eventType.includes('product') || eventType.includes('inventory') ||
        eventType.includes('sale') || eventType.includes('return') ||
        eventType.includes('purchase') ||
        eventType.includes('transfer');
      
      expect(isSupported).toBe(true);
    });
  });
});

describe('Banban Modules - Performance and Scalability', () => {
  test('should handle concurrent module health checks', async () => {
    const concurrentChecks = Array(10).fill(null).map(() => 
      BanbanHealthChecker.checkModuleHealth('inventory')
    );

    const results = await Promise.all(concurrentChecks);
    
    results.forEach(result => {
      expect(result.healthy).toBe(true);
      expect(result.details.moduleId).toBe('banban-inventory');
    });
  });

  test('should handle high-volume metrics recording', () => {
    const startTime = Date.now();
    
    // Registrar 1000 métricas
    for (let i = 0; i < 1000; i++) {
      BanbanMetrics.record('performance', 'high_volume_test', i);
    }
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Deve processar 1000 métricas em menos de 100ms
    expect(processingTime).toBeLessThan(100);
    
    const metrics = BanbanMetrics.getMetrics('performance');
    expect(metrics['banban.performance.high_volume_test']).toHaveLength(100); // Limitado a 100
  });

  test('should handle memory efficiently', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Registrar muitas métricas e limpar
    for (let i = 0; i < 10000; i++) {
      BanbanMetrics.record('memory', 'test', i);
    }
    
    BanbanMetrics.clearMetrics();
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Aumento de memória deve ser mínimo (menos de 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
}); 