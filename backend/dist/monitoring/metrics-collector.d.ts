import { FastifyInstance } from 'fastify';
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
export declare class MetricsCollector {
    private fastify;
    private metrics;
    private globalMetrics;
    private requestCount;
    private errorCount;
    private responseTimeSum;
    private responseTimeCount;
    private activeConnections;
    private startTime;
    constructor(fastify: FastifyInstance);
    private setupHooks;
    private recordTenantMetric;
    private startPeriodicCollection;
    private collectCurrentMetrics;
    private cleanOldMetrics;
    getCurrentMetrics(): MetricData | null;
    getMetricsHistory(minutes?: number): MetricData[];
    getTenantMetrics(tenantId: string): MetricData[];
    getHealthStatus(): 'healthy' | 'warning' | 'critical';
    getAggregatedMetrics(minutes?: number): {
        averageRPS: number;
        averageResponseTime: number;
        averageErrorRate: number;
        maxMemoryUsage: number;
        currentConnections: number;
        dataPoints: number;
        timeRange: string;
        status: "warning" | "healthy" | "critical";
    } | null;
}
//# sourceMappingURL=metrics-collector.d.ts.map