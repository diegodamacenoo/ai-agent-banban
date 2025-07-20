"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
exports.start = start;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fastify_1 = __importDefault(require("fastify"));
const config_1 = require("config/config");
const index_1 = require("plugins/index");
const index_2 = require("routes/index");
const logger_1 = require("utils/logger");
const metrics_collector_1 = require("monitoring/metrics-collector");
const module_resolver_1 = require("shared/module-loader/module-resolver");
const tenant_manager_1 = require("shared/tenant-manager/tenant-manager");
async function buildServer() {
    console.log('🔧 Building Fastify server...');
    const server = (0, fastify_1.default)({
        logger: {
            level: config_1.config.LOG_LEVEL,
            transport: config_1.config.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname'
                }
            } : undefined
        },
        trustProxy: true,
        bodyLimit: 10485760,
        keepAliveTimeout: 30000,
        connectionTimeout: 0
    });
    console.log('✅ Fastify instance created');
    await (0, index_1.registerPlugins)(server);
    console.log('✅ Plugins registered');
    const metricsCollector = new metrics_collector_1.MetricsCollector(server);
    server.metricsCollector = metricsCollector;
    console.log('✅ Metrics system initialized');
    const moduleResolver = new module_resolver_1.ModuleResolver();
    const tenantManager = new tenant_manager_1.TenantManager();
    server.moduleResolver = moduleResolver;
    server.tenantManager = tenantManager;
    console.log('✅ Multi-tenant module system initialized');
    server.addHook('preHandler', async (request, reply) => {
        const tenantInfo = await tenantManager.resolveTenant(request);
        if (tenantInfo) {
            try {
                const modules = await moduleResolver.resolveModulesForTenant(tenantInfo.id);
                request.tenant = tenantInfo;
                request.tenantModules = modules;
                request.clientType = tenantInfo.clientType;
                logger_1.logger.debug('Tenant and modules resolved', {
                    tenantId: tenantInfo.id,
                    clientType: tenantInfo.clientType,
                    moduleCount: Object.keys(modules).length
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to resolve modules for tenant:', error);
                request.tenant = tenantInfo;
                request.tenantModules = {};
                request.clientType = tenantInfo.clientType;
            }
        }
    });
    console.log('✅ Multi-tenant hooks registered');
    server.register(async function banbanModules(server) {
        const banbanModules = await moduleResolver.resolveModulesForTenant('banban-org-id');
        if (banbanModules.performance) {
            await banbanModules.performance.register(server);
            console.log('✅ BanBan Performance custom module registered');
            console.log('🎯 BanBan Performance endpoints:', banbanModules.performance.getModuleInfo().endpoints);
        }
        if (banbanModules.purchaseFlow) {
            await banbanModules.purchaseFlow.register(server);
            console.log('✅ BanBan Purchase Flow module registered');
            console.log('🎯 BanBan Purchase Flow endpoints:', banbanModules.purchaseFlow.getModuleInfo().endpoints);
        }
        if (banbanModules.inventoryFlow) {
            await banbanModules.inventoryFlow.register(server);
            console.log('✅ BanBan Inventory Flow module registered');
            console.log('🎯 BanBan Inventory Flow endpoints:', banbanModules.inventoryFlow.getModuleInfo().endpoints);
        }
        if (banbanModules.salesFlow) {
            await banbanModules.salesFlow.register(server);
            console.log('✅ BanBan Sales Flow module registered');
            console.log('🎯 BanBan Sales Flow endpoints:', banbanModules.salesFlow.getModuleInfo().endpoints);
        }
        if (banbanModules.transferFlow) {
            await banbanModules.transferFlow.register(server);
            console.log('✅ BanBan Transfer Flow module registered');
            console.log('🎯 BanBan Transfer Flow endpoints:', banbanModules.transferFlow.getModuleInfo().endpoints);
        }
    });
    server.register(async function dynamicModuleRoutes(server) {
        server.get('/api/modules/:module/*', async (request, reply) => {
            const { module } = request.params;
            const tenantModules = request.tenantModules;
            const tenant = request.tenant;
            if (!tenantModules || !tenantModules[module]) {
                return reply.code(404).send({
                    error: 'Module not found',
                    message: `Module '${module}' not available for this tenant`,
                    tenant: tenant?.id || 'unknown'
                });
            }
            return tenantModules[module].handleRequest(request, reply);
        });
        server.get('/api/modules', async (request, reply) => {
            const tenantModules = request.tenantModules;
            const tenant = request.tenant;
            if (!tenantModules) {
                return reply.code(404).send({
                    error: 'No modules available',
                    tenant: tenant?.id || 'unknown'
                });
            }
            const moduleList = Object.keys(tenantModules).map(moduleName => {
                const moduleInstance = tenantModules[moduleName];
                return {
                    name: moduleName,
                    ...moduleInstance.getModuleInfo()
                };
            });
            return {
                success: true,
                tenant: {
                    id: tenant?.id,
                    name: tenant?.name,
                    clientType: tenant?.clientType
                },
                modules: moduleList,
                totalModules: moduleList.length
            };
        });
    });
    console.log('✅ Dynamic module routes registered');
    server.register(async function performanceModule(server) {
        const performanceModule = await moduleResolver.resolveModulesForTenant('standard-client-id');
        if (performanceModule.performance) {
            await performanceModule.performance.register(server, '/api/performance');
            console.log('✅ Performance base module registered at /api/performance');
        }
    });
    await (0, index_2.registerRoutes)(server);
    console.log('✅ Static routes registered');
    server.get('/health', {
        schema: {
            description: 'Health check endpoint',
            tags: ['health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        uptime: { type: 'number' },
                        environment: { type: 'string' },
                        version: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config_1.config.NODE_ENV,
            version: '1.0.0'
        };
    });
    server.get('/info', {
        schema: {
            description: 'Server information endpoint',
            tags: ['info'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        version: { type: 'string' },
                        environment: { type: 'string' },
                        features: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        endpoints: {
                            type: 'object',
                            properties: {
                                health: { type: 'string' },
                                docs: { type: 'string' },
                                api: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return {
            name: 'Axon - Multi-Tenant AI Agents Platform',
            version: '1.0.0',
            environment: config_1.config.NODE_ENV,
            features: [
                'Multi-tenant routing',
                'Custom client support',
                'Modular AI agents',
                'API documentation',
                'Rate limiting',
                'CORS support',
                'Security headers'
            ],
            endpoints: {
                health: '/health',
                docs: '/docs',
                api: '/api'
            }
        };
    });
    server.setErrorHandler((error, request, reply) => {
        server.log.error(error);
        if (error.validation && error.validation.length > 0) {
            const messages = error.validation.map(v => v.message).join('; ');
            return reply.status(400).send({
                success: false,
                error: {
                    type: error.code || 'FST_ERR_VALIDATION',
                    message: `Erro de validação: ${messages}`,
                    timestamp: new Date().toISOString(),
                    details: error.validation
                }
            });
        }
        const message = typeof error === 'string' ? error : (error.message || 'Erro interno do servidor');
        reply.status(error.statusCode || 500).send({
            success: false,
            error: {
                type: error.code || 'INTERNAL_ERROR',
                message,
                timestamp: new Date().toISOString(),
                details: error.validation || undefined
            }
        });
    });
    server.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            success: false,
            error: {
                type: 'NOT_FOUND',
                message: `Endpoint não encontrado: ${request.url}`,
                timestamp: new Date().toISOString()
            }
        });
    });
    return server;
}
async function start() {
    try {
        console.log('🚀 Starting server...');
        console.log('📋 Config:', {
            PORT: config_1.config.PORT,
            HOST: config_1.config.HOST,
            NODE_ENV: config_1.config.NODE_ENV,
            LOG_LEVEL: config_1.config.LOG_LEVEL
        });
        const server = await buildServer();
        console.log('✅ Server built successfully');
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
            try {
                await server.close();
                logger_1.logger.info('Server closed successfully');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        console.log(`🔌 Attempting to listen on ${config_1.config.HOST}:${config_1.config.PORT}...`);
        await server.listen({
            port: config_1.config.PORT,
            host: config_1.config.HOST
        });
        console.log('✅ Server is listening successfully!');
        logger_1.logger.info(`🚀 Server running at http://${config_1.config.HOST}:${config_1.config.PORT}`);
        logger_1.logger.info(`📚 API Documentation available at http://${config_1.config.HOST}:${config_1.config.PORT}/docs`);
        logger_1.logger.info(`💚 Health check at http://${config_1.config.HOST}:${config_1.config.PORT}/health`);
        logger_1.logger.info(`ℹ️  Server info at http://${config_1.config.HOST}:${config_1.config.PORT}/info`);
    }
    catch (error) {
        logger_1.logger.error('Error starting server:', error);
        console.error('❌ Detailed error:', error);
        console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        process.exit(1);
    }
}
if (require.main === module) {
    start();
}
//# sourceMappingURL=index.js.map