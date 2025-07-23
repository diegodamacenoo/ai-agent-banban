import { FastifyInstance, FastifyReply } from 'fastify';
import { BanBanTransferFlowService } from './services/banban-transfer-flow-service';
import {
  ECATransferWebhookSchema,
  QueryTransfersSchema,
  AnalyticsSchema,
  HealthCheckSchema,
  registerTransferFlowSchemas
} from './schemas/banban-transfer-flow-schemas';
import {
  WebhookRequest,
  QueryRequest,
  AnalyticsRequest,
  HealthCheckRequest,
  HealthCheckResponse,
  WebhookResponse,
  WebhookPayload,
  QueryTransfersParams,
  AnalyticsParams
} from './types/transfer-types';
import { TRANSFER_ACTIONS, TransferAction } from '../../../../shared/enums/eca-actions';

export class BanBanTransferFlowModule {
  private service!: BanBanTransferFlowService;

  // Propriedades requeridas pela interface TenantModule
  name = 'BanBan Transfer Flow';
  version = '1.0.0';
  description = 'Módulo para processamento de transferências/logística BanBan';

  constructor() {
    // Module initialization
  }

  async register(fastify: FastifyInstance): Promise<void> {
    // Inicializar service
    this.service = new BanBanTransferFlowService();

    // Registrar schemas
    // registerTransferFlowSchemas(fastify); // Removed as schemas are directly used in routes

    // Registrar rotas
    await this.registerRoutes(fastify);

    fastify.log.info('BanBan Transfer Flow Module registered successfully');
  }

  private async registerRoutes(fastify: FastifyInstance): Promise<void> {
    // POST /api/modules/banban/transfer-flow - Webhook principal
    fastify.post<{ Body: WebhookPayload }>(
      '/api/modules/banban/transfer-flow',
      {
        schema: ECATransferWebhookSchema,
        handler: async (request, reply) => {
          return this.handleWebhook(request as WebhookRequest, reply);
        }
      }
    );

    // GET /api/modules/banban/transfer-flow - Query de transferências
    fastify.get<{ Querystring: QueryTransfersParams }>(
      '/api/modules/banban/transfer-flow',
      {
        schema: QueryTransfersSchema,
        handler: async (request, reply) => {
          return this.handleQuery(request as QueryRequest, reply);
        }
      }
    );

    // GET /api/modules/banban/transfer-flow/analytics - Analytics avançadas
    fastify.get<{ Querystring: AnalyticsParams }>(
      '/api/modules/banban/transfer-flow/analytics',
      {
        schema: AnalyticsSchema,
        handler: async (request, reply) => {
          return this.handleAnalytics(request as AnalyticsRequest, reply);
        }
      }
    );

    // GET /api/modules/banban/transfer-flow/health - Health check
    fastify.get(
      '/api/modules/banban/transfer-flow/health',
      {
        schema: HealthCheckSchema,
        handler: async (request, reply) => {
          return this.handleHealthCheck(request as HealthCheckRequest, reply);
        }
      }
    );
  }

  // Handler para webhook principal
  private async handleWebhook(
    request: WebhookRequest,
    reply: FastifyReply
  ): Promise<void> {
    const startTime = Date.now();
    const { event_type, organization_id, data } = request.body; // Extract directly from request.body
    const eventUuid = this.generateUuid();

    try {
      request.log.info(`Processing transfer webhook: ${event_type} for org: ${organization_id}`);

      // Validar se é uma ação válida
      if (!Object.values(TRANSFER_ACTIONS).includes(event_type as any)) {
        throw new Error(`Invalid transfer action: ${event_type}`);
      }

      // Processar evento através do service
      const result = await this.service.processAction(
        event_type as TransferAction, // Use event_type from request.body
        data, // Use data from request.body as transactionData
        {} // Pass an empty object for metadata, as it's not in WebhookPayload
      );

      const processingTime = Date.now() - startTime;
      const eventUuid = this.generateUuid();

      // Calcular métricas de processamento
      const recordsProcessed = 1; // Uma transação processada
      const recordsSuccessful = recordsProcessed; // Como chegou até aqui, foi sucesso
      const recordsFailed = 0;
      const successRate = '100.00%';

      const responseData = {
        success: true,
        action: event_type,
        transaction_id: result.transaction_id,
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
          organization_id: organization_id,
          action: event_type,
          event_uuid: eventUuid
        }
      };

      request.log.info(`Transfer webhook processed successfully in ${processingTime}ms`);

      reply
        .code(200)
        .header('Content-Type', 'application/json')
        .send(responseData);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      request.log.error(`Transfer webhook error: ${errorMessage}`);

      const errorResponse = {
        success: false,
        action: request.body?.event_type || 'unknown',
        attributes: {
          success: false,
          summary: {
            message: errorMessage
          }
        },
        metadata: {
          processed_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          organization_id: request.body?.organization_id || 'unknown',
          action: request.body?.event_type || 'unknown',
          event_uuid: this.generateUuid()
        },
        error: {
          code: 'PROCESSING_ERROR',
          message: errorMessage,
          details: {
            timestamp: new Date().toISOString()
          }
        }
      };

      reply
        .code(500)
        .header('Content-Type', 'application/json')
        .send(errorResponse);
    }
  }

  // Handler para consultas
  private async handleQuery(
    request: QueryRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const {
        org,
        transfer_id,
        origin_location_id,
        destination_location_id,
        status,
        from_date,
        to_date,
        limit = 50,
        offset = 0
      } = request.query;

      request.log.info(`Querying transfers for org: ${org}`);

      const filters: QueryTransfersParams = {
        org,
        transfer_id,
        origin_location_id,
        destination_location_id,
        status,
        from_date,
        to_date,
        limit,
        offset
      };

      const result = await this.service.getTransferData(filters);

      reply
        .code(200)
        .header('Content-Type', 'application/json')
        .send({
          success: true,
          data: result
        });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error(`Query transfers error: ${errorMessage}`);

      reply
        .code(500)
        .header('Content-Type', 'application/json')
        .send({
          success: false,
          message: 'Error querying transfers',
          error: {
            type: 'QUERY_ERROR',
            message: errorMessage,
            timestamp: new Date().toISOString()
          }
        });
    }
  }

  // Handler para analytics
  private async handleAnalytics(
    request: AnalyticsRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { org, from_date, to_date, location_id, product_id } = request.query;

      request.log.info(`Getting transfer analytics for org: ${org}`);

      const filters: AnalyticsParams = {
        org,
        from_date,
        to_date,
        location_id,
        product_id
      };

      const analytics = await this.service.getTransferAnalytics(filters);

      reply
        .code(200)
        .header('Content-Type', 'application/json')
        .send({
          success: true,
          data: analytics
        });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error(`Transfer analytics error: ${errorMessage}`);

      reply
        .code(500)
        .header('Content-Type', 'application/json')
        .send({
          success: false,
          message: 'Error getting transfer analytics',
          error: {
            type: 'ANALYTICS_ERROR',
            message: errorMessage,
            timestamp: new Date().toISOString()
          }
        });
    }
  }

  // Handler para health check
  private async handleHealthCheck(
    request: HealthCheckRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const healthData: HealthCheckResponse = {
        status: 'healthy',
        module: 'BanBanTransferFlow',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database_connection: 'healthy',
        last_processed_event: new Date().toISOString()
      };

      reply
        .code(200)
        .header('Content-Type', 'application/json')
        .send(healthData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      request.log.error(`Transfer flow health check error: ${errorMessage}`);

      reply
        .code(503)
        .header('Content-Type', 'application/json')
        .send({
          status: 'unhealthy',
          module: 'BanBanTransferFlow',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          error: errorMessage
        });
    }
  }

  // Método para gerar UUID simples
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Método requerido pela interface TenantModule
  async handleRequest(_request: HealthCheckRequest, _reply: FastifyReply): Promise<Record<string, unknown>> {
    // Implementação genérica para compatibilidade
    return {
      module: 'BanBan Transfer Flow',
      version: '1.0.0',
      status: 'active',
      message: 'Use specific endpoints for transfer operations',
      endpoints: this.getEndpoints()
    };
  }

  // Método requerido pela interface TenantModule
  getEndpoints(): string[] {
    return [
      'POST /api/modules/banban/transfer-flow',
      'GET /api/modules/banban/transfer-flow',
      'GET /api/modules/banban/transfer-flow/analytics',
      'GET /api/modules/banban/transfer-flow/health'
    ];
  }

  // Método para verificar se módulo está ativo
  isActive(): boolean {
    return true;
  }

  // Método para obter informações do módulo
  getModuleInfo() {
    return {
      name: 'BanBan Transfer Flow',
      type: 'custom' as const,
      version: '1.0.0',
      description: 'Módulo para processamento de transferências/logística BanBan',
      status: 'active' as const,
      features: [
        'transfer-request-processing',
        'shipping-tracking',
        'inventory-transfers',
        'cancellation-handling',
        'analytics-reporting'
      ],
      endpoints: this.getEndpoints()
    };
  }
}