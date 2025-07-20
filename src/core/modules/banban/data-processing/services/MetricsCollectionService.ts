import { BanbanLogger, BanbanMetrics } from '../../index';
import {
  ProcessingMetrics,
  EventType,
  EdgeFunctionType,
  ProcessingStatus,
  HealthCheckResult
} from '../types';

/**
 * Serviço especializado para coleta e análise de métricas de processamento
 * Responsável por agregação, análise temporal e relatórios de performance
 */
export class MetricsCollectionService {
  private logger: BanbanLogger;
  private metricsHistory: Map<string, any[]> = new Map();
  private startTime: number = Date.now();
  private lastCleanup: number = Date.now();
  private readonly METRICS_RETENTION = 7200000; // 2 horas
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutos

  constructor() {
    this.logger = BanbanLogger.getInstance();
    this.initializeMetricsCollection();
  }

  /**
   * Inicializa a coleta de métricas
   */
  private initializeMetricsCollection(): void {
    // Configurar limpeza automática de métricas antigas
    setInterval(() => {
      this.cleanupOldMetrics();
    }, this.CLEANUP_INTERVAL);

    this.logger.info('data-processing', 'Metrics collection service initialized', {
      retentionMs: this.METRICS_RETENTION,
      cleanupIntervalMs: this.CLEANUP_INTERVAL
    });
  }

  /**
   * Registra métricas de processamento de evento
   */
  recordEventProcessing(
    eventType: EventType,
    edgeFunction: EdgeFunctionType,
    processingTimeMs: number,
    success: boolean,
    triggeredActions: string[] = []
  ): void {
    const timestamp = new Date().toISOString();
    const metric = {
      timestamp,
      eventType,
      edgeFunction,
      processingTimeMs,
      success,
      triggeredActionsCount: triggeredActions.length,
      triggeredActions
    };

    // Registrar no sistema de métricas do Banban
    BanbanMetrics.record('data-processing', 'event_processed', 1, {
      event_type: eventType,
      edge_function: edgeFunction,
      status: success ? 'success' : 'error'
    });

    BanbanMetrics.record('data-processing', 'processing_time', processingTimeMs, {
      event_type: eventType,
      edge_function: edgeFunction
    });

    BanbanMetrics.record('data-processing', 'triggered_actions', triggeredActions.length, {
      event_type: eventType
    });

    // Armazenar no histórico local para análises
    this.addToHistory('event_processing', metric);

    this.logger.info('data-processing', 'Event processing metrics recorded', {
      eventType,
      edgeFunction,
      processingTimeMs,
      success,
      triggeredActionsCount: triggeredActions.length
    });
  }

  /**
   * Registra métricas de batch processing
   */
  recordBatchProcessing(
    batchSize: number,
    processingTimeMs: number,
    successCount: number,
    failureCount: number
  ): void {
    const timestamp = new Date().toISOString();
    const successRate = (successCount / batchSize) * 100;
    
    const metric = {
      timestamp,
      batchSize,
      processingTimeMs,
      successCount,
      failureCount,
      successRate
    };

    // Registrar métricas de batch
    BanbanMetrics.record('data-processing', 'batch_processed', 1, {
      batch_size: batchSize.toString(),
      success_rate: successRate.toString()
    });

    BanbanMetrics.record('data-processing', 'batch_processing_time', processingTimeMs, {
      batch_size: batchSize.toString()
    });

    this.addToHistory('batch_processing', metric);

    this.logger.info('data-processing', 'Batch processing metrics recorded', {
      batchSize,
      processingTimeMs,
      successRate: `${successRate.toFixed(2)}%`
    });
  }

  /**
   * Registra métricas de validação
   */
  recordValidationMetrics(
    eventType: EventType,
    isValid: boolean,
    errorsCount: number,
    warningsCount: number,
    validationTimeMs: number
  ): void {
    const timestamp = new Date().toISOString();
    const metric = {
      timestamp,
      eventType,
      isValid,
      errorsCount,
      warningsCount,
      validationTimeMs
    };

    BanbanMetrics.record('data-processing', 'validation_performed', 1, {
      event_type: eventType,
      status: isValid ? 'valid' : 'invalid'
    });

    BanbanMetrics.record('data-processing', 'validation_time', validationTimeMs, {
      event_type: eventType
    });

    if (errorsCount > 0) {
      BanbanMetrics.record('data-processing', 'validation_errors', errorsCount, {
        event_type: eventType
      });
    }

    if (warningsCount > 0) {
      BanbanMetrics.record('data-processing', 'validation_warnings', warningsCount, {
        event_type: eventType
      });
    }

    this.addToHistory('validation', metric);
  }

  /**
   * Obtém métricas consolidadas de processamento
   */
  getProcessingMetrics(): ProcessingMetrics {
    const eventHistory = this.getHistory('event_processing');
    const batchHistory = this.getHistory('batch_processing');
    
    if (eventHistory.length === 0) {
      return {
        totalEventsProcessed: 0,
        successfulEvents: 0,
        failedEvents: 0,
        averageProcessingTime: 0,
        eventsByType: {} as Record<EventType, number>,
        errorsByType: {},
        lastProcessedAt: new Date().toISOString()
      };
    }

    const totalEvents = eventHistory.length;
    const successfulEvents = eventHistory.filter(e => e.success).length;
    const failedEvents = totalEvents - successfulEvents;
    const averageProcessingTime = eventHistory.reduce((sum, e) => sum + e.processingTimeMs, 0) / totalEvents;

    // Agrupar por tipo de evento
    const eventsByType: Record<EventType, number> = {} as Record<EventType, number>;
    const errorsByType: Record<string, number> = {};

    eventHistory.forEach(event => {
      const eventType = event.eventType as EventType;
      eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
      
      if (!event.success) {
        const errorKey = `${eventType}_errors`;
        errorsByType[errorKey] = (errorsByType[errorKey] || 0) + 1;
      }
    });

    const lastProcessedAt = eventHistory[eventHistory.length - 1]?.timestamp || new Date().toISOString();

    return {
      totalEventsProcessed: totalEvents,
      successfulEvents,
      failedEvents,
      averageProcessingTime: Math.round(averageProcessingTime),
      eventsByType,
      errorsByType,
      lastProcessedAt
    };
  }

  /**
   * Obtém métricas de performance por Edge Function
   */
  getEdgeFunctionMetrics(): Record<EdgeFunctionType, {
    totalEvents: number;
    averageProcessingTime: number;
    successRate: number;
    mostCommonEventType: EventType | null;
  }> {
    const eventHistory = this.getHistory('event_processing');
    const metrics: Record<EdgeFunctionType, any> = {} as Record<EdgeFunctionType, any>;

    // Agrupar por Edge Function
    const groupedByFunction: Record<EdgeFunctionType, any[]> = {} as Record<EdgeFunctionType, any[]>;
    
    eventHistory.forEach(event => {
      const edgeFunction = event.edgeFunction as EdgeFunctionType;
      if (!groupedByFunction[edgeFunction]) {
        groupedByFunction[edgeFunction] = [];
      }
      groupedByFunction[edgeFunction].push(event);
    });

    // Calcular métricas para cada Edge Function
    Object.entries(groupedByFunction).forEach(([edgeFunction, events]) => {
      const totalEvents = events.length;
      const successfulEvents = events.filter(e => e.success).length;
      const successRate = (successfulEvents / totalEvents) * 100;
      const averageProcessingTime = events.reduce((sum, e) => sum + e.processingTimeMs, 0) / totalEvents;

      // Encontrar tipo de evento mais comum
      const eventTypeCounts: Record<EventType, number> = {} as Record<EventType, number>;
      events.forEach(event => {
        const eventType = event.eventType as EventType;
        eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;
      });

      const mostCommonEventType = Object.entries(eventTypeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as EventType || null;

      metrics[edgeFunction as EdgeFunctionType] = {
        totalEvents,
        averageProcessingTime: Math.round(averageProcessingTime),
        successRate: Math.round(successRate * 100) / 100,
        mostCommonEventType
      };
    });

    return metrics;
  }

  /**
   * Obtém métricas de tendências temporais
   */
  getTemporalMetrics(intervalMinutes: number = 10): {
    intervals: string[];
    eventsPerInterval: number[];
    averageProcessingTimePerInterval: number[];
    successRatePerInterval: number[];
  } {
    const eventHistory = this.getHistory('event_processing');
    const now = Date.now();
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervals: string[] = [];
    const eventsPerInterval: number[] = [];
    const averageProcessingTimePerInterval: number[] = [];
    const successRatePerInterval: number[] = [];

    // Criar intervalos das últimas 2 horas
    const numberOfIntervals = Math.ceil(this.METRICS_RETENTION / intervalMs);
    
    for (let i = numberOfIntervals - 1; i >= 0; i--) {
      const intervalStart = now - (i + 1) * intervalMs;
      const intervalEnd = now - i * intervalMs;
      const intervalLabel = new Date(intervalEnd).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

      // Filtrar eventos neste intervalo
      const intervalEvents = eventHistory.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= intervalStart && eventTime < intervalEnd;
      });

      intervals.push(intervalLabel);
      eventsPerInterval.push(intervalEvents.length);

      if (intervalEvents.length > 0) {
        const avgProcessingTime = intervalEvents.reduce((sum, e) => sum + e.processingTimeMs, 0) / intervalEvents.length;
        const successCount = intervalEvents.filter(e => e.success).length;
        const successRate = (successCount / intervalEvents.length) * 100;

        averageProcessingTimePerInterval.push(Math.round(avgProcessingTime));
        successRatePerInterval.push(Math.round(successRate * 100) / 100);
      } else {
        averageProcessingTimePerInterval.push(0);
        successRatePerInterval.push(0);
      }
    }

    return {
      intervals,
      eventsPerInterval,
      averageProcessingTimePerInterval,
      successRatePerInterval
    };
  }

  /**
   * Obtém métricas de health check
   */
  getHealthMetrics(): HealthCheckResult {
    try {
      const processingMetrics = this.getProcessingMetrics();
      const uptime = Date.now() - this.startTime;
      const memoryUsage = process.memoryUsage?.()?.heapUsed || 0;

      // Calcular health score baseado em métricas
      const successRate = processingMetrics.totalEventsProcessed > 0 
        ? (processingMetrics.successfulEvents / processingMetrics.totalEventsProcessed) * 100 
        : 100;

      const avgProcessingTime = processingMetrics.averageProcessingTime;
      const isHealthy = successRate >= 95 && avgProcessingTime < 5000; // 95% success rate, <5s processing

      return {
        healthy: isHealthy,
        details: {
          module: 'banban-data-processing',
          status: isHealthy ? 'healthy' : 'degraded',
          metricsCount: processingMetrics.totalEventsProcessed,
          lastActivity: processingMetrics.lastProcessedAt,
          uptime: Math.round(uptime / 1000), // segundos
          memoryUsage: Math.round(memoryUsage / 1024 / 1024) // MB
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          module: 'banban-data-processing',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Obtém relatório completo de métricas
   */
  getComprehensiveReport(): {
    summary: ProcessingMetrics;
    edgeFunctions: Record<EdgeFunctionType, any>;
    temporal: any;
    health: HealthCheckResult;
    system: {
      uptime: number;
      memoryUsage: number;
      metricsRetention: number;
      lastCleanup: string;
    };
  } {
    return {
      summary: this.getProcessingMetrics(),
      edgeFunctions: this.getEdgeFunctionMetrics(),
      temporal: this.getTemporalMetrics(),
      health: this.getHealthMetrics(),
      system: {
        uptime: Math.round((Date.now() - this.startTime) / 1000),
        memoryUsage: Math.round((process.memoryUsage?.()?.heapUsed || 0) / 1024 / 1024),
        metricsRetention: this.METRICS_RETENTION,
        lastCleanup: new Date(this.lastCleanup).toISOString()
      }
    };
  }

  /**
   * Exporta métricas para análise externa
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const report = this.getComprehensiveReport();
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // Formato CSV (simplificado)
    const eventHistory = this.getHistory('event_processing');
    const csvHeaders = 'timestamp,eventType,edgeFunction,processingTimeMs,success,triggeredActionsCount';
    const csvRows = eventHistory.map(event => 
      `${event.timestamp},${event.eventType},${event.edgeFunction},${event.processingTimeMs},${event.success},${event.triggeredActionsCount}`
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  // ================================================
  // MÉTODOS PRIVADOS
  // ================================================

  /**
   * Adiciona métrica ao histórico
   */
  private addToHistory(category: string, metric: any): void {
    if (!this.metricsHistory.has(category)) {
      this.metricsHistory.set(category, []);
    }

    const history = this.metricsHistory.get(category)!;
    history.push(metric);

    // Limitar tamanho do histórico (máximo 10000 entradas por categoria)
    if (history.length > 10000) {
      history.splice(0, history.length - 10000);
    }
  }

  /**
   * Obtém histórico de uma categoria
   */
  private getHistory(category: string): any[] {
    return this.metricsHistory.get(category) || [];
  }

  /**
   * Limpa métricas antigas
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.METRICS_RETENTION;
    let totalCleaned = 0;

    this.metricsHistory.forEach((history, category) => {
      const originalLength = history.length;
      
      // Filtrar métricas dentro do período de retenção
      const filteredHistory = history.filter(metric => {
        const metricTime = new Date(metric.timestamp).getTime();
        return metricTime >= cutoff;
      });

      this.metricsHistory.set(category, filteredHistory);
      
      const cleaned = originalLength - filteredHistory.length;
      totalCleaned += cleaned;
    });

    this.lastCleanup = Date.now();

    if (totalCleaned > 0) {
      this.logger.info('data-processing', 'Old metrics cleaned up', {
        cleanedMetrics: totalCleaned,
        retentionMs: this.METRICS_RETENTION
      });
    }
  }

  /**
   * Reset das métricas (usado para testes)
   */
  resetMetrics(): void {
    this.metricsHistory.clear();
    this.startTime = Date.now();
    this.lastCleanup = Date.now();
    
    this.logger.warn('data-processing', 'All metrics have been reset');
  }
}