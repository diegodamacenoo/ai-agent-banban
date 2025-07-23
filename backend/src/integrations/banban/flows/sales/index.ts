// @ts-nocheck

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { ModuleInstance, ModuleInfo } from '../../../shared/types/module-types';
import { BanBanSalesFlowService } from './services/banban-sales-flow-service';
import { banbanSalesFlowSchemas } from './schemas/banban-sales-flow-schemas';

export class BanBanSalesFlowModule implements ModuleInstance {
  name = 'banban-sales-flow';
  version = '2.0.0';
  description = 'Módulo de fluxo de vendas migrado das edge functions para BanBan Fashion';
  baseModule = 'flow-base';
  
  private service: BanBanSalesFlowService;

  constructor() {
    this.service = new BanBanSalesFlowService();
  }

  async register(fastify: FastifyInstance, prefix?: string): Promise<void> {
    // Registrar schemas específicos do Sales Flow
    fastify.addSchema(banbanSalesFlowSchemas.saleEntity);
    fastify.addSchema(banbanSalesFlowSchemas.returnEntity);
    fastify.addSchema(banbanSalesFlowSchemas.salesFlowWebhook);
    fastify.addSchema(banbanSalesFlowSchemas.salesFlowResponse);
    fastify.addSchema(banbanSalesFlowSchemas.salesAnalytics);

    // Middleware de autenticação para webhooks
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    };

    // OPTIONS handler for CORS
    fastify.options('/api/modules/banban/sales-flow', async (request, reply) => {
      return reply.headers(corsHeaders).send();
    });

    fastify.options('/api/modules/banban/sales-flow/*', async (request, reply) => {
      return reply.headers(corsHeaders).send();
    });

    // 1. Main Sales Flow Webhook Endpoint (POST)
    fastify.post('/api/modules/banban/sales-flow', {
      schema: {
        body: { $ref: 'banban-sales-flow-webhook#' },
        response: {
          200: { $ref: 'banban-sales-flow-response#' },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();

      try {
        const payload = request.body as any;
        
        // Validar payload básico
        if (!payload.event_type || !payload.organization_id || !payload.data) {
          return reply.headers(corsHeaders).code(400).send({
            success: false,
            action: payload.event_type || 'UNKNOWN',
            attributes: {
              success: false,
              summary: {
                message: 'event_type, organization_id e data são obrigatórios'
              }
            },
            metadata: {
              processed_at: new Date().toISOString(),
              processing_time_ms: Date.now() - startTime,
              organization_id: payload.organization_id || 'UNKNOWN',
              action: payload.event_type || 'UNKNOWN',
              event_uuid: eventUuid || 'UNKNOWN'
            },
            error: {
              code: 'VALIDATION_ERROR',
              message: 'event_type, organization_id e data são obrigatórios',
              details: {
                timestamp: new Date().toISOString()
              }
            }
          });
        }

        const eventUuid = randomUUID();
        let result;

        switch (payload.event_type) {
          case 'sale_completed':
            result = await this.service.processSaleCompleted(payload.data, payload.organization_id);
            break;

          case 'sale_cancelled':
            result = await this.service.processSaleCancelled(payload.data, payload.organization_id);
            break;

          case 'return_processed':
            result = await this.service.processReturnProcessed(payload.data, payload.organization_id);
            break;

          default:
            return reply.headers(corsHeaders).code(400).send({
              success: false,
              action: payload.event_type,
              attributes: {
                success: false,
                summary: {
                  message: `Tipo de evento não suportado: ${payload.event_type}`
                }
              },
              metadata: {
                processed_at: new Date().toISOString(),
                processing_time_ms: Date.now() - startTime,
                organization_id: payload.organization_id,
                action: payload.event_type,
                event_uuid: eventUuid
              },
              error: {
                code: 'UNSUPPORTED_EVENT',
                message: `Tipo de evento não suportado: ${payload.event_type}`,
                details: {
                  timestamp: new Date().toISOString()
                }
              }
            });
        }

        const processingTime = Date.now() - startTime;

        console.debug('Sales flow processed successfully:', {
          event_type: payload.event_type,
          organization_id: payload.organization_id,
          entity_id: result.entityId,
          processing_time_ms: processingTime
        });

        return reply.headers(corsHeaders).send({
          success: true,
          action: payload.event_type,
          transaction_id: result.transactionId || undefined,
          entity_ids: result.entityIds || [],
          relationship_ids: result.relationshipIds || [],
          state_transition: result.stateTransition || undefined,
          attributes: {
            success: result.success,
            entityType: result.entityType,
            entityId: result.entityId,
            summary: {
              message: result.summary.message,
              records_processed: result.summary.records_processed,
              records_successful: result.summary.records_successful,
              records_failed: result.summary.records_failed
            }
          },
          metadata: {
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            organization_id: payload.organization_id,
            action: payload.event_type,
            event_uuid: eventUuid
          }
        });

      } catch (error: any) {
        const processingTime = Date.now() - startTime;
        const payload = request.body as any;
        const eventUuid = randomUUID();
        
        console.error('Sales flow processing error:', {
          error: error.message,
          processing_time_ms: processingTime
        });

        return reply.headers(corsHeaders).code(500).send({
          success: false,
          action: payload?.event_type || 'UNKNOWN',
          attributes: {
            success: false,
            summary: {
              message: error.message
            }
          },
          metadata: {
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            organization_id: payload?.organization_id || 'UNKNOWN',
            action: payload?.event_type || 'UNKNOWN',
            event_uuid: eventUuid
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

    // 2. Sales Query Endpoint (GET)
    fastify.get('/api/modules/banban/sales-flow', {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization ID (obrigatório)' },
            sale_id: { type: 'string', description: 'ID da venda' },
            customer_id: { type: 'string', description: 'ID do cliente' },
            location_id: { type: 'string', description: 'ID da localização' },
            status: { type: 'string', description: 'Status da venda' },
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 }
          },
          required: ['org']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  sales: {
                    type: 'array',
                    items: { $ref: 'banban-sale-entity#' }
                  },
                  total: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        
        if (!query.org) {
          return reply.headers(corsHeaders).code(400).send({
            success: false,
            error: 'organization_id (org) é obrigatório'
          });
        }

        const sales = await this.service.getSalesData({
          org: query.org,
          sale_id: query.sale_id,
          customer_id: query.customer_id,
          location_id: query.location_id,
          status: query.status,
          limit: query.limit
        });

        return reply.headers(corsHeaders).send({
          success: true,
          data: {
            sales: sales,
            total: sales?.length || 0
          }
        });

      } catch (error: any) {
        console.error('Sales flow GET error:', error);
        return reply.headers(corsHeaders).code(500).send({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // 3. Sales Flow Analytics Endpoint
    fastify.get('/api/modules/banban/sales-flow/analytics', {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization ID (obrigatório)' },
            from: { type: 'string', format: 'date', description: 'Data início' },
            to: { type: 'string', format: 'date', description: 'Data fim' },
            customer_id: { type: 'string', description: 'ID do cliente' },
            location_id: { type: 'string', description: 'ID da localização' }
          },
          required: ['org']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: 'banban-sales-analytics#' }
            }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        
        if (!query.org) {
          return reply.headers(corsHeaders).code(400).send({
            success: false,
            error: 'organization_id (org) é obrigatório'
          });
        }

        const analytics = await this.service.getSalesAnalytics(query.org, {
          dateFrom: query.from,
          dateTo: query.to,
          customerId: query.customer_id,
          locationId: query.location_id
        });

        return reply.headers(corsHeaders).send({
          success: true,
          data: analytics
        });

      } catch (error: any) {
        console.error('Sales analytics error:', error);
        return reply.headers(corsHeaders).code(500).send({
          success: false,
          error: 'Erro ao obter analytics de vendas'
        });
      }
    });

    // 4. Health check específico do módulo Sales Flow
    fastify.get('/api/modules/banban/sales-flow/health', {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              status: { type: 'string' },
              version: { type: 'string' },
              baseModule: { type: 'string' },
              features: {
                type: 'array',
                items: { type: 'string' }
              },
              events: {
                type: 'array',
                items: { type: 'string' }
              },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      return reply.headers(corsHeaders).send({
        module: this.name,
        status: 'healthy',
        version: this.version,
        baseModule: this.baseModule,
        features: [
          'sale-processing',
          'return-processing',
          'customer-analytics',
          'product-performance',
          'location-metrics',
          'sales-trends'
        ],
        events: [
          'sale_completed',
          'sale_cancelled',
          'return_processed'
        ],
        timestamp: new Date().toISOString()
      });
    });
  }

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    // Implementação genérica de handle request
    return reply.send({ 
      message: 'BanBan Sales Flow Module is active',
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
        '/api/modules/banban/sales-flow',
        '/api/modules/banban/sales-flow/analytics',
        '/api/modules/banban/sales-flow/health'
      ],
      features: [
        'sale-processing',
        'return-processing',
        'customer-analytics',
        'product-performance',
        'location-metrics',
        'sales-trends'
      ],
      inheritsFrom: this.baseModule
    };
  }

  getEndpoints(): string[] {
    return this.getModuleInfo().endpoints;
  }
}