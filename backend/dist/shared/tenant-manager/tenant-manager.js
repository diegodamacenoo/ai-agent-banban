"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantManager = void 0;
const logger_1 = require("../../utils/logger");
class TenantManager {
    constructor() {
        this.tenantCache = new Map();
        this.initializeDefaultTenants();
        logger_1.logger.info('TenantManager initialized');
    }
    async resolveTenant(request) {
        try {
            let tenantId = null;
            if (request.headers['x-tenant-id']) {
                tenantId = request.headers['x-tenant-id'];
                logger_1.logger.debug(`Tenant resolved by header: ${tenantId}`);
            }
            if (!tenantId && request.hostname) {
                const hostname = request.hostname;
                if (hostname.includes('banban')) {
                    tenantId = 'banban-org-id';
                    logger_1.logger.debug(`Tenant resolved by subdomain: ${tenantId}`);
                }
            }
            if (!tenantId && request.query?.tenant) {
                tenantId = request.query.tenant;
                logger_1.logger.debug(`Tenant resolved by query: ${tenantId}`);
            }
            if (!tenantId) {
                logger_1.logger.warn('Tenant ID not provided in request - rejecting for security');
                throw new Error('Tenant identification required. Provide X-Tenant-ID header, subdomain, or tenant query parameter.');
            }
            const tenant = this.getTenant(tenantId);
            if (!tenant) {
                logger_1.logger.warn(`Invalid tenant ID provided: ${tenantId}`);
                throw new Error(`Invalid tenant: ${tenantId}`);
            }
            logger_1.logger.debug(`Tenant found: ${tenant.name} (${tenant.clientType})`);
            return tenant;
        }
        catch (error) {
            logger_1.logger.error('Error resolving tenant:', error);
            return null;
        }
    }
    getTenant(tenantId) {
        return this.tenantCache.get(tenantId) || null;
    }
    registerTenant(tenant) {
        this.tenantCache.set(tenant.id, tenant);
        logger_1.logger.info(`Tenant registered: ${tenant.name} (${tenant.id})`);
    }
    getAllTenants() {
        return Array.from(this.tenantCache.values());
    }
    hasFeature(tenantId, feature) {
        const tenant = this.getTenant(tenantId);
        return tenant?.features.includes(feature) || false;
    }
    initializeDefaultTenants() {
        this.registerTenant({
            id: 'banban-org-id',
            name: 'BanBan Footwear',
            clientType: 'banban',
            subdomain: 'banban',
            features: ['performance', 'insights', 'alerts', 'inventory', 'footwear-analytics'],
            config: {
                theme: 'banban',
                modules: ['performance', 'insights', 'alerts'],
                industry: 'footwear',
                customEndpoints: true
            }
        });
        logger_1.logger.info(`${this.tenantCache.size} tenants initialized`);
    }
}
exports.TenantManager = TenantManager;
//# sourceMappingURL=tenant-manager.js.map