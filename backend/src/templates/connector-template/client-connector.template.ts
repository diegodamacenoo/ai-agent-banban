import { FastifyInstance } from 'fastify';
import { BaseConnector, ConnectorConfig, IntegrationHubUtils } from '../../shared/integration-hub';

/**
 * Template para Connector de Cliente baseado no modelo Banban
 * 
 * Para usar este template:
 * 1. Substitua {{CLIENT_NAME}} pelo nome do cliente (ex: Riachuelo)
 * 2. Substitua {{CLIENT_NAME_LOWER}} pelo nome em minúsculas (ex: riachuelo)
 * 3. Implemente os módulos de fluxo específicos
 * 4. Configure os features necessários
 */

// Importar módulos de fluxo (a serem implementados)
// import { {{CLIENT_NAME}}SalesFlowModule } from '../integrations/{{CLIENT_NAME_LOWER}}/flows/sales';
// import { {{CLIENT_NAME}}PurchaseFlowModule } from '../integrations/{{CLIENT_NAME_LOWER}}/flows/purchase';
// import { {{CLIENT_NAME}}InventoryFlowModule } from '../integrations/{{CLIENT_NAME_LOWER}}/flows/inventory';
// import { {{CLIENT_NAME}}TransferFlowModule } from '../integrations/{{CLIENT_NAME_LOWER}}/flows/transfer';
// import { {{CLIENT_NAME}}ReturnsFlowModule } from '../integrations/{{CLIENT_NAME_LOWER}}/flows/returns';
// import { {{CLIENT_NAME}}ETLFlowModule } from '../integrations/{{CLIENT_NAME_LOWER}}/flows/etl';
// import { {{CLIENT_NAME}}PerformanceModule } from '../integrations/{{CLIENT_NAME_LOWER}}/performance';

// Configuração do conector
const connectorConfig: ConnectorConfig = IntegrationHubUtils.createConnectorConfig(
  '{{CLIENT_NAME}}',
  [
    'sales-processing',
    'purchase-management',
    'inventory-control',
    'transfer-management',
    'returns-processing',
    'etl-automation',
    'performance-analytics',
    'eca-engine',
    'real-time-webhooks',
    'audit-logging'
  ],
  '1.0.0'
);

export interface {{CLIENT_NAME}}IntegrationHubInfo {
  client: string;
  version: string;
  description: string;
  flows: string[];
  features: string[];
  health: {
    status: string;
    timestamp: string;
    flows_status: Record<string, string>;
  };
}

export class {{CLIENT_NAME}}IntegrationHub extends BaseConnector {
  // Módulos de fluxo (descomente e implemente conforme necessário)
  // private salesFlow: {{CLIENT_NAME}}SalesFlowModule;
  // private purchaseFlow: {{CLIENT_NAME}}PurchaseFlowModule;
  // private inventoryFlow: {{CLIENT_NAME}}InventoryFlowModule;
  // private transferFlow: {{CLIENT_NAME}}TransferFlowModule;
  // private returnsFlow: {{CLIENT_NAME}}ReturnsFlowModule;
  // private etlFlow: {{CLIENT_NAME}}ETLFlowModule;
  // private performanceModule: {{CLIENT_NAME}}PerformanceModule;

  constructor() {
    super(connectorConfig);
    
    // Inicializar módulos (descomente conforme implementar)
    // this.salesFlow = new {{CLIENT_NAME}}SalesFlowModule();
    // this.purchaseFlow = new {{CLIENT_NAME}}PurchaseFlowModule();
    // this.inventoryFlow = new {{CLIENT_NAME}}InventoryFlowModule();
    // this.transferFlow = new {{CLIENT_NAME}}TransferFlowModule();
    // this.returnsFlow = new {{CLIENT_NAME}}ReturnsFlowModule();
    // this.etlFlow = new {{CLIENT_NAME}}ETLFlowModule();
    // this.performanceModule = new {{CLIENT_NAME}}PerformanceModule();
  }

  async register(fastify: FastifyInstance, prefix: string = '/api/integrations/{{CLIENT_NAME_LOWER}}'): Promise<void> {
    // Registrar endpoints base
    this.registerHealthEndpoint(fastify, `${prefix}/health`);
    this.registerOverviewEndpoint(fastify, `${prefix}/overview`);

    // Registrar módulos de fluxo (descomente conforme implementar)
    // await this.salesFlow.register(fastify);
    // await this.purchaseFlow.register(fastify);
    // await this.inventoryFlow.register(fastify);
    // await this.transferFlow.register(fastify);
    // await this.returnsFlow.register(fastify);
    // await this.etlFlow.register(fastify);
    // await this.performanceModule.register(fastify);

    // Endpoint de métricas consolidadas
    this.registerMetricsEndpoint(fastify, `${prefix}/metrics`);

    // Endpoint de configuração ECA (se aplicável)
    this.registerECAEndpoints(fastify, prefix);

    console.debug(`{{CLIENT_NAME}} Integration Hub registered with prefix: ${prefix}`);
  }

  /**
   * Registra endpoint de métricas
   */
  private registerMetricsEndpoint(fastify: FastifyInstance, path: string): void {
    fastify.get(path, {
      schema: {
        description: 'Métricas consolidadas da integração {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', 'Integration', 'Metrics'],
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
    }, async (request, reply) => {
      const query = request.query as any;
      
      if (!query.org) {
        return reply.code(400).send({
          error: 'organization_id (org) é obrigatório'
        });
      }

      try {
        const metrics = await this.getIntegrationMetrics(query.org, {
          dateFrom: query.from,
          dateTo: query.to
        });

        return reply.send(metrics);
      } catch (error: any) {
        console.error('{{CLIENT_NAME}} metrics error:', error);
        return reply.code(500).send({
          error: 'Erro ao obter métricas da integração'
        });
      }
    });
  }

  /**
   * Registra endpoints ECA
   */
  private registerECAEndpoints(fastify: FastifyInstance, prefix: string): void {
    // Endpoint para listar regras ECA
    fastify.get(`${prefix}/eca/rules`, {
      schema: {
        description: 'Lista regras ECA ativas para {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', 'Integration', 'ECA']
      }
    }, async (request, reply) => {
      // TODO: Implementar lógica ECA específica do cliente
      return reply.send({
        total_rules: 0,
        enabled_rules: 0,
        rules: []
      });
    });

    // Endpoint para testar ECA
    fastify.post(`${prefix}/eca/test`, {
      schema: {
        description: 'Testar processamento ECA para {{CLIENT_NAME}}',
        tags: ['{{CLIENT_NAME}}', 'Integration', 'ECA'],
        body: {
          type: 'object',
          properties: {
            event_type: { type: 'string' },
            organization_id: { type: 'string' },
            data: { type: 'object' }
          },
          required: ['event_type', 'organization_id', 'data']
        }
      }
    }, async (request, reply) => {
      const payload = request.body as any;
      
      // TODO: Implementar processamento ECA específico
      console.debug(`{{CLIENT_NAME}} ECA test:`, {
        event_type: payload.event_type,
        organization_id: payload.organization_id
      });

      return reply.send({
        success: true,
        message: `ECA test processed for ${payload.event_type}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Retorna informações da integração
   */
  async getIntegrationInfo(): Promise<{{CLIENT_NAME}}IntegrationHubInfo> {
    const flows = [
      // Listar flows implementados
      // this.salesFlow.name,
      // this.purchaseFlow.name,
      // etc...
    ];

    const flowsStatus: Record<string, string> = {};
    flows.forEach(flow => {
      flowsStatus[flow] = 'healthy'; // Implementar verificação real
    });

    return {
      client: '{{CLIENT_NAME}}',
      version: this.version,
      description: `Integration Hub para {{CLIENT_NAME}} - ECA + Analytics + ETL`,
      flows,
      features: this.config.features,
      health: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        flows_status: flowsStatus
      }
    };
  }

  /**
   * Retorna métricas da integração
   */
  async getIntegrationMetrics(organizationId: string, filters: any = {}): Promise<any> {
    try {
      // TODO: Implementar lógica de métricas específica do cliente
      console.debug(`Generating {{CLIENT_NAME}} metrics for org:`, organizationId);

      // Métricas dos fluxos (exemplo)
      const flowMetrics = {
        sales_flow: {
          total_events: 0,
          success_rate: 1.0
        },
        inventory_flow: {
          total_events: 0,
          success_rate: 1.0
        },
        purchase_flow: {
          total_events: 0,
          success_rate: 1.0
        },
        transfer_flow: {
          total_events: 0,
          success_rate: 1.0
        }
      };

      return {
        organization_id: organizationId,
        period: {
          from: filters.dateFrom || new Date(Date.now() - 30*24*60*60*1000).toISOString(),
          to: filters.dateTo || new Date().toISOString()
        },
        flow_metrics: flowMetrics,
        integration_health: {
          overall_success_rate: 1.0,
          total_events_processed: 0,
          avg_processing_time_ms: 250
        }
      };

    } catch (error: any) {
      console.error('{{CLIENT_NAME}} metrics error:', error);
      throw new Error(`Erro ao gerar métricas: ${error.message}`);
    }
  }

  async handleRequest(request: any, reply: any): Promise<any> {
    return reply.send({ 
      message: '{{CLIENT_NAME}} Integration Hub is active',
      version: this.version,
      timestamp: new Date().toISOString()
    });
  }

  getEndpoints(): string[] {
    return IntegrationHubUtils.generateStandardEndpoints('{{CLIENT_NAME}}');
  }

  // Getters para acesso aos módulos individuais (descomente conforme implementar)
  // getSalesFlow(): {{CLIENT_NAME}}SalesFlowModule { return this.salesFlow; }
  // getPurchaseFlow(): {{CLIENT_NAME}}PurchaseFlowModule { return this.purchaseFlow; }
  // getInventoryFlow(): {{CLIENT_NAME}}InventoryFlowModule { return this.inventoryFlow; }
  // getTransferFlow(): {{CLIENT_NAME}}TransferFlowModule { return this.transferFlow; }
  // getReturnsFlow(): {{CLIENT_NAME}}ReturnsFlowModule { return this.returnsFlow; }
  // getETLFlow(): {{CLIENT_NAME}}ETLFlowModule { return this.etlFlow; }
  // getPerformanceModule(): {{CLIENT_NAME}}PerformanceModule { return this.performanceModule; }
}

export default {{CLIENT_NAME}}IntegrationHub;

// Exemplo de uso:
/*
import { {{CLIENT_NAME}}IntegrationHub } from './templates/connector-template/client-connector.template';

// 1. Criar instância da integração
const {{CLIENT_NAME_LOWER}}Hub = new {{CLIENT_NAME}}IntegrationHub();

// 2. Registrar no Fastify
app.register(async function (fastify) {
  await {{CLIENT_NAME_LOWER}}Hub.register(fastify);
});

// 3. Acessar módulos individuais (se necessário)
// const salesFlow = {{CLIENT_NAME_LOWER}}Hub.getSalesFlow();
*/