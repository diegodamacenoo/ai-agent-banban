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
exports.registerHybridRoutes = registerHybridRoutes;
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const auth_1 = require("./auth");
const webhooks_1 = require("./webhooks");
const flows_1 = require("./flows");
const admin_1 = require("./admin");
const health_1 = require("./health");
async function registerHybridRoutes(server) {
    const logger = (0, logger_1.createRouteLogger)('registration', 'hybrid-routes');
    try {
        await server.register(auth_1.registerAuthRoutes, { prefix: `${config_1.config.API_PREFIX}/auth` });
        logger.info(`Auth routes registered under ${config_1.config.API_PREFIX}/auth`);
        await server.register(health_1.registerHealthRoutes, { prefix: `${config_1.config.API_PREFIX}/health` });
        logger.info(`Health routes registered under ${config_1.config.API_PREFIX}/health`);
        await server.register(webhooks_1.registerWebhookRoutes, { prefix: `${config_1.config.API_PREFIX}/webhooks` });
        logger.info(`Webhook routes registered under ${config_1.config.API_PREFIX}/webhooks`);
        await server.register(flows_1.registerFlowRoutes, { prefix: `${config_1.config.API_PREFIX}/flows` });
        logger.info(`Flow routes registered under ${config_1.config.API_PREFIX}/flows`);
        await server.register(admin_1.registerAdminRoutes, { prefix: `${config_1.config.API_PREFIX}/admin` });
        logger.info(`Admin routes registered under ${config_1.config.API_PREFIX}/admin`);
        await server.register(async function compatibilityRoutes(server) {
            const { coreV1Routes } = await Promise.resolve().then(() => __importStar(require('./v1/core')));
            const { metricsRoutes } = await Promise.resolve().then(() => __importStar(require('./v1/metrics')));
            await server.register(coreV1Routes);
            await server.register(metricsRoutes);
        }, { prefix: `${config_1.config.API_PREFIX}` });
        logger.info(`Compatibility routes (modules, metrics) registered under ${config_1.config.API_PREFIX}`);
        logger.info('All hybrid architecture routes registered successfully');
        logger.info('Available endpoints:');
        logger.info('  - /api/auth/*      (Authentication)');
        logger.info('  - /api/webhooks/*  (ECA BanBan System)');
        logger.info('  - /api/flows/*     (Business Flows REST)');
        logger.info('  - /api/admin/*     (Administrative)');
        logger.info('  - /api/health/*    (Health Checks)');
        logger.info('  - /api/modules/*   (Modular System - compatibility)');
    }
    catch (error) {
        logger.error('Error registering hybrid routes:', error);
        throw error;
    }
}
//# sourceMappingURL=index-hybrid.js.map