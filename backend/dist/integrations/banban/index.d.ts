import { FastifyInstance } from 'fastify';
import { BanBanSalesFlowModule } from './flows/sales/index';
import { BanBanPurchaseFlowModule } from './flows/purchase/index';
import { BanBanInventoryFlowModule } from './flows/inventory/index';
import { BanBanTransferFlowModule } from './flows/transfer/index';
import { BanBanReturnsFlowModule } from './flows/returns/index';
import { BanBanETLFlowModule } from './flows/etl/index';
import { BanBanPerformanceModule } from './performance/index';
import { BanbanECAEngine } from './shared/eca-engine';
import { BanbanAnalytics } from './shared/analytics';
import { BanbanValidationService } from './shared/validation';
export interface IntegrationHubInfo {
    client: string;
    version: string;
    description: string;
    flows: string[];
    features: string[];
    health: {
        status: string;
        timestamp: string;
        flows_status: Record<string, string>;
    };
}
export declare class BanbanIntegrationHub {
    private salesFlow;
    private purchaseFlow;
    private inventoryFlow;
    private transferFlow;
    private returnsFlow;
    private etlFlow;
    private performanceModule;
    private ecaEngine;
    private analytics;
    private validation;
    constructor();
    register(fastify: FastifyInstance, prefix?: string): Promise<void>;
    getIntegrationInfo(): Promise<IntegrationHubInfo>;
    getHealthCheck(): Promise<any>;
    getIntegrationMetrics(organizationId: string, filters?: any): Promise<any>;
    private getSegmentsBreakdown;
    getSalesFlow(): BanBanSalesFlowModule;
    getPurchaseFlow(): BanBanPurchaseFlowModule;
    getInventoryFlow(): BanBanInventoryFlowModule;
    getTransferFlow(): BanBanTransferFlowModule;
    getReturnsFlow(): BanBanReturnsFlowModule;
    getETLFlow(): BanBanETLFlowModule;
    getPerformanceModule(): BanBanPerformanceModule;
    getECAEngine(): BanbanECAEngine;
    getAnalytics(): BanbanAnalytics;
    getValidation(): BanbanValidationService;
}
export default BanbanIntegrationHub;
//# sourceMappingURL=index.d.ts.map