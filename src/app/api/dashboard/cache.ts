// Simple in-memory cache for dashboard data
// Em produção, seria recomendado usar Redis ou similar

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DashboardCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Gerar chave de cache baseada no tenant e widget
   */
  private generateKey(tenantId: string, widgetId: string, params?: Record<string, any>): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${tenantId}:${widgetId}:${Buffer.from(paramsStr).toString('base64')}`;
  }

  /**
   * Buscar dados do cache
   */
  get<T = any>(tenantId: string, widgetId: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(tenantId, widgetId, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Salvar dados no cache
   */
  set<T = any>(
    tenantId: string, 
    widgetId: string, 
    data: T, 
    ttl?: number,
    params?: Record<string, any>
  ): void {
    const key = this.generateKey(tenantId, widgetId, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidar cache de um widget específico
   */
  invalidateWidget(tenantId: string, widgetId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:${widgetId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidar todo cache de um tenant
   */
  invalidateTenant(tenantId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    memoryUsage: string;
  } {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      memoryUsage: `${Math.round(JSON.stringify([...this.cache.entries()]).length / 1024)} KB`
    };
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Instância singleton do cache
export const dashboardCache = new DashboardCache();

// Configurar limpeza automática a cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    dashboardCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Hook para cache com fallback
 */
export async function withCache<T>(
  tenantId: string,
  widgetId: string,
  fetcher: () => Promise<T>,
  ttl?: number,
  params?: Record<string, any>
): Promise<T> {
  // Tentar buscar do cache primeiro
  const cached = dashboardCache.get<T>(tenantId, widgetId, params);
  if (cached !== null) {
    return cached;
  }

  // Se não está no cache, executar fetcher
  const data = await fetcher();
  
  // Salvar no cache
  dashboardCache.set(tenantId, widgetId, data, ttl, params);
  
  return data;
}

/**
 * Tipos para configuração de cache
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  invalidateOnUpdate: boolean;
}

/**
 * Configurações de cache por tipo de widget
 */
export const cacheConfigs: Record<string, CacheConfig> = {
  // Widgets de analytics com dados que mudam menos frequentemente
  'performance-kpis': {
    enabled: true,
    ttl: 15 * 60 * 1000, // 15 minutos
    invalidateOnUpdate: true
  },
  
  'sales-overview': {
    enabled: true,
    ttl: 10 * 60 * 1000, // 10 minutos
    invalidateOnUpdate: true
  },

  // Widgets de inventory com dados mais dinâmicos
  'low-stock': {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutos
    invalidateOnUpdate: true
  },

  'abc-analysis': {
    enabled: true,
    ttl: 30 * 60 * 1000, // 30 minutos (dados calculados)
    invalidateOnUpdate: true
  },

  // Widgets de alertas que precisam ser mais atuais
  'active-alerts': {
    enabled: true,
    ttl: 2 * 60 * 1000, // 2 minutos
    invalidateOnUpdate: true
  },

  // Default para widgets não configurados
  'default': {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutos
    invalidateOnUpdate: true
  }
};