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
exports.registerRoutes = registerRoutes;
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
async function registerRoutes(server) {
    const logger = (0, logger_1.createRouteLogger)('registration', 'routes');
    try {
        if (config_1.config.ENABLE_HYBRID_ARCHITECTURE) {
            const { registerHybridRoutes } = await Promise.resolve().then(() => __importStar(require('./index-hybrid')));
            await registerHybridRoutes(server);
            logger.info('Hybrid architecture routes registered successfully');
        }
        else {
            const { registerV1Routes } = await Promise.resolve().then(() => __importStar(require('./v1')));
            const { registerV2Routes } = await Promise.resolve().then(() => __importStar(require('./v2')));
            await server.register(registerV1Routes, { prefix: `${config_1.config.API_PREFIX}/v1` });
            logger.info(`API v1 routes registered under ${config_1.config.API_PREFIX}/v1`);
            await server.register(registerV2Routes, { prefix: `${config_1.config.API_PREFIX}/v2` });
            logger.info(`API v2 routes registered under ${config_1.config.API_PREFIX}/v2`);
            logger.info('Versioned API routes registered successfully');
        }
    }
    catch (error) {
        logger.error('Error registering routes:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map