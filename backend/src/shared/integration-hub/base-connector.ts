import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ModuleInstance, ModuleInfo } from '../types/module-types';

export interface ConnectorConfig {
  name: string;
  version: string;
  description: string;
  baseModule: string;
  client: string;
  features: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime_ms: number;
  endpoints: string[];
  features: string[];
  metrics?: {
    requests_per_minute: number;
    avg_response_time_ms: number;
    success_rate: number;
  };
}

export interface FlowMetrics {
  total_events: number;
  success_rate: number;
  avg_processing_time_ms: number;
  error_count: number;
  last_24h_events: number;
}

/**
 * Classe base para todos os conectores de integração
 * Fornece funcionalidade comum para clientes como Banban, Riachuelo, etc.
 */
export abstract class BaseConnector implements ModuleInstance {
  protected config: ConnectorConfig;
  protected startTime: number;

  constructor(config: ConnectorConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  // Propriedades obrigatórias do ModuleInstance
  get name(): string { return this.config.name; }
  get version(): string { return this.config.version; }
  get description(): string { return this.config.description; }
  get baseModule(): string { return this.config.baseModule; }

  /**
   * Registra todas as rotas do conector
   */
  abstract register(fastify: FastifyInstance, prefix?: string): Promise<void>;

  /**
   * Handler genérico para requests
   */
  abstract handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any>;

  /**
   * Retorna informações do módulo
   */
  getModuleInfo(): ModuleInfo {
    return {
      name: this.config.name,
      type: 'integration-connector',
      version: this.config.version,
      description: this.config.description,
      endpoints: this.getEndpoints(),
      features: this.config.features,
      inheritsFrom: this.config.baseModule
    };
  }

  /**
   * Retorna endpoints disponíveis - deve ser implementado pelas subclasses
   */
  abstract getEndpoints(): string[];

  /**
   * Retorna status de saúde do conector
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const uptime = Date.now() - this.startTime;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: this.config.version,
      uptime_ms: uptime,
      endpoints: this.getEndpoints(),
      features: this.config.features,
      metrics: await this.getMetrics()
    };
  }

  /**
   * Retorna métricas do conector - pode ser sobrescrito pelas subclasses
   */
  protected async getMetrics(): Promise<HealthStatus['metrics']> {
    return {
      requests_per_minute: 0,
      avg_response_time_ms: 0,
      success_rate: 1.0
    };
  }

  /**
   * Registra endpoint de health check padrão
   */
  protected registerHealthEndpoint(fastify: FastifyInstance, path: string): void {
    fastify.get(path, {
      schema: {
        description: `Health check para ${this.config.client}`,
        tags: [this.config.client, 'Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              version: { type: 'string' },
              uptime_ms: { type: 'number' },
              endpoints: {
                type: 'array',
                items: { type: 'string' }
              },
              features: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    }, async (request, reply) => {
      const health = await this.getHealthStatus();
      return reply.send(health);
    });
  }

  /**
   * Registra endpoint de overview padrão
   */
  protected registerOverviewEndpoint(fastify: FastifyInstance, path: string): void {
    fastify.get(path, {
      schema: {
        description: `Visão geral da integração ${this.config.client}`,
        tags: [this.config.client, 'Overview'],
        response: {
          200: {
            type: 'object',
            properties: {
              client: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              features: {
                type: 'array',
                items: { type: 'string' }
              },
              endpoints: {
                type: 'array',
                items: { type: 'string' }
              },
              health: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }, async (request, reply) => {
      const health = await this.getHealthStatus();
      
      return reply.send({
        client: this.config.client,
        version: this.config.version,
        description: this.config.description,
        features: this.config.features,
        endpoints: this.getEndpoints(),
        health: {
          status: health.status,
          timestamp: health.timestamp
        }
      });
    });
  }

  /**
   * Middleware padrão para logging de requests
   */
  protected requestLoggingMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      
      // Log da request
      console.debug(`[${this.config.client}] ${request.method} ${request.url}`, {
        timestamp: new Date().toISOString(),
        client: this.config.client,
        connector: this.config.name
      });

      // Hook para log da response
      reply.addHook('onSend', async (request, reply, payload) => {
        const processingTime = Date.now() - startTime;
        
        console.debug(`[${this.config.client}] Response ${reply.statusCode}`, {
          processing_time_ms: processingTime,
          status_code: reply.statusCode,
          timestamp: new Date().toISOString()
        });

        return payload;
      });
    };
  }

  /**
   * Headers CORS padrão
   */
  protected getCorsHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
  }

  /**
   * Registra handler OPTIONS para CORS
   */
  protected registerCorsOptions(fastify: FastifyInstance, path: string): void {
    fastify.options(path, async (request, reply) => {
      return reply.headers(this.getCorsHeaders()).send();
    });
  }
}