"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleResolver = void 0;
const logger_1 = require("../../utils/logger");
const banban_purchase_flow_1 = require("../../modules/custom/banban-purchase-flow");
const banban_inventory_flow_1 = require("../../modules/custom/banban-inventory-flow");
const banban_sales_flow_1 = require("../../modules/custom/banban-sales-flow");
const banban_transfer_flow_1 = require("../../modules/custom/banban-transfer-flow");
const banban_performance_1 = require("../../modules/custom/banban-performance");
class ModuleResolver {
    constructor() {
        this.moduleCache = new Map();
        logger_1.logger.info('ModuleResolver initialized');
    }
    async resolveModulesForTenant(tenantId) {
        try {
            if (this.moduleCache.has(tenantId)) {
                logger_1.logger.debug(`Using cached modules for tenant: ${tenantId}`);
                return this.moduleCache.get(tenantId);
            }
            logger_1.logger.debug(`Resolving modules for tenant: ${tenantId}`);
            const modules = {};
            if (tenantId === 'banban-org-id') {
                modules.performance = new banban_performance_1.BanBanPerformanceModule();
                modules.purchaseFlow = new banban_purchase_flow_1.BanBanPurchaseFlowModule();
                modules.inventoryFlow = new banban_inventory_flow_1.BanBanInventoryFlowModule();
                modules.salesFlow = new banban_sales_flow_1.BanBanSalesFlowModule();
                modules.transferFlow = new banban_transfer_flow_1.BanBanTransferFlowModule();
            }
            else {
                logger_1.logger.warn(`No modules configured for tenant: ${tenantId}`);
                throw new Error(`No modules available for tenant: ${tenantId}. Contact support to configure modules.`);
            }
            this.moduleCache.set(tenantId, modules);
            logger_1.logger.info(`Resolved ${Object.keys(modules).length} modules for tenant: ${tenantId}`);
            return modules;
        }
        catch (error) {
            logger_1.logger.error(`Failed to resolve modules for tenant ${tenantId}:`, error);
            console.error('Detailed error:', error);
            return {};
        }
    }
    clearCache(tenantId) {
        if (tenantId) {
            this.moduleCache.delete(tenantId);
            logger_1.logger.debug(`Cache cleared for tenant: ${tenantId}`);
        }
        else {
            this.moduleCache.clear();
            logger_1.logger.debug('All module cache cleared');
        }
    }
}
exports.ModuleResolver = ModuleResolver;
class BaseModule {
    constructor() {
        this.name = '';
        this.version = '';
        this.description = '';
    }
    getModuleInfo() {
        return {
            name: this.moduleName,
            type: 'standard',
            version: this.moduleVersion,
            description: this.moduleDescription,
            endpoints: this.moduleEndpoints,
            features: [],
            status: 'active'
        };
    }
    getEndpoints() {
        return this.moduleEndpoints;
    }
}
class StandardPerformanceModule extends BaseModule {
    constructor() {
        super(...arguments);
        this.moduleName = 'performance-standard';
        this.moduleVersion = '1.0.0';
        this.moduleDescription = 'Standard performance monitoring module';
        this.moduleEndpoints = ['/metrics', '/health', '/status'];
    }
    async handleRequest(request, reply) {
        return {
            module: 'performance-standard',
            status: 'operational',
            timestamp: new Date().toISOString(),
            metrics: {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                uptime: process.uptime()
            }
        };
    }
    async register(server, prefix = '/api/performance') {
        server.get(`${prefix}/metrics`, async (request, reply) => {
            return {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                uptime: process.uptime()
            };
        });
        server.get(`${prefix}/status`, async (request, reply) => {
            return {
                status: 'healthy',
                module: 'performance-standard'
            };
        });
    }
}
class StandardInsightsModule extends BaseModule {
    constructor() {
        super(...arguments);
        this.moduleName = 'insights-standard';
        this.moduleVersion = '1.0.0';
        this.moduleDescription = 'Standard insights and analytics module';
        this.moduleEndpoints = ['/reports', '/analytics', '/dashboard'];
    }
    async handleRequest(request, reply) {
        return {
            module: 'insights-standard',
            data: {
                totalSales: Math.floor(Math.random() * 10000),
                revenue: Math.floor(Math.random() * 100000),
                orders: Math.floor(Math.random() * 500)
            }
        };
    }
    async register(server, prefix = '/api/insights') {
        server.get(`${prefix}/dashboard`, async (request, reply) => {
            return {
                totalSales: Math.floor(Math.random() * 10000),
                revenue: Math.floor(Math.random() * 100000),
                orders: Math.floor(Math.random() * 500)
            };
        });
    }
}
//# sourceMappingURL=module-resolver.js.map