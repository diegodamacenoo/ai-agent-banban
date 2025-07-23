"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanbanECAEngine = void 0;
const tenant_manager_1 = require("../../../shared/tenant-manager/tenant-manager");
class BanbanECAEngine {
    constructor() {
        this.rules = new Map();
        this.tenantManager = new tenant_manager_1.TenantManager();
        this.loadBanbanRules();
    }
    loadBanbanRules() {
        const defaultRules = [
            {
                id: 'sale-completed-rule',
                name: 'Processar Venda Finalizada',
                event: 'sale_completed',
                conditions: [
                    { field: 'total_amount', operator: 'greater', value: 0 },
                    { field: 'status', operator: 'equals', value: 'completed' }
                ],
                actions: [
                    { type: 'update_inventory', handler: 'decreaseStock', parameters: {} },
                    { type: 'update_customer_metrics', handler: 'updateRFM', parameters: {} },
                    { type: 'generate_receipt', handler: 'createReceipt', parameters: {} }
                ],
                enabled: true
            },
            {
                id: 'return-processed-rule',
                name: 'Processar Devolução',
                event: 'return_processed',
                conditions: [
                    { field: 'status', operator: 'equals', value: 'approved' }
                ],
                actions: [
                    { type: 'update_inventory', handler: 'increaseStock', parameters: {} },
                    { type: 'update_customer_metrics', handler: 'adjustRFM', parameters: {} },
                    { type: 'process_refund', handler: 'calculateRefund', parameters: {} }
                ],
                enabled: true
            },
            {
                id: 'inventory-adjustment-rule',
                name: 'Ajuste de Inventário',
                event: 'inventory_adjustment',
                conditions: [
                    { field: 'reason', operator: 'exists', value: true }
                ],
                actions: [
                    { type: 'update_stock_levels', handler: 'adjustStock', parameters: {} },
                    { type: 'log_adjustment', handler: 'createAuditLog', parameters: {} }
                ],
                enabled: true
            }
        ];
        defaultRules.forEach(rule => {
            this.rules.set(rule.event, rule);
        });
    }
    async processEvent(event) {
        try {
            if (!event.organizationId) {
                throw new Error('Organization ID é obrigatório para eventos ECA');
            }
            const rule = this.rules.get(event.type);
            if (!rule || !rule.enabled) {
                throw new Error(`Nenhuma regra ECA encontrada para evento: ${event.type}`);
            }
            const conditionsMatch = this.evaluateConditions(rule.conditions, event.data);
            if (!conditionsMatch) {
                return {
                    success: false,
                    message: 'Condições da regra ECA não atendidas',
                    eventType: event.type
                };
            }
            const actionResults = [];
            for (const action of rule.actions) {
                const result = await this.executeAction(action, event);
                actionResults.push(result);
            }
            return {
                success: true,
                rule: rule.name,
                eventType: event.type,
                actionsExecuted: actionResults.length,
                results: actionResults,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Erro no processamento ECA:', error);
            return {
                success: false,
                error: error.message,
                eventType: event.type,
                timestamp: new Date().toISOString()
            };
        }
    }
    evaluateConditions(conditions, data) {
        return conditions.every(condition => {
            const fieldValue = this.getNestedValue(data, condition.field);
            switch (condition.operator) {
                case 'equals':
                    return fieldValue === condition.value;
                case 'contains':
                    return String(fieldValue).includes(String(condition.value));
                case 'greater':
                    return Number(fieldValue) > Number(condition.value);
                case 'less':
                    return Number(fieldValue) < Number(condition.value);
                case 'exists':
                    return fieldValue !== undefined && fieldValue !== null;
                default:
                    return false;
            }
        });
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    async executeAction(action, event) {
        try {
            switch (action.type) {
                case 'update_inventory':
                    return await this.updateInventoryAction(action, event);
                case 'update_customer_metrics':
                    return await this.updateCustomerMetricsAction(action, event);
                case 'generate_receipt':
                    return await this.generateReceiptAction(action, event);
                case 'process_refund':
                    return await this.processRefundAction(action, event);
                case 'log_adjustment':
                    return await this.logAdjustmentAction(action, event);
                default:
                    throw new Error(`Ação ECA não reconhecida: ${action.type}`);
            }
        }
        catch (error) {
            return {
                action: action.type,
                success: false,
                error: error.message
            };
        }
    }
    async updateInventoryAction(action, event) {
        return {
            action: 'update_inventory',
            success: true,
            handler: action.handler,
            message: 'Inventário atualizado via ECA'
        };
    }
    async updateCustomerMetricsAction(action, event) {
        return {
            action: 'update_customer_metrics',
            success: true,
            handler: action.handler,
            message: 'Métricas de cliente atualizadas via ECA'
        };
    }
    async generateReceiptAction(action, event) {
        return {
            action: 'generate_receipt',
            success: true,
            handler: action.handler,
            message: 'Recibo gerado via ECA'
        };
    }
    async processRefundAction(action, event) {
        return {
            action: 'process_refund',
            success: true,
            handler: action.handler,
            message: 'Reembolso processado via ECA'
        };
    }
    async logAdjustmentAction(action, event) {
        return {
            action: 'log_adjustment',
            success: true,
            handler: action.handler,
            message: 'Ajuste registrado no audit log via ECA'
        };
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    getRuleByEvent(eventType) {
        return this.rules.get(eventType);
    }
    addRule(rule) {
        this.rules.set(rule.event, rule);
    }
    removeRule(eventType) {
        return this.rules.delete(eventType);
    }
    enableRule(eventType) {
        const rule = this.rules.get(eventType);
        if (rule) {
            rule.enabled = true;
            return true;
        }
        return false;
    }
    disableRule(eventType) {
        const rule = this.rules.get(eventType);
        if (rule) {
            rule.enabled = false;
            return true;
        }
        return false;
    }
}
exports.BanbanECAEngine = BanbanECAEngine;
//# sourceMappingURL=eca-engine.js.map