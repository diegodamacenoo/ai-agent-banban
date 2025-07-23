import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export interface WebhookPayload {
  action: string;
  attributes: any;
  metadata?: { [key: string]: any };
}

export interface WebhookResponse {
  success: boolean;
  action: string;
  transaction_id?: string;
  entity_ids?: string[];
  relationship_ids?: string[];
  state_transition?: any;
  attributes: {
    success: boolean;
    entityType?: string;
    entityId?: string;
    status?: string;
    summary: {
      message: string;
      records_processed?: number;
      records_successful?: number;
      records_failed?: number;
    };
    details?: any;
  };
  metadata: {
    processed_at: string;
    processing_time_ms: number;
    organization_id?: string;
    action: string;
    event_uuid: string;
  };
  error?: {
    code: string;
    message: string;
    details: {
      timestamp: string;
      [key: string]: any;
    };
  };
}

export interface WebhookConfig {
  path: string;
  client: string;
  flow: string;
  actions: Record<string, string>;
  requireAuth?: boolean;
  authToken?: string;
}

/**
 * Handler base para webhooks padronizados
 * Fornece funcionalidade comum para processamento de webhooks
 */
export abstract class BaseWebhookHandler {
  protected config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  /**
   * Registra o webhook endpoint
   */
  register(fastify: FastifyInstance): void {
    // OPTIONS handler para CORS
    fastify.options(this.config.path, async (request, reply) => {
      return reply.headers(this.getCorsHeaders()).send();
    });

    // POST handler principal
    fastify.post(this.config.path, {
      schema: this.getWebhookSchema(),
      preHandler: this.config.requireAuth ? this.authMiddleware.bind(this) : undefined
    }, this.handleWebhook.bind(this));

    // GET handler para consultas (opcional)
    if (this.supportsQueryEndpoint()) {
      fastify.get(this.config.path, {
        schema: this.getQuerySchema()
      }, this.handleQuery.bind(this));
    }
  }

  /**
   * Handler principal do webhook
   */
  private async handleWebhook(request: FastifyRequest, reply: FastifyReply): Promise<WebhookResponse> {
    const startTime = Date.now();
    const payload = request.body as WebhookPayload;
    const eventUuid = randomUUID();

    try {
      // Validar payload básico
      this.validatePayload(payload);

      console.debug(`[${this.config.client}] Processing webhook`, {
        action: payload.action,
        flow: this.config.flow,
        event_uuid: eventUuid,
        timestamp: new Date().toISOString()
      });

      // Processar a ação
      const result = await this.processAction(payload.action, payload.attributes, payload.metadata);

      const processingTime = Date.now() - startTime;

      console.debug(`[${this.config.client}] Webhook processed successfully`, {
        action: payload.action,
        processing_time_ms: processingTime,
        event_uuid: eventUuid
      });

      // Gerar resposta de sucesso
      const response: WebhookResponse = {
        success: true,
        action: payload.action,
        transaction_id: result.transaction_id,
        entity_ids: result.entity_ids || [],
        relationship_ids: result.relationship_ids || [],
        state_transition: result.state_transition,
        attributes: {
          success: true,
          entityType: result.entity_type,
          entityId: result.entity_id,
          status: result.status,
          summary: {
            message: `${payload.action} processado com sucesso`,
            records_processed: 1,
            records_successful: 1,
            records_failed: 0
          },
          details: result.details
        },
        metadata: {
          processed_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          organization_id: payload.metadata?.organization_id,
          action: payload.action,
          event_uuid: eventUuid
        }
      };

      return reply.headers(this.getCorsHeaders()).send(response);

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      console.error(`[${this.config.client}] Webhook processing error`, {
        action: payload?.action || 'unknown',
        error: error.message,
        processing_time_ms: processingTime,
        event_uuid: eventUuid
      });

      const errorResponse: WebhookResponse = {
        success: false,
        action: payload?.action || 'unknown',
        attributes: {
          success: false,
          summary: {
            message: error.message
          }
        },
        metadata: {
          processed_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          organization_id: payload?.metadata?.organization_id,
          action: payload?.action || 'unknown',
          event_uuid: eventUuid
        },
        error: {
          code: this.getErrorCode(error),
          message: error.message,
          details: {
            timestamp: new Date().toISOString(),
            action: payload?.action || 'unknown'
          }
        }
      };

      return reply.headers(this.getCorsHeaders()).code(500).send(errorResponse);
    }
  }

  /**
   * Processa uma ação específica - deve ser implementado pelas subclasses
   */
  protected abstract processAction(action: string, attributes: any, metadata?: any): Promise<any>;

  /**
   * Valida o payload do webhook
   */
  protected validatePayload(payload: WebhookPayload): void {
    if (!payload.action) {
      throw new Error('action é obrigatório');
    }

    if (!payload.attributes) {
      throw new Error('attributes são obrigatórios');
    }

    if (!this.config.actions[payload.action]) {
      throw new Error(`Ação não suportada: ${payload.action}`);
    }
  }

  /**
   * Middleware de autenticação
   */
  protected async authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!this.config.authToken) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token de autorização obrigatório'
        }
      });
    }

    const token = authHeader.substring(7);
    if (token !== this.config.authToken) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token de autorização inválido'
        }
      });
    }
  }

  /**
   * Retorna schema do webhook
   */
  protected getWebhookSchema() {
    return {
      description: `Webhook para ${this.config.flow} do cliente ${this.config.client}`,
      tags: [this.config.client, this.config.flow, 'Webhooks'],
      body: {
        type: 'object',
        required: ['action', 'attributes'],
        properties: {
          action: { 
            type: 'string', 
            enum: Object.keys(this.config.actions)
          },
          attributes: { type: 'object' },
          metadata: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            action: { type: 'string' },
            transaction_id: { type: 'string' },
            attributes: { type: 'object' },
            metadata: { type: 'object' }
          }
        }
      }
    };
  }

  /**
   * Retorna schema para consultas GET (se suportado)
   */
  protected getQuerySchema() {
    return {
      description: `Consultar dados de ${this.config.flow} do cliente ${this.config.client}`,
      tags: [this.config.client, this.config.flow],
      querystring: {
        type: 'object',
        properties: {
          external_id: { type: 'string' },
          status: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 }
        }
      }
    };
  }

  /**
   * Handler para consultas GET - pode ser sobrescrito pelas subclasses
   */
  protected async handleQuery(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    return reply.headers(this.getCorsHeaders()).code(501).send({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Consultas não implementadas para este webhook'
      }
    });
  }

  /**
   * Indica se o endpoint suporta consultas GET
   */
  protected supportsQueryEndpoint(): boolean {
    return false;
  }

  /**
   * Retorna código de erro apropriado
   */
  protected getErrorCode(error: Error): string {
    if (error.message.includes('obrigatório')) {
      return 'VALIDATION_ERROR';
    }
    if (error.message.includes('não suportada') || error.message.includes('não encontrada')) {
      return 'UNSUPPORTED_ACTION';
    }
    if (error.message.includes('autorização') || error.message.includes('token')) {
      return 'AUTHENTICATION_ERROR';
    }
    return 'PROCESSING_ERROR';
  }

  /**
   * Headers CORS padrão
   */
  protected getCorsHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };
  }
}