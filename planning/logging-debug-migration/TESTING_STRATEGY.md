# Estratégia de Testes - Migração Debug Condicional

**Objetivo:** Garantir que a migração seja segura, performática e não-disruptiva.

## 🧪 Tipos de Teste

### **1. Testes Funcionais** ✅
Validar que a funcionalidade core permanece intacta após migração.

### **2. Testes de Performance** ⚡
Garantir que `conditionalDebugLog` não impacta performance significativamente.

### **3. Testes de Interface** 🖥️
Verificar que toggles administrativos funcionam corretamente.

### **4. Testes de Integração** 🔗
Confirmar que sistema de cache e persistência funciona end-to-end.

---

## ✅ Testes Funcionais

### **Before/After Testing**
Para cada arquivo migrado:

```typescript
// Teste de Comparação
describe('Migration: auto-config-applier.ts', () => {
  it('should maintain same behavior with conditional debug', async () => {
    // Arrange - same inputs
    const testData = { entityType: 'implementation', entityId: '123' };
    
    // Act - call migrated function
    const result = await applySystemConfigurationsToNewEntity(
      testData.entityType, 
      testData.entityId, 
      testData
    );
    
    // Assert - same outputs
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });
});
```

### **Debug Toggle Testing**
```typescript
describe('Conditional Debug System', () => {
  it('should log to database when debug enabled', async () => {
    // Arrange
    await setSystemConfig({ debugMode: true });
    
    // Act  
    await conditionalDebugLog('Test message', { test: true });
    
    // Assert
    const logs = await getDebugLogs();
    expect(logs).toContainEqual(
      expect.objectContaining({ message: 'Test message' })
    );
  });
  
  it('should not log to database when debug disabled', async () => {
    // Arrange
    await setSystemConfig({ debugMode: false });
    const initialLogCount = await getDebugLogCount();
    
    // Act
    await conditionalDebugLog('Test message', { test: true });
    
    // Assert  
    const finalLogCount = await getDebugLogCount();
    expect(finalLogCount).toBe(initialLogCount);
  });
});
```

### **Error Handling Testing**
```typescript
describe('Error Resilience', () => {
  it('should not fail when debug_logs table unavailable', async () => {
    // Arrange - simulate database error
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockRejectedValue(new Error('Database error'))
    });
    
    // Act & Assert - should not throw
    await expect(
      conditionalDebugLog('Test message', {})
    ).resolves.not.toThrow();
  });
});
```

---

## ⚡ Testes de Performance

### **Benchmark de Latência**
```typescript
describe('Performance Impact', () => {
  it('should not add significant latency', async () => {
    // Baseline - operação sem debug
    const startBaseline = performance.now();
    await originalFunction(testData);
    const baselineTime = performance.now() - startBaseline;
    
    // With conditional debug
    const startWithDebug = performance.now();  
    await migratedFunction(testData);
    const debugTime = performance.now() - startWithDebug;
    
    // Assert - overhead should be < 10%
    const overhead = (debugTime - baselineTime) / baselineTime;
    expect(overhead).toBeLessThan(0.1);
  });
});
```

### **Cache Performance**
```typescript
describe('Config Cache Performance', () => {
  it('should use cache for repeated calls', async () => {
    // Arrange
    const mockSupabaseCall = jest.fn();
    
    // Act - multiple calls within cache period
    await conditionalDebugLog('Message 1', {});
    await conditionalDebugLog('Message 2', {});
    await conditionalDebugLog('Message 3', {});
    
    // Assert - config should be fetched only once
    expect(mockSupabaseCall).toHaveBeenCalledTimes(1);
  });
});
```

### **Memory Usage**
```typescript
describe('Memory Usage', () => {
  it('should not cause memory leaks with many debug calls', async () => {
    // Arrange
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Act - many debug calls
    for (let i = 0; i < 1000; i++) {
      await conditionalDebugLog(`Message ${i}`, { index: i });
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Assert - memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
  });
});
```

---

## 🖥️ Testes de Interface

### **Admin Toggle Testing**
```typescript
describe('Admin Interface Integration', () => {
  it('should update debug mode via admin interface', async () => {
    // Arrange - login as admin
    await loginAsAdmin();
    
    // Act - toggle debug mode via UI
    const toggleElement = screen.getByLabelText('Modo debug');
    fireEvent.click(toggleElement);
    
    const saveButton = screen.getByText('Salvar');  
    fireEvent.click(saveButton);
    
    // Assert - config should be updated
    const config = await getSystemConfig();
    expect(config.debugMode).toBe(true);
  });
});
```

### **Real-time Effect Testing**
```typescript
describe('Real-time Debug Control', () => {
  it('should affect logging immediately after toggle', async () => {
    // Act - disable debug
    await updateSystemConfig({ debugMode: false });
    
    // Wait for cache invalidation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test immediate effect
    const initialLogCount = await getDebugLogCount();
    await conditionalDebugLog('Should not log', {});
    const afterLogCount = await getDebugLogCount();
    
    // Assert
    expect(afterLogCount).toBe(initialLogCount);
  });
});
```

---

## 🔗 Testes de Integração

### **End-to-End Flow**
```typescript
describe('Complete Debug Flow', () => {
  it('should work end-to-end', async () => {
    // Arrange
    await loginAsAdmin();
    await setDebugMode(true);
    
    // Act - perform admin operation that logs
    await createModuleImplementation(testModuleData);
    
    // Assert - debug log should exist  
    const debugLogs = await queryDebugLogs({
      message_contains: 'Module implementation created'
    });
    
    expect(debugLogs.length).toBeGreaterThan(0);
    expect(debugLogs[0]).toMatchObject({
      level: 'debug',
      module: expect.any(String),
      message: expect.stringContaining('Module implementation created')
    });
  });
});
```

### **Multi-tenant Isolation**
```typescript
describe('Multi-tenant Debug Isolation', () => {
  it('should isolate debug logs per organization', async () => {
    // Arrange - two different tenants
    const tenant1Logs = await queryDebugLogsForTenant('tenant1');
    const tenant2Logs = await queryDebugLogsForTenant('tenant2');
    
    // Assert - logs should be isolated
    expect(tenant1Logs).not.toContain(
      expect.objectContaining({ organization_id: 'tenant2' })
    );
    expect(tenant2Logs).not.toContain(
      expect.objectContaining({ organization_id: 'tenant1' })
    );
  });
});
```

---

## 🚀 Estratégia de Deploy

### **Rollout Gradual**
1. **Development** → Testes completos
2. **Staging** → Validação com dados reais
3. **Production** → Feature flag para rollback rápido

### **Monitoring em Produção**
```typescript
// Métricas a monitorar
const productionMetrics = {
  debugLogVolume: 'Quantidade de debug logs/min',
  configCacheHitRate: 'Taxa de acerto do cache de config',  
  systemPerformance: 'Latência P95 das operações migradas',
  errorRate: 'Taxa de erro em conditionalDebugLog'
};
```

### **Critérios de Rollback**
- Performance degradada > 10%
- Taxa de erro > 1% 
- Volume de debug logs > 10x esperado
- Reclamações de funcionalidade quebrada

## 📋 Checklist de Validação

### **Por Arquivo Migrado:**
- [ ] Testes funcionais passando
- [ ] Performance dentro do esperado
- [ ] Logs condicionais funcionando
- [ ] Sem regressões detectadas

### **Por Fase:**  
- [ ] Todos arquivos da fase validados
- [ ] Interface admin funcionando
- [ ] Cache de configuração otimizado
- [ ] Documentação atualizada

### **Final:**
- [ ] Cobertura de testes > 80%
- [ ] Performance baseline mantida
- [ ] Sistema de rollback testado
- [ ] Equipe treinada no novo sistema