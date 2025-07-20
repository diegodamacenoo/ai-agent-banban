"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRoutes = metricsRoutes;
const metrics_collector_1 = require("../monitoring/metrics-collector");
async function metricsRoutes(fastify) {
    const metricsCollector = fastify.metricsCollector;
    fastify.get('/metrics', async (request, reply) => {
        try {
            const current = metricsCollector.getCurrentMetrics();
            const status = metricsCollector.getHealthStatus();
            if (!current) {
                return reply.status(503).send({
                    error: 'Service Unavailable',
                    message: 'Metrics collection is starting up. Please try again in a few seconds.',
                    status: 'initializing'
                });
            }
            return {
                success: true,
                overview: {
                    status,
                    uptime: current.uptime,
                    requestsPerSecond: current.requestsPerSecond,
                    averageResponseTime: current.averageResponseTime,
                    errorRate: current.errorRate,
                    memoryUsage: current.memoryUsage,
                    activeConnections: current.activeConnections
                },
                endpoints: {
                    current: '/api/metrics/current',
                    history: '/api/metrics/history?minutes=60',
                    aggregated: '/api/metrics/aggregated?minutes=15',
                    health: '/api/metrics/health',
                    tenant: '/api/metrics/tenant/{tenantId}'
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            fastify.log.error('Error getting metrics overview:', error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to retrieve metrics overview'
            });
        }
    });
    fastify.get('/metrics/current', async (request, reply) => {
        try {
            const current = metricsCollector.getCurrentMetrics();
            if (!current) {
                return reply.status(404).send({
                    error: 'No metrics available yet',
                    message: 'Metrics collection is starting up. Please try again in a few seconds.'
                });
            }
            return {
                success: true,
                data: current,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            fastify.log.error('Error getting current metrics:', error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to retrieve current metrics'
            });
        }
    });
    fastify.get('/metrics/history', async (request, reply) => {
        try {
            const minutes = parseInt(request.query.minutes || '60');
            if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
                return reply.status(400).send({
                    error: 'Invalid minutes parameter',
                    message: 'Minutes must be a number between 1 and 1440'
                });
            }
            const history = metricsCollector.getMetricsHistory(minutes);
            return {
                success: true,
                data: history,
                count: history.length,
                timeRange: `${minutes} minutes`,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            fastify.log.error('Error getting metrics history:', error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to retrieve metrics history'
            });
        }
    });
    fastify.get('/metrics/aggregated', async (request, reply) => {
        try {
            const minutes = parseInt(request.query.minutes || '15');
            if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
                return reply.status(400).send({
                    error: 'Invalid minutes parameter',
                    message: 'Minutes must be a number between 1 and 1440'
                });
            }
            const aggregated = metricsCollector.getAggregatedMetrics(minutes);
            if (!aggregated) {
                return reply.status(404).send({
                    error: 'No metrics available',
                    message: 'Not enough data to generate aggregated metrics'
                });
            }
            return {
                success: true,
                data: aggregated,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            fastify.log.error('Error getting aggregated metrics:', error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to retrieve aggregated metrics'
            });
        }
    });
    fastify.get('/metrics/health', async (request, reply) => {
        try {
            const status = metricsCollector.getHealthStatus();
            const current = metricsCollector.getCurrentMetrics();
            return {
                success: true,
                status,
                data: {
                    status,
                    uptime: current?.uptime || 0,
                    activeConnections: current?.activeConnections || 0,
                    memoryUsage: current?.memoryUsage || { used: 0, total: 0, percentage: 0 },
                    lastCheck: new Date().toISOString()
                }
            };
        }
        catch (error) {
            fastify.log.error('Error getting health status:', error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to retrieve health status',
                status: 'critical'
            });
        }
    });
    fastify.get('/metrics/tenant/:tenantId', async (request, reply) => {
        try {
            const { tenantId } = request.params;
            const tenantMetrics = metricsCollector.getTenantMetrics(tenantId);
            return {
                success: true,
                tenantId,
                data: tenantMetrics,
                count: tenantMetrics.length,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            fastify.log.error('Error getting tenant metrics:', error);
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to retrieve tenant metrics'
            });
        }
    });
    if (process.env.NODE_ENV === 'development') {
        fastify.post('/metrics/reset', async (request, reply) => {
            try {
                const newCollector = new metrics_collector_1.MetricsCollector(fastify);
                fastify.metricsCollector = newCollector;
                return {
                    success: true,
                    message: 'Metrics reset successfully',
                    timestamp: new Date().toISOString()
                };
            }
            catch (error) {
                fastify.log.error('Error resetting metrics:', error);
                return reply.status(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to reset metrics'
                });
            }
        });
    }
}
//# sourceMappingURL=metrics.js.map