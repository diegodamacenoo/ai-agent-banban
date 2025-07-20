// @ts-nocheck
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ModuleInstance, ModuleInfo } from '../../../shared/types/module-types';
import { BanBanPurchaseFlowService } from './services/banban-purchase-flow-service';
import { banbanPurchaseFlowSchemas } from './schemas/banban-purchase-flow-schemas';

export class BanBanPurchaseFlowModule implements ModuleInstance {
  name = 'banban-purchase-flow';
  version = '2.0.0';
  description = 'Módulo de fluxo de compras migrado das edge functions para BanBan Fashion';
  baseModule = 'flow-base';
  
  private service: BanBanPurchaseFlowService;

  constructor() {
    this.service = new BanBanPurchaseFlowService();
  }

  async register(fastify: FastifyInstance, prefix?: string): Promise<void> {
    // Registrar schemas específicos do Purchase Flow
    fastify.addSchema(banbanPurchaseFlowSchemas.purchaseOrder);
    fastify.addSchema(banbanPurchaseFlowSchemas.purchaseFlowWebhook);
    fastify.addSchema(banbanPurchaseFlowSchemas.purchaseFlowResponse);
    fastify.addSchema(banbanPurchaseFlowSchemas.purchaseAnalytics);

    // Middleware de autenticação para webhooks
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    };

    // OPTIONS handler for CORS
    fastify.options('/api/modules/banban/purchase-flow', async (request, reply) => {
      return reply.headers(corsHeaders).send();
    });

    fastify.options('/api/modules/banban/purchase-flow/*', async (request, reply) => {
      return reply.headers(corsHeaders).send();
    });

    // 1. Main Purchase Flow Webhook Endpoint (POST)
    fastify.post('/api/modules/banban/purchase-flow', {
      schema: {
        body: { $ref: 'banban-purchase-flow-webhook#' },
        response: {
          200: { $ref: 'banban-purchase-flow-response#' },
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
                },
                additionalProperties: true
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
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method
              }
            }
          });
        }

        let result;
        const eventUuid = crypto.randomUUID();

        switch (payload.event_type) {
          case 'purchase_order_created':
            result = await this.service.processPurchaseOrderCreated(payload.data, payload.organization_id);
            break;

          case 'purchase_order_approved':
            result = await this.service.processPurchaseOrderApproved(payload.data, payload.organization_id);
            break;

          case 'goods_received_cd':
            result = await this.service.processGoodsReceivedCD(payload.data, payload.organization_id);
            break;

          case 'receipt_effective_in_cd':
            result = await this.service.processReceiptEffectiveInCD(payload.data, payload.organization_id);
            break;

          case 'receipt_verified_ok':
          case 'receipt_verified_with_discrepancy':
            // TODO: Implementar estes handlers
            result = {
              success: true,
              entityType: 'DOCUMENT',
              entityId: null,
              summary: {
                message: `Handler para ${payload.event_type} ainda não implementado`,
                records_processed: 0,
                records_successful: 0,
                records_failed: 0
              }
            };
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
                  timestamp: new Date().toISOString(),
                  path: request.url,
                  method: request.method
                }
              }
            });
        }

        const processingTime = Date.now() - startTime;

        console.debug('Purchase flow processed successfully:', {
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
        
        console.error('Purchase flow processing error:', {
          error: error.message,
          processing_time_ms: processingTime
        });

        return reply.headers(corsHeaders).code(500).send({
          success: false,
          action: payload.event_type,
          attributes: {
            success: false,
            summary: {
              message: error.message || 'Erro interno do servidor'
            }
          },
          metadata: {
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            organization_id: payload.organization_id,
            action: payload.event_type,
            event_uuid: eventUuid
          },
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message || 'Erro interno do servidor',
            details: {
              timestamp: new Date().toISOString(),
              path: request.url,
              method: request.method,
              original_details: error.details || undefined
            }
          }
        });
      }
    });

    // 2. Purchase Orders Query Endpoint (GET)
    fastify.get('/api/modules/banban/purchase-flow', {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization ID (obrigatório)' },
            order: { type: 'string', description: 'Número do pedido' },
            supplier: { type: 'string', description: 'ID do fornecedor' },
            status: { type: 'string', description: 'Status do pedido' },
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
                  orders: {
                    type: 'array',
                    items: { $ref: 'banban-purchase-order#' }
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
            error: true,
            message: 'organization_id (org) é obrigatório',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            path: request.url,
            method: request.method
          });
        }

        const orders = await this.service.getPurchaseOrders(query.org, {
          orderNumber: query.order,
          supplierId: query.supplier,
          status: query.status,
          limit: query.limit
        });

        return reply.headers(corsHeaders).send({
          success: true,
          data: {
            orders: orders,
            total: orders?.length || 0
          }
        });

      } catch (error: any) {
        console.error('Purchase flow GET error:', error);
        return reply.headers(corsHeaders).code(500).send({
          error: true,
          message: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          path: request.url,
          method: request.method
        });
      }
    });

    // 3. Purchase Flow Analytics Endpoint
    fastify.get('/api/modules/banban/purchase-flow/analytics', {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization ID (obrigatório)' },
            from: { type: 'string', format: 'date', description: 'Data início' },
            to: { type: 'string', format: 'date', description: 'Data fim' },
            supplier: { type: 'string', description: 'ID do fornecedor' }
          },
          required: ['org']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { $ref: 'banban-purchase-analytics#' }
            }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        
        if (!query.org) {
          return reply.headers(corsHeaders).code(400).send({
            error: true,
            message: 'organization_id (org) é obrigatório',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            path: request.url,
            method: request.method
          });
        }

        const analytics = await this.service.getPurchaseAnalytics(query.org, {
          dateFrom: query.from,
          dateTo: query.to,
          supplierId: query.supplier
        });

        return reply.headers(corsHeaders).send({
          success: true,
          data: analytics
        });

      } catch (error: any) {
        console.error('Purchase analytics error:', error);
        return reply.headers(corsHeaders).code(500).send({
          error: true,
          message: 'Erro ao obter analytics de compras',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          path: request.url,
          method: request.method
        });
      }
    });

    // 4. Health check específico do módulo Purchase Flow
    fastify.get('/api/modules/banban/purchase-flow/health', {
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
          'purchase-order-processing',
          'supplier-management',
          'purchase-analytics',
          'lead-time-analysis',
          'inventory-integration'
        ],
        events: [
          'purchase_order_created',
          'purchase_order_approved',
          'goods_received_cd',
          'receipt_verified_ok',
          'receipt_verified_with_discrepancy',
          'receipt_effective_in_cd'
        ],
        timestamp: new Date().toISOString()
      });
    });
  }

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    // Implementação genérica de handle request
    return reply.send({ 
      message: 'BanBan Purchase Flow Module is active',
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
        '/api/modules/banban/purchase-flow',
        '/api/modules/banban/purchase-flow/analytics',
        '/api/modules/banban/purchase-flow/health'
      ],
      features: [
        'purchase-order-processing',
        'supplier-management',
        'purchase-analytics',
        'lead-time-analysis',
        'inventory-integration'
      ],
      inheritsFrom: this.baseModule
    };
  }

  getEndpoints(): string[] {
    return this.getModuleInfo().endpoints;
  }
}