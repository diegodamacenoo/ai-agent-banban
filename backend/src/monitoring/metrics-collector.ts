import { FastifyInstance } from 'fastify';
import * as cron from 'node-cron';

export interface MetricData {
  timestamp: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  uptime: number;
}

export interface TenantMetrics extends MetricData {
  tenantId: string;
  organizationName: string;
  clientType: 'standard' | 'custom';
}

export class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private globalMetrics: MetricData[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeSum = 0;
  private responseTimeCount = 0;
  private activeConnections = 0;
  private startTime = Date.now();

  constructor(private fastify: FastifyInstance) {
    this.setupHooks();
    this.startPeriodicCollection();
  }

  private setupHooks() {
    // Hook para contar requisições e medir tempo de resposta
    this.fastify.addHook('onRequest', async (request, reply) => {
      this.activeConnections++;
      (request as any).startTime = Date.now();
    });

    this.fastify.addHook('onResponse', async (request, reply) => {
      this.activeConnections--;
      this.requestCount++;
      
      const startTime = (request as any).startTime || Date.now();
      const responseTime = Date.now() - startTime;
      this.responseTimeSum += responseTime;
      this.responseTimeCount++;

      // Contar erros (status >= 400)
      if (reply.statusCode >= 400) {
        this.errorCount++;
      }

      // Métricas por tenant se disponível
      const tenantId = request.headers['x-tenant-id'] as string;
      if (tenantId) {
        this.recordTenantMetric(tenantId, responseTime, reply.statusCode >= 400);
      }
    });

    this.fastify.addHook('onError', async (request, reply, error) => {
      this.errorCount++;
      this.fastify.log.error('Request error:', error);
    });
  }

  private recordTenantMetric(tenantId: string, responseTime: number, isError: boolean) {
    // Implementação simplificada - em produção usaria Redis ou banco de dados
    if (!this.metrics.has(tenantId)) {
      this.metrics.set(tenantId, []);
    }
    // Lógica para agregar métricas por tenant seria implementada aqui
  }

  private startPeriodicCollection() {
    // Coleta métricas a cada 30 segundos
    cron.schedule('*/30 * * * * *', () => {
      this.collectCurrentMetrics();
    });

    // Limpeza de métricas antigas a cada hora
    cron.schedule('0 * * * *', () => {
      this.cleanOldMetrics();
    });
  }

  private collectCurrentMetrics() {
    const now = Date.now();
    const memUsage = process.memoryUsage();
    
    // Calcular RPS dos últimos 30 segundos
    const recentMetrics = this.globalMetrics.filter(m => now - m.timestamp < 30000);
    const requestsLast30s = recentMetrics.reduce((sum, m) => sum + m.requestsPerSecond, 0);

    const currentMetric: MetricData = {
      timestamp: now,
      requestsPerSecond: this.requestCount / 30, // Aproximação
      averageResponseTime: this.responseTimeCount > 0 ? this.responseTimeSum / this.responseTimeCount : 0,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpuUsage: process.cpuUsage().user / 1000000, // Conversão para segundos
      activeConnections: this.activeConnections,
      uptime: (now - this.startTime) / 1000 // Em segundos
    };

    this.globalMetrics.push(currentMetric);

    // Reset dos contadores para próximo período
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.responseTimeCount = 0;

    this.fastify.log.info('Metrics collected:', {
      rps: currentMetric.requestsPerSecond,
      avgResponseTime: currentMetric.averageResponseTime,
      errorRate: currentMetric.errorRate,
      memoryUsage: `${currentMetric.memoryUsage.percentage.toFixed(1)}%`
    });
  }

  private cleanOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Manter apenas métricas da última hora
    this.globalMetrics = this.globalMetrics.filter(m => m.timestamp > oneHourAgo);
    
    // Limpar métricas de tenants
    for (const [tenantId, metrics] of this.metrics.entries()) {
      const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo);
      if (recentMetrics.length === 0) {
        this.metrics.delete(tenantId);
      } else {
        this.metrics.set(tenantId, recentMetrics);
      }
    }

    this.fastify.log.info('Old metrics cleaned up');
  }

  // Métodos públicos para acessar métricas
  getCurrentMetrics(): MetricData | null {
    return this.globalMetrics[this.globalMetrics.length - 1] || null;
  }

  getMetricsHistory(minutes: number = 60): MetricData[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.globalMetrics.filter(m => m.timestamp > cutoff);
  }

  getTenantMetrics(tenantId: string): MetricData[] {
    return this.metrics.get(tenantId) || [];
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const current = this.getCurrentMetrics();
    if (!current) return 'healthy';

    // Critérios de saúde
    if (current.errorRate > 0.1 || current.averageResponseTime > 5000 || current.memoryUsage.percentage > 90) {
      return 'critical';
    }
    
    if (current.errorRate > 0.05 || current.averageResponseTime > 2000 || current.memoryUsage.percentage > 75) {
      return 'warning';
    }

    return 'healthy';
  }

  // Métricas agregadas para dashboard
  getAggregatedMetrics(minutes: number = 15) {
    const history = this.getMetricsHistory(minutes);
    
    if (history.length === 0) {
      return null;
    }

    const avgRPS = history.reduce((sum, m) => sum + m.requestsPerSecond, 0) / history.length;
    const avgResponseTime = history.reduce((sum, m) => sum + m.averageResponseTime, 0) / history.length;
    const avgErrorRate = history.reduce((sum, m) => sum + m.errorRate, 0) / history.length;
    const maxMemoryUsage = Math.max(...history.map(m => m.memoryUsage.percentage));
    const currentConnections = this.activeConnections;

    return {
      averageRPS: Math.round(avgRPS * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime),
      averageErrorRate: Math.round(avgErrorRate * 10000) / 100, // Percentual
      maxMemoryUsage: Math.round(maxMemoryUsage * 100) / 100,
      currentConnections,
      dataPoints: history.length,
      timeRange: `${minutes} minutes`,
      status: this.getHealthStatus()
    };
  }
} 