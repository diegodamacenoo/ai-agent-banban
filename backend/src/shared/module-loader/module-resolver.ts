/**
 * ModuleResolver - Sistema de resolução de módulos para clientes multi-tenant
 */

import { logger } from '../../utils/logger';
import { BanBanPurchaseFlowModule } from '../../integrations/banban/flows/purchase';
import { BanBanInventoryFlowModule } from '../../integrations/banban/flows/inventory';
import { BanBanSalesFlowModule } from '../../integrations/banban/flows/sales';
import { BanBanTransferFlowModule } from '../../integrations/banban/flows/transfer';
import { BanBanReturnsFlowModule } from '../../integrations/banban/flows/returns';
import { BanBanETLFlowModule } from '../../integrations/banban/flows/etl';
import { BanBanPerformanceModule } from '../../integrations/banban/performance';
import { ModuleInfo, TenantModule } from '../types/module-types';


export class ModuleResolver {
  private moduleCache = new Map<string, Record<string, TenantModule>>();
  
  constructor() {
    logger.info('ModuleResolver initialized');
  }

  /**
   * Resolve módulos para um tenant específico
   */
  async resolveModulesForTenant(tenantId: string): Promise<Record<string, TenantModule>> {
    try {
      // Verificar cache primeiro
      if (this.moduleCache.has(tenantId)) {
        logger.debug(`Using cached modules for tenant: ${tenantId}`);
        return this.moduleCache.get(tenantId)!;
      }

      logger.debug(`Resolving modules for tenant: ${tenantId}`);

      // Resolver módulos baseado no tipo de cliente
      const modules: Record<string, TenantModule> = {};

      if (tenantId === 'banban-org-id') {
        // Módulos customizados do BanBan - Integration Hub Pattern
        modules.performance = new BanBanPerformanceModule();
        modules.purchaseFlow = new BanBanPurchaseFlowModule();
        modules.inventoryFlow = new BanBanInventoryFlowModule();
        modules.salesFlow = new BanBanSalesFlowModule();
        modules.transferFlow = new BanBanTransferFlowModule();
        modules.returnsFlow = new BanBanReturnsFlowModule();
        modules.etlFlow = new BanBanETLFlowModule();
      } else {
        // Nenhum tenant padrão - cada cliente deve ter módulos específicos
        logger.warn(`No modules configured for tenant: ${tenantId}`);
        throw new Error(`No modules available for tenant: ${tenantId}. Contact support to configure modules.`);
      }

      // Cache dos módulos
      this.moduleCache.set(tenantId, modules);
      
      logger.info(`Resolved ${Object.keys(modules).length} modules for tenant: ${tenantId}`);
      return modules;

    } catch (error) {
      logger.error(`Failed to resolve modules for tenant ${tenantId}:`, error);
      console.error('Detailed error:', error);
      return {};
    }
  }

  /**
   * Limpar cache de módulos
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.moduleCache.delete(tenantId);
      logger.debug(`Cache cleared for tenant: ${tenantId}`);
    } else {
      this.moduleCache.clear();
      logger.debug('All module cache cleared');
    }
  }
}

/**
 * Módulo base para implementações
 */
abstract class BaseModule implements TenantModule {
  protected abstract moduleName: string;
  protected abstract moduleVersion: string;
  protected abstract moduleDescription: string;
  protected abstract moduleEndpoints: string[];

  name = '';
  version = '';
  description = '';

  getModuleInfo(): ModuleInfo {
    return {
      name: this.moduleName,
      type: 'standard',
      version: this.moduleVersion,
      description: this.moduleDescription,
      endpoints: this.moduleEndpoints,
      features: [],
      status: 'active'
    };
  }

  getEndpoints(): string[] {
    return this.moduleEndpoints;
  }

  abstract handleRequest(request: any, reply: any): Promise<any>;
  abstract register(server: any, prefix?: string): Promise<void>;
}

/**
 * Módulo de Performance padrão
 */
class StandardPerformanceModule extends BaseModule {
  protected moduleName = 'performance-standard';
  protected moduleVersion = '1.0.0';
  protected moduleDescription = 'Standard performance monitoring module';
  protected moduleEndpoints = ['/metrics', '/health', '/status'];

  async handleRequest(request: any, reply: any): Promise<any> {
    return {
      module: 'performance-standard',
      status: 'operational',
      timestamp: new Date().toISOString(),
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        uptime: process.uptime()
      }
    };
  }

  async register(server: any, prefix = '/api/performance'): Promise<void> {
    server.get(`${prefix}/metrics`, async (request: any, reply: any) => {
      return {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        uptime: process.uptime()
      };
    });

    server.get(`${prefix}/status`, async (request: any, reply: any) => {
      return {
        status: 'healthy',
        module: 'performance-standard'
      };
    });
  }
}

/**
 * Módulo de Insights padrão
 */
class StandardInsightsModule extends BaseModule {
  protected moduleName = 'insights-standard';
  protected moduleVersion = '1.0.0';
  protected moduleDescription = 'Standard insights and analytics module';
  protected moduleEndpoints = ['/reports', '/analytics', '/dashboard'];

  async handleRequest(request: any, reply: any): Promise<any> {
    return {
      module: 'insights-standard',
      data: {
        totalSales: Math.floor(Math.random() * 10000),
        revenue: Math.floor(Math.random() * 100000),
        orders: Math.floor(Math.random() * 500)
      }
    };
  }

  async register(server: any, prefix = '/api/insights'): Promise<void> {
    server.get(`${prefix}/dashboard`, async (request: any, reply: any) => {
      return {
        totalSales: Math.floor(Math.random() * 10000),
        revenue: Math.floor(Math.random() * 100000),
        orders: Math.floor(Math.random() * 500)
      };
    });
  }
}

// Módulos customizados do BanBan agora são importados de arquivos separados
// As implementações estão em:
// - BanBanPerformanceModule: /modules/custom/banban-performance/
// - BanBanPurchaseFlowModule: /modules/custom/banban-purchase-flow/ 