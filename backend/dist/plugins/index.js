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
exports.registerPlugins = registerPlugins;
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
async function registerPlugins(server) {
    const logger = (0, logger_1.createPluginLogger)('registration');
    try {
        if (config_1.config.CORS_ORIGIN) {
            await server.register(Promise.resolve().then(() => __importStar(require('@fastify/cors'))), {
                origin: config_1.config.CORS_ORIGIN,
                credentials: config_1.config.CORS_CREDENTIALS,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Requested-With',
                    'X-Client-Type',
                    'X-Tenant-Id',
                    'X-Organization-Name',
                    'X-API-Version'
                ]
            });
            logger.info('CORS plugin registered');
        }
        await server.register(Promise.resolve().then(() => __importStar(require('./auth'))));
        logger.info('JWT authentication plugin registered');
        if (config_1.config.ENABLE_HELMET) {
            await server.register(Promise.resolve().then(() => __importStar(require('@fastify/helmet'))), {
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:4000', 'https://*.supabase.co'],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        scriptSrc: ["'self'"],
                        objectSrc: ["'none'"],
                        imgSrc: ["'self'", "data:", "https:"],
                        fontSrc: ["'self'"]
                    }
                },
                crossOriginEmbedderPolicy: false
            });
            logger.info('Helmet security plugin registered');
        }
        if (config_1.config.ENABLE_RATE_LIMIT) {
            await server.register(Promise.resolve().then(() => __importStar(require('@fastify/rate-limit'))), {
                max: config_1.config.RATE_LIMIT_MAX,
                timeWindow: config_1.config.RATE_LIMIT_WINDOW,
                allowList: ['127.0.0.1', '::1'],
                keyGenerator: (request) => {
                    const tenantId = request.headers['x-tenant-id'];
                    const clientIp = request.ip;
                    return tenantId ? `${clientIp}:${tenantId}` : clientIp;
                },
                errorResponseBuilder: (request, context) => {
                    return {
                        code: 'RATE_LIMIT_EXCEEDED',
                        error: 'Rate limit exceeded',
                        message: `Too many requests. Limit: ${context.max} requests per window`,
                        retryAfter: context.ttl
                    };
                }
            });
            logger.info('Rate limiting plugin registered');
        }
        if (config_1.config.ENABLE_SWAGGER) {
            const fastifySwagger = await Promise.resolve().then(() => __importStar(require('@fastify/swagger')));
            await server.register(fastifySwagger.default, {
                swagger: {
                    info: {
                        title: 'BanBan AI Agent - Multi-Tenant Backend API',
                        description: 'API backend para sistema multi-tenant que suporta clientes customizados e padrão',
                        version: '1.0.0',
                        contact: {
                            name: 'BanBan AI Agent Team',
                            email: 'dev@banban.ai'
                        },
                        license: {
                            name: 'MIT',
                            url: 'https://opensource.org/licenses/MIT'
                        }
                    },
                    host: `${config_1.config.HOST}:${config_1.config.PORT}`,
                    schemes: ['http', 'https'],
                    consumes: ['application/json'],
                    produces: ['application/json'],
                    tags: [
                        { name: 'health', description: 'Health check endpoints' },
                        { name: 'info', description: 'Server information endpoints' },
                        { name: 'api', description: 'Main API endpoints' },
                        { name: 'multi-tenant', description: 'Multi-tenant specific endpoints' },
                        { name: 'custom', description: 'Custom client endpoints' },
                        { name: 'standard', description: 'Standard SaaS endpoints' }
                    ],
                    securityDefinitions: {
                        Bearer: {
                            type: 'apiKey',
                            name: 'Authorization',
                            in: 'header',
                            description: 'Enter: Bearer {token}'
                        }
                    },
                    security: [{ Bearer: [] }]
                }
            });
            const fastifySwaggerUi = await Promise.resolve().then(() => __importStar(require('@fastify/swagger-ui')));
            await server.register(fastifySwaggerUi.default, {
                routePrefix: '/docs',
                uiConfig: {
                    docExpansion: 'list',
                    deepLinking: false,
                    defaultModelsExpandDepth: 1,
                    defaultModelExpandDepth: 1
                },
                staticCSP: true,
                transformStaticCSP: (header) => header,
                transformSpecification: (swaggerObject, request, reply) => {
                    return swaggerObject;
                },
                transformSpecificationClone: true
            });
            logger.info('Swagger documentation plugin registered');
        }
        await server.register(async function multiTenantPlugin(server) {
            server.decorateRequest('tenant', null);
            server.decorateRequest('clientType', null);
            server.addHook('preHandler', async (request, reply) => {
                const tenantId = request.headers['x-tenant-id'];
                const clientType = request.headers['x-client-type'] || config_1.config.DEFAULT_CLIENT_TYPE;
                request.tenant = {
                    id: tenantId,
                    clientType
                };
                request.clientType = clientType;
                if (tenantId) {
                    request.log.info({
                        tenantId,
                        clientType,
                        method: request.method,
                        url: request.url
                    }, 'Multi-tenant request');
                }
            });
        });
        logger.info('Multi-tenant plugin registered');
        logger.info('All plugins registered successfully');
    }
    catch (error) {
        logger.error('Error registering plugins:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map