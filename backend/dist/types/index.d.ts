export type ClientType = 'custom' | 'standard';
export interface TenantInfo {
    id: string;
    clientType: ClientType;
    name?: string;
    customBackendUrl?: string;
    isImplementationComplete?: boolean;
}
export interface CustomModule {
    id: string;
    organizationId: string;
    moduleName: string;
    moduleVersion: string;
    customCodePath?: string;
    apiEndpoints: string[];
    configuration: Record<string, any>;
    deployedAt: string;
    isActive: boolean;
}
export interface ImplementationTemplate {
    id: string;
    name: string;
    description?: string;
    clientType: ClientType;
    baseModules: string[];
    customizationPoints: Record<string, any>;
    exampleConfig: Record<string, any>;
    isActive: boolean;
}
export interface MultiTenantRequest {
    tenant?: TenantInfo;
    clientType?: ClientType;
}
export interface RoutingResponse {
    routed: boolean;
    clientType: ClientType;
    targetUrl?: string;
    module: string;
    endpoint: string;
    message: string;
}
export interface TenantRateLimit {
    tenantId: string;
    maxRequests: number;
    windowMs: number;
    customLimits?: Record<string, number>;
}
export interface PerformanceMetrics {
    operation: string;
    duration: number;
    tenantId?: string;
    clientType?: ClientType;
    timestamp: string;
}
export interface AuditLog {
    action: string;
    userId?: string;
    tenantId?: string;
    clientType?: ClientType;
    details?: Record<string, any>;
    timestamp: string;
    ip?: string;
    userAgent?: string;
}
export interface ErrorResponse {
    code: string;
    error: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
}
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    checks?: Record<string, boolean>;
}
export interface ServerInfo {
    name: string;
    version: string;
    environment: string;
    features: string[];
    endpoints: {
        health: string;
        docs: string;
        api: string;
    };
}
declare module 'fastify' {
    interface FastifyRequest {
        tenant?: TenantInfo;
        clientType?: ClientType;
    }
}
export interface EnvironmentConfig {
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    LOG_LEVEL: string;
    ENABLE_CUSTOM_ROUTING: boolean;
    DEFAULT_CLIENT_TYPE: ClientType;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW: number;
    CORS_ORIGIN: string | string[] | boolean;
    CORS_CREDENTIALS: boolean;
    API_PREFIX: string;
    API_VERSION: string;
    ENABLE_SWAGGER: boolean;
    ENABLE_HELMET: boolean;
    ENABLE_RATE_LIMIT: boolean;
}
export interface PluginConfig {
    name: string;
    enabled: boolean;
    config?: Record<string, any>;
}
export interface RouteConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: string;
    middleware?: string[];
    clientTypes?: ClientType[];
    requiresTenant?: boolean;
}
//# sourceMappingURL=index.d.ts.map