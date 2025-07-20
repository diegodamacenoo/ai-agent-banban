export interface Config {
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    LOG_LEVEL: string;
    ENABLE_CUSTOM_ROUTING: boolean;
    DEFAULT_CLIENT_TYPE: 'custom' | 'standard';
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW: number;
    CORS_ORIGIN: string | string[] | boolean;
    CORS_CREDENTIALS: boolean;
    API_PREFIX: string;
    API_VERSION: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    WEBHOOK_SECRET_TOKEN: string;
    ENABLE_SWAGGER: boolean;
    ENABLE_HELMET: boolean;
    ENABLE_RATE_LIMIT: boolean;
    ENABLE_HYBRID_ARCHITECTURE: boolean;
}
declare const config: Config;
export { config };
export declare const environmentConfig: {
    development: {
        LOG_LEVEL: string;
        ENABLE_SWAGGER: boolean;
        CORS_ORIGIN: string[];
    };
    production: {
        LOG_LEVEL: string;
        ENABLE_SWAGGER: boolean;
        CORS_ORIGIN: string | boolean;
    };
    test: {
        LOG_LEVEL: string;
        ENABLE_SWAGGER: boolean;
        CORS_ORIGIN: boolean;
        ENABLE_RATE_LIMIT: boolean;
    };
};
export declare function getEnvironmentConfig(): {
    LOG_LEVEL: string;
    ENABLE_SWAGGER: boolean;
    CORS_ORIGIN: string[];
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    ENABLE_CUSTOM_ROUTING: boolean;
    DEFAULT_CLIENT_TYPE: "custom" | "standard";
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW: number;
    CORS_CREDENTIALS: boolean;
    API_PREFIX: string;
    API_VERSION: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    WEBHOOK_SECRET_TOKEN: string;
    ENABLE_HELMET: boolean;
    ENABLE_RATE_LIMIT: boolean;
    ENABLE_HYBRID_ARCHITECTURE: boolean;
} | {
    LOG_LEVEL: string;
    ENABLE_SWAGGER: boolean;
    CORS_ORIGIN: string | boolean;
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    ENABLE_CUSTOM_ROUTING: boolean;
    DEFAULT_CLIENT_TYPE: "custom" | "standard";
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW: number;
    CORS_CREDENTIALS: boolean;
    API_PREFIX: string;
    API_VERSION: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    WEBHOOK_SECRET_TOKEN: string;
    ENABLE_HELMET: boolean;
    ENABLE_RATE_LIMIT: boolean;
    ENABLE_HYBRID_ARCHITECTURE: boolean;
} | {
    LOG_LEVEL: string;
    ENABLE_SWAGGER: boolean;
    CORS_ORIGIN: boolean;
    ENABLE_RATE_LIMIT: boolean;
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    ENABLE_CUSTOM_ROUTING: boolean;
    DEFAULT_CLIENT_TYPE: "custom" | "standard";
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW: number;
    CORS_CREDENTIALS: boolean;
    API_PREFIX: string;
    API_VERSION: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    WEBHOOK_SECRET_TOKEN: string;
    ENABLE_HELMET: boolean;
    ENABLE_HYBRID_ARCHITECTURE: boolean;
};
//# sourceMappingURL=config.d.ts.map