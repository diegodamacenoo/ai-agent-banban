import { TenantModule } from '../types/module-types';
export declare class ModuleResolver {
    private moduleCache;
    constructor();
    resolveModulesForTenant(tenantId: string): Promise<Record<string, TenantModule>>;
    clearCache(tenantId?: string): void;
}
//# sourceMappingURL=module-resolver.d.ts.map