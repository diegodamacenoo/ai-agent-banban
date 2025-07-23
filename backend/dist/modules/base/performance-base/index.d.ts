import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ModuleInstance, ModuleConfig } from '../../../shared/types/module-types';
export interface PerformanceBaseConfig extends ModuleConfig {
    enableCaching?: boolean;
    cacheTimeout?: number;
    enableRealTimeMetrics?: boolean;
}
export declare class PerformanceBaseModule implements ModuleInstance {
    name: string;
    version: string;
    description: string;
    private service;
    private config;
    constructor(config: PerformanceBaseConfig);
    register(server: FastifyInstance, prefix?: string): Promise<void>;
    handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any>;
    private getBusinessMetrics;
    private getSummary;
    private calculateMetrics;
    private getHealth;
    getModuleInfo(): {
        name: string;
        type: "base";
        version: string;
        description: string;
        endpoints: string[];
        features: string[];
    };
    getEndpoints(): string[];
}
//# sourceMappingURL=index.d.ts.map