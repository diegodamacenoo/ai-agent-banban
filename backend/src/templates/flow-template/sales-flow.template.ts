import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { ModuleInstance, ModuleInfo } from '../../shared/types/module-types';
import { BaseWebhookHandler, WebhookConfig, IntegrationHubUtils } from '../../shared/integration-hub';

/**
 * Template para Sales Flow baseado no modelo Banban
 * 
 * Para usar este template:
 * 1. Substitua {{CLIENT_NAME}} pelo nome do cliente (ex: Riachuelo)
 * 2. Substitua {{CLIENT_NAME_LOWER}} pelo nome em minúsculas (ex: riachuelo)
 * 3. Implemente o serviço específico do cliente
 * 4. Ajuste os schemas conforme necessário
 */

// Configuração do webhook
const webhookConfig: WebhookConfig = IntegrationHubUtils.createWebhookConfig(
  '{{CLIENT_NAME}}',
  'sales',
  IntegrationHubUtils.getStandardActions().sales,
  true
);

interface {{CLIENT_NAME}}SalesService {
  processAction(action: string, attributes: any, metadata?: any): Promise<any>;
  getSalesData(query: any): Promise<any>;
  getSalesAnalytics(organizationId: string, filters: any): Promise<any>;
}

export class {{CLIENT_NAME}}SalesFlowModule extends BaseWebhookHandler implements ModuleInstance {
  name = '{{CLIENT_NAME_LOWER}}-sales-flow';
  version = '1.0.0';
  description = 'Módulo de fluxo de vendas para {{CLIENT_NAME}}';
  baseModule = 'flow-base';
  
  private service: {{CLIENT_NAME}}SalesService;

  constructor(service: {{CLIENT_NAME}}SalesService) {
    super(webhookConfig);
    this.service = service;
  }

  async register(fastify: FastifyInstance, prefix?: string): Promise<void> {
    // Registrar webhook principal
    super.register(fastify);

    // Registrar endpoint de analytics específico
    this.registerAnalyticsEndpoint(fastify);

    // Registrar health check específico
    this.registerHealthCheck(fastify);
  }

  /**
   * Processa ações do sales flow
   */
  protected async processAction(action: string, attributes: any, metadata?: any): Promise<any> {
    console.debug(`{{CLIENT_NAME}} Sales Flow: Processing action ${action}`);

    switch (action) {
      case 'register_sale':
        return await this.service.processAction('register_sale', attributes, metadata);
        
      case 'cancel_sale':
        return await this.service.processAction('cancel_sale', attributes, metadata);
        
      case 'update_sale':
        return await this.service.processAction('update_sale', attributes, metadata);
        
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }
  }

  /**
   * Registra endpoint de analytics
   */
  private registerAnalyticsEndpoint(fastify: FastifyInstance): void {
    fastify.get('/api/modules/{{CLIENT_NAME_LOWER}}/sales-flow/analytics', {
      schema: {
        description: 'Analytics de vendas {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', 'Sales', 'Analytics'],
        querystring: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization ID (obrigatório)' },
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' },
            customer_id: { type: 'string' },
            location_id: { type: 'string' }
          },
          required: ['org']
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        
        if (!query.org) {
          return reply.headers(this.getCorsHeaders()).code(400).send({
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

        return reply.headers(this.getCorsHeaders()).send({
          success: true,
          data: analytics
        });

      } catch (error: any) {
        console.error('{{CLIENT_NAME}} sales analytics error:', error);
        return reply.headers(this.getCorsHeaders()).code(500).send({
          success: false,
          error: 'Erro ao obter analytics de vendas'
        });
      }
    });
  }

  /**
   * Registra health check específico
   */
  private registerHealthCheck(fastify: FastifyInstance): void {
    fastify.get('/api/modules/{{CLIENT_NAME_LOWER}}/sales-flow/health', {
      schema: {
        description: 'Health check do Sales Flow {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', 'Sales', 'Health']
      }
    }, async (request, reply) => {
      return reply.headers(this.getCorsHeaders()).send({
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
        events: Object.keys(webhookConfig.actions),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handler para consultas GET
   */
  protected async handleQuery(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const result = await this.service.getSalesData(request.query as any);
      return reply.headers(this.getCorsHeaders()).send({ 
        success: true, 
        data: result, 
        timestamp: new Date().toISOString() 
      });

    } catch (error: any) {
      console.error('{{CLIENT_NAME}} sales query error:', error);
      return reply.headers(this.getCorsHeaders()).code(500).send({ 
        success: false, 
        error: error.message, 
        timestamp: new Date().toISOString() 
      });
    }
  }

  /**
   * Indica que suporta consultas GET
   */
  protected supportsQueryEndpoint(): boolean {
    return true;
  }

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    return reply.send({ 
      message: '{{CLIENT_NAME}} Sales Flow Module is active',
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
        '/api/webhooks/{{CLIENT_NAME_LOWER}}/sales',
        '/api/modules/{{CLIENT_NAME_LOWER}}/sales-flow/analytics',
        '/api/modules/{{CLIENT_NAME_LOWER}}/sales-flow/health'
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

/**
 * Serviço de exemplo - deve ser implementado para cada cliente
 */
export class {{CLIENT_NAME}}SalesService implements {{CLIENT_NAME}}SalesService {
  async processAction(action: string, attributes: any, metadata?: any): Promise<any> {
    // TODO: Implementar lógica específica do cliente
    console.debug(`Processing {{CLIENT_NAME}} sales action: ${action}`);
    
    return {
      transaction_id: randomUUID(),
      external_id: attributes.external_id,
      status: 'PROCESSED',
      entity_type: 'SALE',
      entity_id: attributes.external_id
    };
  }

  async getSalesData(query: any): Promise<any> {
    // TODO: Implementar consulta de dados específica do cliente
    console.debug(`Querying {{CLIENT_NAME}} sales data:`, query);
    
    return {
      sales: [],
      total: 0
    };
  }

  async getSalesAnalytics(organizationId: string, filters: any): Promise<any> {
    // TODO: Implementar analytics específico do cliente
    console.debug(`Generating {{CLIENT_NAME}} sales analytics for org:`, organizationId);
    
    return {
      summary: {
        total_sales: 0,
        total_revenue: 0,
        avg_order_value: 0
      },
      trends: [],
      top_products: [],
      customer_segments: []
    };
  }
}

// Exemplo de uso:
/*
import { {{CLIENT_NAME}}SalesFlowModule, {{CLIENT_NAME}}SalesService } from './templates/flow-template/sales-flow.template';

// 1. Implementar serviço específico
const salesService = new {{CLIENT_NAME}}SalesService();

// 2. Criar módulo
const salesFlow = new {{CLIENT_NAME}}SalesFlowModule(salesService);

// 3. Registrar no Fastify
await salesFlow.register(fastify);
*/