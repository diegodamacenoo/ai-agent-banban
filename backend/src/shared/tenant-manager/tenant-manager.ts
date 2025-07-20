/**
 * TenantManager - Gerenciamento de tenants para sistema multi-tenant
 */

import { logger } from '../../utils/logger';

export interface TenantInfo {
  id: string;
  name: string;
  clientType: 'banban' | 'standard' | 'custom';
  subdomain: string;
  features: string[];
  config: Record<string, any>;
}

export class TenantManager {
  private tenantCache = new Map<string, TenantInfo>();
  
  constructor() {
    this.initializeDefaultTenants();
    logger.info('TenantManager initialized');
  }

  /**
   * Resolve tenant baseado na requisição
   */
  async resolveTenant(request: any): Promise<TenantInfo | null> {
    try {
      // Estratégias de resolução:
      // 1. Header X-Tenant-ID
      // 2. Subdomain
      // 3. Query parameter
      // SEGURANÇA: Nunca usar tenant padrão - sempre exigir identificação explícita

      let tenantId: string | null = null;

      // 1. Header X-Tenant-ID
      if (request.headers['x-tenant-id']) {
        tenantId = request.headers['x-tenant-id'];
        logger.debug(`Tenant resolved by header: ${tenantId}`);
      }

      // 2. Subdomain (hostname)
      if (!tenantId && request.hostname) {
        const hostname = request.hostname;
        if (hostname.includes('banban')) {
          tenantId = 'banban-org-id';
          logger.debug(`Tenant resolved by subdomain: ${tenantId}`);
        }
        // TODO: Adicionar outros subdomínios conforme necessário
        // if (hostname.includes('riachuelo')) tenantId = 'riachuelo-org-id';
        // if (hostname.includes('ca')) tenantId = 'ca-org-id';
      }

      // 3. Query parameter
      if (!tenantId && request.query?.tenant) {
        tenantId = request.query.tenant;
        logger.debug(`Tenant resolved by query: ${tenantId}`);
      }

      // 4. SEGURANÇA: Tenant obrigatório - falhar se não identificado
      if (!tenantId) {
        logger.warn('Tenant ID not provided in request - rejecting for security');
        throw new Error('Tenant identification required. Provide X-Tenant-ID header, subdomain, or tenant query parameter.');
      }

      const tenant = this.getTenant(tenantId);
      if (!tenant) {
        logger.warn(`Invalid tenant ID provided: ${tenantId}`);
        throw new Error(`Invalid tenant: ${tenantId}`);
      }

      logger.debug(`Tenant found: ${tenant.name} (${tenant.clientType})`);
      return tenant;

    } catch (error) {
      logger.error('Error resolving tenant:', error);
      return null;
    }
  }

  /**
   * Buscar tenant por ID
   */
  getTenant(tenantId: string): TenantInfo | null {
    return this.tenantCache.get(tenantId) || null;
  }

  /**
   * Registrar novo tenant
   */
  registerTenant(tenant: TenantInfo): void {
    this.tenantCache.set(tenant.id, tenant);
    logger.info(`Tenant registered: ${tenant.name} (${tenant.id})`);
  }

  /**
   * Listar todos os tenants
   */
  getAllTenants(): TenantInfo[] {
    return Array.from(this.tenantCache.values());
  }

  /**
   * Verificar se tenant tem funcionalidade específica
   */
  hasFeature(tenantId: string, feature: string): boolean {
    const tenant = this.getTenant(tenantId);
    return tenant?.features.includes(feature) || false;
  }

  /**
   * Inicializar tenants registrados
   */
  private initializeDefaultTenants(): void {
    // Tenant BanBan (customizado)
    this.registerTenant({
      id: 'banban-org-id',
      name: 'BanBan Footwear',
      clientType: 'banban',
      subdomain: 'banban',
      features: ['performance', 'insights', 'alerts', 'inventory', 'footwear-analytics'],
      config: {
        theme: 'banban',
        modules: ['performance', 'insights', 'alerts'],
        industry: 'footwear',
        customEndpoints: true
      }
    });

    // TODO: Adicionar outros tenants conforme necessário
    // this.registerTenant({
    //   id: 'riachuelo-org-id',
    //   name: 'Riachuelo Fashion',
    //   clientType: 'custom',
    //   subdomain: 'riachuelo',
    //   features: ['performance', 'insights', 'fashion-analytics'],
    //   config: { theme: 'riachuelo', industry: 'fashion' }
    // });

    logger.info(`${this.tenantCache.size} tenants initialized`);
  }
} 