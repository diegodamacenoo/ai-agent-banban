import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { BaseWebhookHandler, WebhookConfig, IntegrationHubUtils } from '../../shared/integration-hub';
import { ModuleInstance, ModuleInfo } from '../../shared/types/module-types';

/**
 * Template para Webhook Flow baseado no modelo Banban
 * 
 * Para usar este template:
 * 1. Substitua {{CLIENT_NAME}} pelo nome do cliente (ex: Riachuelo)
 * 2. Substitua {{CLIENT_NAME_LOWER}} pelo nome em minúsculas (ex: riachuelo)
 * 3. Substitua {{FLOW_NAME}} pelo nome do fluxo (ex: Purchase, Inventory, etc.)
 * 4. Substitua {{FLOW_NAME_LOWER}} pelo nome do fluxo em minúsculas (ex: purchase, inventory)
 * 5. Implemente o serviço específico do fluxo
 * 6. Configure as ações específicas do fluxo
 */

// Actions específicas do fluxo (customize conforme necessário)
const {{FLOW_NAME_UPPER}}_ACTIONS = {
  // Exemplo para Purchase Flow:
  'create_{{FLOW_NAME_LOWER}}': 'Criar {{FLOW_NAME_LOWER}}',
  'update_{{FLOW_NAME_LOWER}}': 'Atualizar {{FLOW_NAME_LOWER}}',
  'complete_{{FLOW_NAME_LOWER}}': 'Completar {{FLOW_NAME_LOWER}}',
  'cancel_{{FLOW_NAME_LOWER}}': 'Cancelar {{FLOW_NAME_LOWER}}'
};

// Configuração do webhook
const webhookConfig: WebhookConfig = {
  path: '/api/webhooks/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}',
  client: '{{CLIENT_NAME}}',
  flow: '{{FLOW_NAME_LOWER}}',
  actions: {{FLOW_NAME_UPPER}}_ACTIONS,
  requireAuth: true,
  authToken: process.env.WEBHOOK_SECRET_TOKEN || 'default_webhook_secret'
};

interface {{CLIENT_NAME}}{{FLOW_NAME}}Service {
  processAction(action: string, attributes: any, metadata?: any): Promise<any>;
  get{{FLOW_NAME}}Data(query: any): Promise<any>;
  get{{FLOW_NAME}}Analytics?(organizationId: string, filters: any): Promise<any>;
}

export class {{CLIENT_NAME}}{{FLOW_NAME}}FlowModule extends BaseWebhookHandler implements ModuleInstance {
  name = '{{CLIENT_NAME_LOWER}}-{{FLOW_NAME_LOWER}}-flow';
  version = '1.0.0';
  description = 'Módulo de fluxo {{FLOW_NAME_LOWER}} para {{CLIENT_NAME}}';
  baseModule = 'flow-base';
  
  private service: {{CLIENT_NAME}}{{FLOW_NAME}}Service;

  constructor(service: {{CLIENT_NAME}}{{FLOW_NAME}}Service) {
    super(webhookConfig);
    this.service = service;
  }

  async register(fastify: FastifyInstance, prefix?: string): Promise<void> {
    // Registrar webhook principal
    super.register(fastify);

    // Registrar endpoints adicionais específicos do fluxo
    this.registerAdditionalEndpoints(fastify);

    // Registrar health check específico
    this.registerHealthCheck(fastify);
  }

  /**
   * Processa ações do {{FLOW_NAME_LOWER}} flow
   */
  protected async processAction(action: string, attributes: any, metadata?: any): Promise<any> {
    console.debug(`{{CLIENT_NAME}} {{FLOW_NAME}} Flow: Processing action ${action}`);

    // Validações específicas do fluxo
    this.validateFlowSpecificData(action, attributes);

    // Processar ação
    const result = await this.service.processAction(action, attributes, metadata);

    // Log específico do fluxo
    console.debug(`{{CLIENT_NAME}} {{FLOW_NAME}} Flow: Action ${action} completed`, {
      external_id: attributes.external_id,
      status: result.status,
      transaction_id: result.transaction_id
    });

    return result;
  }

  /**
   * Validações específicas do fluxo
   */
  private validateFlowSpecificData(action: string, attributes: any): void {
    // Validações comuns
    if (!attributes.external_id) {
      throw new Error('external_id é obrigatório');
    }

    // Validações específicas por ação (customize conforme necessário)
    switch (action) {
      case 'create_{{FLOW_NAME_LOWER}}':
        this.validateCreate{{FLOW_NAME}}(attributes);
        break;
      case 'update_{{FLOW_NAME_LOWER}}':
        this.validateUpdate{{FLOW_NAME}}(attributes);
        break;
      case 'complete_{{FLOW_NAME_LOWER}}':
        this.validateComplete{{FLOW_NAME}}(attributes);
        break;
      case 'cancel_{{FLOW_NAME_LOWER}}':
        this.validateCancel{{FLOW_NAME}}(attributes);
        break;
    }
  }

  private validateCreate{{FLOW_NAME}}(attributes: any): void {
    // TODO: Implementar validações específicas para criação
    if (!attributes.items || !Array.isArray(attributes.items)) {
      throw new Error('items deve ser um array');
    }
  }

  private validateUpdate{{FLOW_NAME}}(attributes: any): void {
    // TODO: Implementar validações específicas para atualização
  }

  private validateComplete{{FLOW_NAME}}(attributes: any): void {
    // TODO: Implementar validações específicas para conclusão
  }

  private validateCancel{{FLOW_NAME}}(attributes: any): void {
    // TODO: Implementar validações específicas para cancelamento
  }

  /**
   * Registra endpoints adicionais específicos do fluxo
   */
  private registerAdditionalEndpoints(fastify: FastifyInstance): void {
    // Endpoint de analytics (se aplicável)
    if (this.service.get{{FLOW_NAME}}Analytics) {
      this.registerAnalyticsEndpoint(fastify);
    }

    // Endpoint de relatórios específicos
    this.registerReportsEndpoint(fastify);

    // Endpoints específicos do {{FLOW_NAME_LOWER}} (adicione conforme necessário)
    this.registerFlowSpecificEndpoints(fastify);
  }

  private registerAnalyticsEndpoint(fastify: FastifyInstance): void {
    fastify.get('/api/modules/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}-flow/analytics', {
      schema: {
        description: 'Analytics de {{FLOW_NAME_LOWER}} {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', '{{FLOW_NAME}}', 'Analytics'],
        querystring: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization ID (obrigatório)' },
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' }
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

        if (!this.service.get{{FLOW_NAME}}Analytics) {
          return reply.headers(this.getCorsHeaders()).code(501).send({
            success: false,
            error: 'Analytics não implementado para este fluxo'
          });
        }

        const analytics = await this.service.get{{FLOW_NAME}}Analytics(query.org, {
          dateFrom: query.from,
          dateTo: query.to
        });

        return reply.headers(this.getCorsHeaders()).send({
          success: true,
          data: analytics
        });

      } catch (error: any) {
        console.error('{{CLIENT_NAME}} {{FLOW_NAME_LOWER}} analytics error:', error);
        return reply.headers(this.getCorsHeaders()).code(500).send({
          success: false,
          error: 'Erro ao obter analytics de {{FLOW_NAME_LOWER}}'
        });
      }
    });
  }

  private registerReportsEndpoint(fastify: FastifyInstance): void {
    fastify.get('/api/modules/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}-flow/reports/:reportType', {
      schema: {
        description: 'Relatórios específicos de {{FLOW_NAME_LOWER}} {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', '{{FLOW_NAME}}', 'Reports'],
        params: {
          type: 'object',
          properties: {
            reportType: { type: 'string', enum: ['summary', 'detailed', 'performance'] }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization ID (obrigatório)' },
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' }
          },
          required: ['org']
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as any;
        const query = request.query as any;
        
        // TODO: Implementar lógica de relatórios específica
        const reportData = await this.generateReport(params.reportType, query);

        return reply.headers(this.getCorsHeaders()).send({
          success: true,
          report_type: params.reportType,
          data: reportData,
          generated_at: new Date().toISOString()
        });

      } catch (error: any) {
        console.error('{{CLIENT_NAME}} {{FLOW_NAME_LOWER}} report error:', error);
        return reply.headers(this.getCorsHeaders()).code(500).send({
          success: false,
          error: 'Erro ao gerar relatório'
        });
      }
    });
  }

  private registerFlowSpecificEndpoints(fastify: FastifyInstance): void {
    // TODO: Adicionar endpoints específicos do {{FLOW_NAME_LOWER}} flow
    // Exemplo para Purchase Flow: endpoint de suppliers
    // Exemplo para Inventory Flow: endpoint de locations
    // Exemplo para Transfer Flow: endpoint de routes
    
    console.debug(`{{CLIENT_NAME}} {{FLOW_NAME}} Flow: Flow-specific endpoints registered`);
  }

  private async generateReport(reportType: string, filters: any): Promise<any> {
    // TODO: Implementar geração de relatórios específicos
    console.debug(`Generating {{CLIENT_NAME}} {{FLOW_NAME_LOWER}} report:`, reportType);
    
    return {
      report_type: reportType,
      organization_id: filters.org,
      period: {
        from: filters.from,
        to: filters.to
      },
      data: {},
      summary: {
        total_records: 0,
        success_rate: 100
      }
    };
  }

  /**
   * Registra health check específico
   */
  private registerHealthCheck(fastify: FastifyInstance): void {
    fastify.get('/api/modules/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}-flow/health', {
      schema: {
        description: 'Health check do {{FLOW_NAME}} Flow {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', '{{FLOW_NAME}}', 'Health']
      }
    }, async (request, reply) => {
      return reply.headers(this.getCorsHeaders()).send({
        module: this.name,
        status: 'healthy',
        version: this.version,
        baseModule: this.baseModule,
        features: this.getFlowFeatures(),
        actions: Object.keys({{FLOW_NAME_UPPER}}_ACTIONS),
        endpoints: this.getEndpoints(),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Retorna features específicas do fluxo
   */
  private getFlowFeatures(): string[] {
    // TODO: Customize features específicas do {{FLOW_NAME_LOWER}} flow
    return [
      '{{FLOW_NAME_LOWER}}-processing',
      '{{FLOW_NAME_LOWER}}-validation',
      '{{FLOW_NAME_LOWER}}-analytics',
      '{{FLOW_NAME_LOWER}}-reporting',
      'real-time-updates',
      'audit-logging'
    ];
  }

  /**
   * Handler para consultas GET
   */
  protected async handleQuery(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const result = await this.service.get{{FLOW_NAME}}Data(request.query as any);
      return reply.headers(this.getCorsHeaders()).send({ 
        success: true, 
        data: result, 
        timestamp: new Date().toISOString() 
      });

    } catch (error: any) {
      console.error('{{CLIENT_NAME}} {{FLOW_NAME_LOWER}} query error:', error);
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
      message: '{{CLIENT_NAME}} {{FLOW_NAME}} Flow Module is active',
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
      endpoints: this.getEndpoints(),
      features: this.getFlowFeatures(),
      inheritsFrom: this.baseModule
    };
  }

  getEndpoints(): string[] {
    const baseEndpoints = [
      '/api/webhooks/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}',
      '/api/modules/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}-flow/health'
    ];

    const optionalEndpoints = [];
    
    if (this.service.get{{FLOW_NAME}}Analytics) {
      optionalEndpoints.push('/api/modules/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}-flow/analytics');
    }
    
    optionalEndpoints.push('/api/modules/{{CLIENT_NAME_LOWER}}/{{FLOW_NAME_LOWER}}-flow/reports/:reportType');

    return [...baseEndpoints, ...optionalEndpoints];
  }
}

/**
 * Serviço de exemplo - deve ser implementado para cada cliente/fluxo
 */
export class {{CLIENT_NAME}}{{FLOW_NAME}}Service implements {{CLIENT_NAME}}{{FLOW_NAME}}Service {
  async processAction(action: string, attributes: any, metadata?: any): Promise<any> {
    // TODO: Implementar lógica específica do cliente para {{FLOW_NAME_LOWER}}
    console.debug(`Processing {{CLIENT_NAME}} {{FLOW_NAME_LOWER}} action: ${action}`);
    
    return {
      transaction_id: randomUUID(),
      external_id: attributes.external_id,
      status: 'PROCESSED',
      entity_type: '{{FLOW_NAME_UPPER}}',
      entity_id: attributes.external_id
    };
  }

  async get{{FLOW_NAME}}Data(query: any): Promise<any> {
    // TODO: Implementar consulta de dados específica do cliente
    console.debug(`Querying {{CLIENT_NAME}} {{FLOW_NAME_LOWER}} data:`, query);
    
    return {
      {{FLOW_NAME_LOWER}}_records: [],
      total: 0
    };
  }

  // Opcional: implementar analytics se necessário
  async get{{FLOW_NAME}}Analytics?(organizationId: string, filters: any): Promise<any> {
    // TODO: Implementar analytics específico do cliente
    console.debug(`Generating {{CLIENT_NAME}} {{FLOW_NAME_LOWER}} analytics for org:`, organizationId);
    
    return {
      summary: {
        total_{{FLOW_NAME_LOWER}}_records: 0,
        success_rate: 100,
        avg_processing_time: 0
      },
      trends: [],
      performance_metrics: []
    };
  }
}

// Exemplo de uso:
/*
import { {{CLIENT_NAME}}{{FLOW_NAME}}FlowModule, {{CLIENT_NAME}}{{FLOW_NAME}}Service } from './templates/webhook-template/webhook-flow.template';

// 1. Implementar serviço específico
const {{FLOW_NAME_LOWER}}Service = new {{CLIENT_NAME}}{{FLOW_NAME}}Service();

// 2. Criar módulo
const {{FLOW_NAME_LOWER}}Flow = new {{CLIENT_NAME}}{{FLOW_NAME}}FlowModule({{FLOW_NAME_LOWER}}Service);

// 3. Registrar no Fastify
await {{FLOW_NAME_LOWER}}Flow.register(fastify);
*/