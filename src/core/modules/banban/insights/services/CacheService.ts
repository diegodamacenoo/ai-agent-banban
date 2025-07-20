// ================================================
// CACHE SERVICE - MÓDULO BANBAN INSIGHTS
// ================================================

import type { 
  CacheEntry,
  CacheManager,
  BanbanInsight
} from '../types';

export class CacheService implements CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxEntries: number = 1000;
  private defaultTTL: number = 1800000; // 30 minutos

  constructor(maxEntries?: number, defaultTTL?: number) {
    if (maxEntries) this.maxEntries = maxEntries;
    if (defaultTTL) this.defaultTTL = defaultTTL;
  }

  /**
   * Obtém um item do cache
   */
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se o item expirou
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  /**
   * Armazena um item no cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // Limpar cache se estiver cheio
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      organizationId: this.extractOrganizationId(key)
    };

    this.cache.set(key, entry);
  }

  /**
   * Remove um item do cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Limpa cache de uma organização específica
   */
  async clearOrganization(organizationId: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.organizationId === organizationId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    size: number;
    maxEntries: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hitRate: this.calculateHitRate(),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Remove a entrada mais antiga quando o cache está cheio
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Extrai o ID da organização da chave do cache
   */
  private extractOrganizationId(key: string): string {
    // Assumindo formato: "insights:organizationId:tipo"
    const parts = key.split(':');
    return parts.length > 1 ? parts[1] : 'unknown';
  }

  /**
   * Calcula taxa de acerto do cache (simplificado)
   */
  private calculateHitRate(): number {
    // Em uma implementação real, isso seria rastreado
    return 0.75; // 75% mock
  }
}

/**
 * Classe especializada para cache de insights
 */
export class InsightsCacheService extends CacheService {
  private static instance: InsightsCacheService;

  static getInstance(): InsightsCacheService {
    if (!InsightsCacheService.instance) {
      InsightsCacheService.instance = new InsightsCacheService(500, 1800000); // 30 min TTL
    }
    return InsightsCacheService.instance;
  }

  /**
   * Gera chave de cache para insights
   */
  private generateInsightsKey(organizationId: string, filters?: any): string {
    const filterHash = filters ? this.hashObject(filters) : 'default';
    return `insights:${organizationId}:${filterHash}`;
  }

  /**
   * Obtém insights do cache
   */
  async getInsights(organizationId: string, filters?: any): Promise<BanbanInsight[] | null> {
    const key = this.generateInsightsKey(organizationId, filters);
    const entry = await this.get<BanbanInsight[]>(key);
    return entry ? entry.data : null;
  }

  /**
   * Armazena insights no cache
   */
  async setInsights(
    organizationId: string, 
    insights: BanbanInsight[], 
    filters?: any,
    ttl?: number
  ): Promise<void> {
    const key = this.generateInsightsKey(organizationId, filters);
    await this.set(key, insights, ttl);
  }

  /**
   * Remove insights do cache
   */
  async invalidateInsights(organizationId: string, filters?: any): Promise<void> {
    const key = this.generateInsightsKey(organizationId, filters);
    await this.delete(key);
  }

  /**
   * Cache para análises específicas
   */
  async getCachedAnalysis<T>(
    type: 'category' | 'customer' | 'store' | 'forecast',
    organizationId: string,
    params?: any
  ): Promise<T | null> {
    const key = `analysis:${type}:${organizationId}:${this.hashObject(params)}`;
    const entry = await this.get<T>(key);
    return entry ? entry.data : null;
  }

  /**
   * Armazena análise no cache
   */
  async setCachedAnalysis<T>(
    type: 'category' | 'customer' | 'store' | 'forecast',
    organizationId: string,
    data: T,
    params?: any,
    ttl?: number
  ): Promise<void> {
    const key = `analysis:${type}:${organizationId}:${this.hashObject(params)}`;
    await this.set(key, data, ttl || 3600000); // 1 hora para análises
  }

  /**
   * Gera hash simples de um objeto
   */
  private hashObject(obj: any): string {
    if (!obj) return 'empty';
    
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Pré-aquece o cache com dados frequentemente acessados
   */
  async warmup(organizationId: string): Promise<void> {
    // Em uma implementação real, isso carregaria dados comuns
    console.info(`[CACHE] Warming up cache for organization ${organizationId}`);
    
    // Mock: pré-carregar alguns tipos de análise
    const commonAnalysisTypes = ['category', 'customer', 'store'] as const;
    
    for (const type of commonAnalysisTypes) {
      const key = `analysis:${type}:${organizationId}:warmup`;
      await this.set(key, { warmed: true, timestamp: Date.now() }, 7200000); // 2 horas
    }
  }

  /**
   * Obtém métricas específicas do cache de insights
   */
  getInsightsCacheMetrics(): {
    totalInsights: number;
    organizationsCount: number;
    averageInsightsPerOrg: number;
    cacheEfficiency: number;
  } {
    const stats = this.getStats();
    let totalInsights = 0;
    const organizations = new Set<string>();

    // Usar método público para acessar dados do cache
    const cacheData = this.getAllEntries();
    for (const entry of cacheData) {
      if (Array.isArray(entry.data)) {
        totalInsights += entry.data.length;
      }
      organizations.add(entry.organizationId);
    }

    return {
      totalInsights,
      organizationsCount: organizations.size,
      averageInsightsPerOrg: organizations.size > 0 ? totalInsights / organizations.size : 0,
      cacheEfficiency: stats.hitRate
    };
  }

  /**
   * Método público para obter todas as entradas do cache
   */
  private getAllEntries(): CacheEntry<any>[] {
    return Array.from((this as any).cache.values());
  }
} 