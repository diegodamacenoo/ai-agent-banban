export interface TenantInfo {
    id: string;
    name: string;
    clientType: 'banban' | 'standard' | 'custom';
    subdomain: string;
    features: string[];
    config: Record<string, any>;
}
export declare class TenantManager {
    private tenantCache;
    constructor();
    resolveTenant(request: any): Promise<TenantInfo | null>;
    getTenant(tenantId: string): TenantInfo | null;
    registerTenant(tenant: TenantInfo): void;
    getAllTenants(): TenantInfo[];
    hasFeature(tenantId: string, feature: string): boolean;
    private initializeDefaultTenants;
}
//# sourceMappingURL=tenant-manager.d.ts.map