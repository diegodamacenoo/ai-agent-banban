/**
 * Integration Hub Framework
 * 
 * Framework base para criar integrações padronizadas com clientes.
 * Fornece classes base e utilitários comuns para conectores, webhooks e pipelines ETL.
 */

export { BaseConnector } from './base-connector';
export type { ConnectorConfig, HealthStatus, FlowMetrics } from './base-connector';

export { BaseWebhookHandler } from './webhook-handler';
export type { WebhookPayload, WebhookResponse, WebhookConfig } from './webhook-handler';

export { BaseETLPipeline } from './etl-pipeline';
export type { ETLConfig, ETLResult, ETLStep } from './etl-pipeline';

// Re-export tipos comuns
export type { ModuleInstance, ModuleInfo } from '../types/module-types';

/**
 * Utilitários para criação de novos conectores
 */
export class IntegrationHubUtils {
  /**
   * Cria configuração base para um novo conector
   */
  static createConnectorConfig(
    clientName: string,
    features: string[],
    version: string = '1.0.0'
  ): ConnectorConfig {
    return {
      name: `${clientName.toLowerCase()}-integration`,
      version,
      description: `Integration Hub para ${clientName}`,
      baseModule: 'integration-base',
      client: clientName,
      features
    };
  }

  /**
   * Cria configuração base para webhook
   */
  static createWebhookConfig(
    clientName: string,
    flowName: string,
    actions: Record<string, string>,
    requireAuth: boolean = true
  ): WebhookConfig {
    return {
      path: `/api/webhooks/${clientName.toLowerCase()}/${flowName}`,
      client: clientName,
      flow: flowName,
      actions,
      requireAuth,
      authToken: process.env.WEBHOOK_SECRET_TOKEN || 'default_webhook_secret'
    };
  }

  /**
   * Cria configuração base para pipeline ETL
   */
  static createETLConfig(
    clientName: string,
    organizationId: string,
    options?: Partial<ETLConfig>
  ): ETLConfig {
    return {
      client: clientName,
      organizationId,
      batchSize: 1000,
      retryAttempts: 3,
      timeoutMs: 300000, // 5 minutos
      ...options
    };
  }

  /**
   * Valida se um nome de cliente é válido
   */
  static validateClientName(clientName: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(clientName) && clientName.length >= 2;
  }

  /**
   * Normaliza nome de cliente para uso em URLs e identificadores
   */
  static normalizeClientName(clientName: string): string {
    return clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Gera endpoints padrão para um conector
   */
  static generateStandardEndpoints(clientName: string): string[] {
    const normalizedName = this.normalizeClientName(clientName);
    
    return [
      `/api/integrations/${normalizedName}/overview`,
      `/api/integrations/${normalizedName}/health`,
      `/api/integrations/${normalizedName}/metrics`,
      `/api/webhooks/${normalizedName}/sales`,
      `/api/webhooks/${normalizedName}/purchase`,
      `/api/webhooks/${normalizedName}/inventory`,
      `/api/webhooks/${normalizedName}/transfer`,
      `/api/webhooks/${normalizedName}/returns`,
      `/api/webhooks/${normalizedName}/etl`
    ];
  }

  /**
   * Features padrão para conectores de e-commerce
   */
  static getStandardEcommerceFeatures(): string[] {
    return [
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
    ];
  }

  /**
   * Actions padrão para diferentes tipos de webhook
   */
  static getStandardActions() {
    return {
      sales: {
        'register_sale': 'Registrar venda',
        'cancel_sale': 'Cancelar venda',
        'update_sale': 'Atualizar venda'
      },
      purchase: {
        'create_order': 'Criar pedido de compra',
        'approve_order': 'Aprovar pedido',
        'register_invoice': 'Registrar nota fiscal',
        'arrive_at_cd': 'Chegada no CD',
        'start_conference': 'Iniciar conferência',
        'scan_items': 'Escanear itens',
        'effectuate_cd': 'Efetivar no CD'
      },
      inventory: {
        'snapshot_inventory': 'Snapshot de inventário',
        'update_stock': 'Atualizar estoque',
        'adjust_inventory': 'Ajustar inventário'
      },
      transfer: {
        'create_transfer_request': 'Criar pedido de transferência',
        'create_separation_map': 'Criar mapa de separação',
        'start_separation': 'Iniciar separação',
        'complete_separation': 'Completar separação',
        'ship_transfer': 'Embarcar transferência',
        'invoice_transfer': 'Faturar transferência',
        'start_store_conference': 'Iniciar conferência na loja',
        'scan_store_items': 'Escanear itens na loja',
        'effectuate_store': 'Efetivar na loja'
      },
      returns: {
        'request_return': 'Solicitar devolução',
        'complete_return': 'Completar devolução',
        'transfer_between_stores': 'Transferência entre lojas'
      },
      etl: {
        'daily_etl': 'ETL diário',
        'custom_etl': 'ETL customizado',
        'incremental_sync': 'Sincronização incremental'
      }
    };
  }
}

/**
 * Template de exemplo para demonstrar uso do framework
 */
export const INTEGRATION_TEMPLATE_EXAMPLE = `
import { BaseConnector, IntegrationHubUtils, ConnectorConfig } from '@/shared/integration-hub';
import { FastifyInstance } from 'fastify';

// 1. Criar configuração
const config: ConnectorConfig = IntegrationHubUtils.createConnectorConfig(
  'MinhaEmpresa',
  IntegrationHubUtils.getStandardEcommerceFeatures()
);

// 2. Implementar conector
export class MinhaEmpresaConnector extends BaseConnector {
  constructor() {
    super(config);
  }

  async register(fastify: FastifyInstance): Promise<void> {
    // Registrar endpoints padrão
    this.registerHealthEndpoint(fastify, '/api/integrations/minhaempresa/health');
    this.registerOverviewEndpoint(fastify, '/api/integrations/minhaempresa/overview');
    
    // Registrar webhooks específicos
    // ... implementação dos webhooks
  }

  async handleRequest(request, reply): Promise<any> {
    return reply.send({ message: 'MinhaEmpresa Integration Active' });
  }

  getEndpoints(): string[] {
    return IntegrationHubUtils.generateStandardEndpoints('MinhaEmpresa');
  }
}
`;

export { INTEGRATION_TEMPLATE_EXAMPLE };