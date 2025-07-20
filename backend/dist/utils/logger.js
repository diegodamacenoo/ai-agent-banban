"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.logAudit = exports.logPerformance = exports.logError = exports.createPluginLogger = exports.createRouteLogger = exports.createTenantLogger = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config/config");
const logger = (0, pino_1.default)({
    level: (0, config_1.getEnvironmentConfig)().LOG_LEVEL,
    transport: config_1.config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
        }
    } : undefined,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        }
    },
    serializers: {
        err: pino_1.default.stdSerializers.err
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME || 'unknown',
        service: 'banban-backend-fastify',
        version: '1.0.0'
    }
});
exports.logger = logger;
const createTenantLogger = (tenantId, clientType) => {
    return logger.child({
        tenantId,
        clientType,
        component: 'multi-tenant'
    });
};
exports.createTenantLogger = createTenantLogger;
const createRouteLogger = (method, path, requestId) => {
    return logger.child({
        method,
        path,
        requestId,
        component: 'route'
    });
};
exports.createRouteLogger = createRouteLogger;
const createPluginLogger = (pluginName) => {
    return logger.child({
        plugin: pluginName,
        component: 'plugin'
    });
};
exports.createPluginLogger = createPluginLogger;
const logError = (error, context) => {
    logger.error({
        err: error,
        stack: error.stack,
        ...context
    }, error.message);
};
exports.logError = logError;
const logPerformance = (operation, duration, context) => {
    logger.info({
        operation,
        duration,
        unit: 'ms',
        component: 'performance',
        ...context
    }, `Operation ${operation} completed in ${duration}ms`);
};
exports.logPerformance = logPerformance;
const logAudit = (action, userId, tenantId, details) => {
    logger.info({
        action,
        userId,
        tenantId,
        component: 'audit',
        timestamp: new Date().toISOString(),
        ...details
    }, `Audit: ${action}`);
};
exports.logAudit = logAudit;
//# sourceMappingURL=logger.js.map