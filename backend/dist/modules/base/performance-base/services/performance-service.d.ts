import { BusinessMetricsParams, CustomMetricsParams, PerformanceMetrics } from '../../../../shared/types/module-types';
import { PerformanceBaseConfig } from '../index';
export declare class PerformanceService {
    private config;
    private cache;
    constructor(config: PerformanceBaseConfig);
    getBusinessMetrics(params: BusinessMetricsParams): Promise<PerformanceMetrics>;
    getSummary(tenantId?: string): Promise<any>;
    calculateCustomMetrics(params: CustomMetricsParams): Promise<any>;
    private calculateBusinessMetrics;
    private calculateSummary;
    private calculateRevenueGrowth;
    private calculateCustomerAcquisition;
    private calculateOrderFrequency;
    private calculateProductPerformance;
    private generateAlerts;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        keys: string[];
    };
}
//# sourceMappingURL=performance-service.d.ts.map