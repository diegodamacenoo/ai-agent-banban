"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environmentConfig = exports.config = void 0;
exports.getEnvironmentConfig = getEnvironmentConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function loadConfig() {
    return {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: 4000,
        HOST: process.env.HOST || '0.0.0.0',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        ENABLE_CUSTOM_ROUTING: process.env.ENABLE_CUSTOM_ROUTING === 'true' || true,
        DEFAULT_CLIENT_TYPE: process.env.DEFAULT_CLIENT_TYPE || 'standard',
        RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
        CORS_ORIGIN: process.env.CORS_ORIGIN ?
            (process.env.CORS_ORIGIN.includes(',') ?
                process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) :
                process.env.CORS_ORIGIN) : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true' || true,
        API_PREFIX: process.env.API_PREFIX || '/api',
        API_VERSION: process.env.API_VERSION || 'v1',
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        JWT_SECRET: process.env.JWT_SECRET || '',
        WEBHOOK_SECRET_TOKEN: process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025',
        ENABLE_SWAGGER: process.env.ENABLE_SWAGGER !== 'false',
        ENABLE_HELMET: process.env.ENABLE_HELMET !== 'false',
        ENABLE_RATE_LIMIT: process.env.ENABLE_RATE_LIMIT !== 'false',
        ENABLE_HYBRID_ARCHITECTURE: process.env.ENABLE_HYBRID_ARCHITECTURE === 'true'
    };
}
function validateConfig(config) {
    const errors = [];
    if (config.PORT < 1 || config.PORT > 65535) {
        errors.push('PORT must be between 1 and 65535');
    }
    if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
        errors.push('NODE_ENV must be development, production, or test');
    }
    if (!['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'].includes(config.LOG_LEVEL)) {
        errors.push('LOG_LEVEL must be a valid pino log level');
    }
    if (!['custom', 'standard'].includes(config.DEFAULT_CLIENT_TYPE)) {
        errors.push('DEFAULT_CLIENT_TYPE must be custom or standard');
    }
    if (config.RATE_LIMIT_MAX < 1) {
        errors.push('RATE_LIMIT_MAX must be greater than 0');
    }
    if (config.RATE_LIMIT_WINDOW < 1000) {
        errors.push('RATE_LIMIT_WINDOW must be at least 1000ms');
    }
    if (config.NODE_ENV === 'production') {
        if (!config.SUPABASE_URL) {
            errors.push('SUPABASE_URL is required in production');
        }
        if (!config.SUPABASE_SERVICE_ROLE_KEY) {
            errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production');
        }
        if (!config.JWT_SECRET) {
            errors.push('JWT_SECRET is required in production');
        }
    }
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
}
const config = loadConfig();
exports.config = config;
validateConfig(config);
exports.environmentConfig = {
    development: {
        LOG_LEVEL: 'debug',
        ENABLE_SWAGGER: true,
        CORS_ORIGIN: ['http://localhost:3000', 'http://127.0.0.1:3000']
    },
    production: {
        LOG_LEVEL: 'warn',
        ENABLE_SWAGGER: false,
        CORS_ORIGIN: process.env.CORS_ORIGIN || false
    },
    test: {
        LOG_LEVEL: 'silent',
        ENABLE_SWAGGER: false,
        CORS_ORIGIN: false,
        ENABLE_RATE_LIMIT: false
    }
};
function getEnvironmentConfig() {
    return {
        ...config,
        ...exports.environmentConfig[config.NODE_ENV]
    };
}
//# sourceMappingURL=config.js.map