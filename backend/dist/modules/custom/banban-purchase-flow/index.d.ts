import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ModuleInstance, ModuleInfo } from '../../../shared/types/module-types';
export declare class BanBanPurchaseFlowModule implements ModuleInstance {
    name: string;
    version: string;
    description: string;
    baseModule: string;
    private service;
    constructor();
    register(fastify: FastifyInstance, prefix?: string): Promise<void>;
    handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any>;
    getModuleInfo(): ModuleInfo;
    getEndpoints(): string[];
}
//# sourceMappingURL=index.d.ts.map