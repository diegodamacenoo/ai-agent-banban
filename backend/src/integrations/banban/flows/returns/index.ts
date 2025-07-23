import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { ModuleInstance, ModuleInfo } from '../../../../shared/types/module-types';
import { RETURN_ACTIONS } from '../../../../shared/enums';
import { BanBanSalesFlowService } from '../sales/services/banban-sales-flow-service';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

type ReturnAction = typeof RETURN_ACTIONS[keyof typeof RETURN_ACTIONS];

interface UnifiedReturnRequest {
  action: ReturnAction;
  attributes: any;
  metadata?: { [key: string]: any };
}

export class BanBanReturnsFlowModule implements ModuleInstance {
  name = 'banban-returns-flow';
  version = '2.0.0';
  description = 'Módulo de fluxo de devoluções migrado para Integration Hub';
  baseModule = 'flow-base';
  
  private salesService: BanBanSalesFlowService;

  constructor() {
    this.salesService = new BanBanSalesFlowService();
  }

  async register(fastify: FastifyInstance, prefix?: string): Promise<void> {
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';

    // OPTIONS handler for CORS
    fastify.options('/api/webhooks/banban/returns', async (request, reply) => {
      return reply.headers(corsHeaders).send();
    });

    // Rota POST para executar ações de devolução
    fastify.post('/api/webhooks/banban/returns', {
      schema: {
        description: 'Webhook unificado para fluxos de devolução Banban',
        tags: ['Banban', 'Returns', 'Webhooks'],
        body: {
          type: 'object',
          required: ['action', 'attributes'],
          properties: {
            action: { type: 'string', enum: Object.values(RETURN_ACTIONS) },
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
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const payload = request.body as UnifiedReturnRequest;

      try {
        if (!payload.action || !payload.attributes) {
          return reply.headers(corsHeaders).code(400).send({
            success: false,
            error: 'action e attributes são obrigatórios'
          });
        }

        let result;
        
        // Mapear ações de return para métodos do sales service
        switch (payload.action) {
          case RETURN_ACTIONS.REQUEST_RETURN:
            result = await this.salesService.processAction('request_return', payload.attributes, payload.metadata);
            break;
          case RETURN_ACTIONS.COMPLETE_RETURN:
            result = await this.salesService.processAction('complete_return', payload.attributes, payload.metadata);
            break;
          case RETURN_ACTIONS.TRANSFER_BETWEEN_STORES:
            result = await this.salesService.processAction('transfer_between_stores', payload.attributes, payload.metadata);
            break;
          default:
            return reply.headers(corsHeaders).code(400).send({
              success: false,
              error: `Ação de devolução desconhecida: ${payload.action}`
            });
        }

        const processingTime = Date.now() - startTime;

        console.debug('Returns flow processed successfully:', {
          action: payload.action,
          result: result,
          processing_time_ms: processingTime
        });

        return reply.headers(corsHeaders).send({
          success: true,
          action: payload.action,
          transaction_id: result.transaction_id || undefined,
          entity_ids: [],
          relationship_ids: [],
          state_transition: undefined,
          attributes: {
            success: true,
            entityType: 'RETURN',
            entityId: result.external_id,
            status: result.status,
            summary: {
              message: `${payload.action} processado com sucesso`,
              records_processed: 1,
              records_successful: 1,
              records_failed: 0
            }
          },
          metadata: {
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            action: payload.action,
            event_uuid: randomUUID()
          }
        });

      } catch (error: any) {
        const processingTime = Date.now() - startTime;
        
        console.error('Returns flow processing error:', {
          error: error.message,
          processing_time_ms: processingTime
        });

        return reply.headers(corsHeaders).code(500).send({
          success: false,
          action: payload.action,
          attributes: {
            success: false,
            summary: {
              message: error.message
            }
          },
          metadata: {
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            action: payload.action,
            event_uuid: randomUUID()
          },
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message,
            details: {
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    });

    // Rota GET para consultar dados de devolução
    fastify.get('/api/webhooks/banban/returns', {
      schema: {
        description: 'Consultar dados de devoluções Banban',
        tags: ['Banban', 'Returns'],
        querystring: {
          type: 'object',
          properties: {
            external_id: { type: 'string' },
            status: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await this.salesService.getSalesData(request.query as any);
        return reply.headers(corsHeaders).send({ 
          success: true, 
          data: result, 
          timestamp: new Date().toISOString() 
        });

      } catch (error: any) {
        console.error('Erro no GET /returns:', error);
        return reply.headers(corsHeaders).code(500).send({ 
          success: false, 
          error: error.message, 
          timestamp: new Date().toISOString() 
        });
      }
    });

    // Health check específico do módulo Returns
    fastify.get('/api/integrations/banban/returns/health', {
      schema: {
        description: 'Health check do módulo Returns Flow',
        tags: ['Banban', 'Returns', 'Health']
      }
    }, async (request, reply) => {
      return reply.headers(corsHeaders).send({
        module: this.name,
        status: 'healthy',
        version: this.version,
        baseModule: this.baseModule,
        features: [
          'return-processing',
          'store-transfer-handling',
          'return-validation',
          'multi-location-returns'
        ],
        actions: Object.values(RETURN_ACTIONS),
        timestamp: new Date().toISOString()
      });
    });
  }

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    return reply.send({ 
      message: 'BanBan Returns Flow Module is active',
      version: this.version,
      timestamp: new Date().toISOString()
    });
  }

  getModuleInfo(): ModuleInfo {
    return {
      name: this.name,
      type: 'custom',
      version: this.version,
      description: this.description,
      endpoints: [
        '/api/webhooks/banban/returns',
        '/api/integrations/banban/returns/health'
      ],
      features: [
        'return-processing',
        'store-transfer-handling', 
        'return-validation',
        'multi-location-returns'
      ],
      inheritsFrom: this.baseModule
    };
  }

  getEndpoints(): string[] {
    return this.getModuleInfo().endpoints;
  }
}