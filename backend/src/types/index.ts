/**
 * Tipos TypeScript para o sistema multi-tenant
 */

// Tipos de cliente
export type ClientType = 'custom' | 'standard';

// Informações do tenant
export interface TenantInfo {
  id: string;
  clientType: ClientType;
  name?: string;
  customBackendUrl?: string;
  isImplementationComplete?: boolean;
}

// Configuração de módulo customizado
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

// Template de implementação
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

// Contexto de requisição multi-tenant
export interface MultiTenantRequest {
  tenant?: TenantInfo;
  clientType?: ClientType;
}

// Resposta de roteamento
export interface RoutingResponse {
  routed: boolean;
  clientType: ClientType;
  targetUrl?: string;
  module: string;
  endpoint: string;
  message: string;
}

// Configuração de rate limiting por tenant
export interface TenantRateLimit {
  tenantId: string;
  maxRequests: number;
  windowMs: number;
  customLimits?: Record<string, number>;
}

// Métricas de performance
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  tenantId?: string;
  clientType?: ClientType;
  timestamp: string;
}

// Log de auditoria
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

// Resposta de erro padronizada
export interface ErrorResponse {
  code: string;
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

// Resposta de health check
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks?: Record<string, boolean>;
}

// Informações do servidor
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

// Extensões do Fastify Request
declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantInfo;
    clientType?: ClientType;
  }
}

// Tipos para configuração de ambiente
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

// Tipos para plugins
export interface PluginConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

// Tipos para roteamento
export interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  middleware?: string[];
  clientTypes?: ClientType[];
  requiresTenant?: boolean;
} 