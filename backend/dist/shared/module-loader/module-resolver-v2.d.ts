import { TenantModule } from '../types/module-types';
export declare class ModuleResolverV2 {
    private integrationCache;
    private banbanHub;
    constructor();
    getIntegrationHubForTenant(tenantId: string): Promise<any>;
    registerIntegrationHubs(fastify: any): Promise<void>;
    resolveModulesForTenant(tenantId: string): Promise<Record<string, TenantModule>>;
    clearCache(tenantId?: string): void;
    getAvailableIntegrationTemplates(): Record<string, any>;
}
//# sourceMappingURL=module-resolver-v2.d.ts.map