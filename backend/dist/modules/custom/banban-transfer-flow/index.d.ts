import { FastifyInstance, FastifyReply } from 'fastify';
import { HealthCheckRequest } from './types/transfer-types';
export declare class BanBanTransferFlowModule {
    private service;
    name: string;
    version: string;
    description: string;
    constructor();
    register(fastify: FastifyInstance): Promise<void>;
    private registerRoutes;
    private handleWebhook;
    private handleQuery;
    private handleAnalytics;
    private handleHealthCheck;
    private generateUuid;
    handleRequest(_request: HealthCheckRequest, _reply: FastifyReply): Promise<Record<string, unknown>>;
    getEndpoints(): string[];
    isActive(): boolean;
    getModuleInfo(): {
        name: string;
        type: "custom";
        version: string;
        description: string;
        status: "active";
        features: string[];
        endpoints: string[];
    };
}
//# sourceMappingURL=index.d.ts.map