import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
export interface ModuleInfo {
    name: string;
    type: 'standard' | 'custom';
    version: string;
    description: string;
    endpoints: string[];
    features: string[];
    status?: 'active' | 'inactive' | 'maintenance';
    inheritsFrom?: string;
}
export interface ModuleInstance {
    name: string;
    version: string;
    description: string;
    register(fastify: FastifyInstance, prefix?: string): Promise<void>;
    handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any>;
    getModuleInfo(): ModuleInfo;
    getEndpoints(): string[];
}
export interface TenantModule extends ModuleInstance {
}
export interface TenantModuleCompat {
    getModuleInfo(): ModuleInfo;
    handleRequest(request: any, reply: any): Promise<any>;
    register(server: any, prefix?: string): Promise<void>;
}
//# sourceMappingURL=module-types.d.ts.map