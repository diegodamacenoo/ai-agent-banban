"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const cron = __importStar(require("node-cron"));
class MetricsCollector {
    constructor(fastify) {
        this.fastify = fastify;
        this.metrics = new Map();
        this.globalMetrics = [];
        this.requestCount = 0;
        this.errorCount = 0;
        this.responseTimeSum = 0;
        this.responseTimeCount = 0;
        this.activeConnections = 0;
        this.startTime = Date.now();
        this.setupHooks();
        this.startPeriodicCollection();
    }
    setupHooks() {
        this.fastify.addHook('onRequest', async (request, reply) => {
            this.activeConnections++;
            request.startTime = Date.now();
        });
        this.fastify.addHook('onResponse', async (request, reply) => {
            this.activeConnections--;
            this.requestCount++;
            const startTime = request.startTime || Date.now();
            const responseTime = Date.now() - startTime;
            this.responseTimeSum += responseTime;
            this.responseTimeCount++;
            if (reply.statusCode >= 400) {
                this.errorCount++;
            }
            const tenantId = request.headers['x-tenant-id'];
            if (tenantId) {
                this.recordTenantMetric(tenantId, responseTime, reply.statusCode >= 400);
            }
        });
        this.fastify.addHook('onError', async (request, reply, error) => {
            this.errorCount++;
            this.fastify.log.error('Request error:', error);
        });
    }
    recordTenantMetric(tenantId, responseTime, isError) {
        if (!this.metrics.has(tenantId)) {
            this.metrics.set(tenantId, []);
        }
    }
    startPeriodicCollection() {
        cron.schedule('*/30 * * * * *', () => {
            this.collectCurrentMetrics();
        });
        cron.schedule('0 * * * *', () => {
            this.cleanOldMetrics();
        });
    }
    collectCurrentMetrics() {
        const now = Date.now();
        const memUsage = process.memoryUsage();
        const recentMetrics = this.globalMetrics.filter(m => now - m.timestamp < 30000);
        const requestsLast30s = recentMetrics.reduce((sum, m) => sum + m.requestsPerSecond, 0);
        const currentMetric = {
            timestamp: now,
            requestsPerSecond: this.requestCount / 30,
            averageResponseTime: this.responseTimeCount > 0 ? this.responseTimeSum / this.responseTimeCount : 0,
            errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
            memoryUsage: {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
            },
            cpuUsage: process.cpuUsage().user / 1000000,
            activeConnections: this.activeConnections,
            uptime: (now - this.startTime) / 1000
        };
        this.globalMetrics.push(currentMetric);
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
    cleanOldMetrics() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.globalMetrics = this.globalMetrics.filter(m => m.timestamp > oneHourAgo);
        for (const [tenantId, metrics] of this.metrics.entries()) {
            const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo);
            if (recentMetrics.length === 0) {
                this.metrics.delete(tenantId);
            }
            else {
                this.metrics.set(tenantId, recentMetrics);
            }
        }
        this.fastify.log.info('Old metrics cleaned up');
    }
    getCurrentMetrics() {
        return this.globalMetrics[this.globalMetrics.length - 1] || null;
    }
    getMetricsHistory(minutes = 60) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.globalMetrics.filter(m => m.timestamp > cutoff);
    }
    getTenantMetrics(tenantId) {
        return this.metrics.get(tenantId) || [];
    }
    getHealthStatus() {
        const current = this.getCurrentMetrics();
        if (!current)
            return 'healthy';
        if (current.errorRate > 0.1 || current.averageResponseTime > 5000 || current.memoryUsage.percentage > 90) {
            return 'critical';
        }
        if (current.errorRate > 0.05 || current.averageResponseTime > 2000 || current.memoryUsage.percentage > 75) {
            return 'warning';
        }
        return 'healthy';
    }
    getAggregatedMetrics(minutes = 15) {
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
            averageErrorRate: Math.round(avgErrorRate * 10000) / 100,
            maxMemoryUsage: Math.round(maxMemoryUsage * 100) / 100,
            currentConnections,
            dataPoints: history.length,
            timeRange: `${minutes} minutes`,
            status: this.getHealthStatus()
        };
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metrics-collector.js.map