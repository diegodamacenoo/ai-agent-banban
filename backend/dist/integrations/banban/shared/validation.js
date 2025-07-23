"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanbanValidationService = void 0;
class BanbanValidationService {
    validateSaleData(data) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!data.location_id) {
            result.errors.push('location_id é obrigatório');
        }
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            result.errors.push('items deve ser um array não vazio');
        }
        else {
            data.items.forEach((item, index) => {
                if (!item.product_id) {
                    result.errors.push(`Item ${index}: product_id é obrigatório`);
                }
                if (!item.quantity || item.quantity <= 0) {
                    result.errors.push(`Item ${index}: quantity deve ser maior que 0`);
                }
                if (!item.unit_price || item.unit_price < 0) {
                    result.errors.push(`Item ${index}: unit_price deve ser maior ou igual a 0`);
                }
                if (!item.total_price || item.total_price < 0) {
                    result.errors.push(`Item ${index}: total_price deve ser maior ou igual a 0`);
                }
                const expectedTotal = (item.quantity || 0) * (item.unit_price || 0);
                const discount = item.discount || 0;
                const actualTotal = expectedTotal - discount;
                if (Math.abs(actualTotal - (item.total_price || 0)) > 0.01) {
                    result.warnings.push(`Item ${index}: total_price pode estar incorreto (esperado: ${actualTotal.toFixed(2)})`);
                }
            });
        }
        if (!data.total_amount || data.total_amount < 0) {
            result.errors.push('total_amount deve ser maior ou igual a 0');
        }
        if (!data.payment_method) {
            result.errors.push('payment_method é obrigatório');
        }
        else if (!this.isValidPaymentMethod(data.payment_method)) {
            result.errors.push(`payment_method inválido: ${data.payment_method}`);
        }
        if (!data.payment_status) {
            result.errors.push('payment_status é obrigatório');
        }
        else if (!this.isValidPaymentStatus(data.payment_status)) {
            result.errors.push(`payment_status inválido: ${data.payment_status}`);
        }
        if (!data.sale_date) {
            result.errors.push('sale_date é obrigatório');
        }
        else if (!this.isValidDate(data.sale_date)) {
            result.errors.push('sale_date deve estar em formato ISO válido');
        }
        if (!data.status) {
            result.errors.push('status é obrigatório');
        }
        else if (!this.isValidSaleStatus(data.status)) {
            result.errors.push(`status inválido: ${data.status}`);
        }
        if (data.items && data.total_amount) {
            const calculatedTotal = data.items.reduce((sum, item) => {
                return sum + (item.total_price || 0);
            }, 0);
            if (Math.abs(calculatedTotal - data.total_amount) > 0.01) {
                result.warnings.push(`total_amount pode estar incorreto (calculado: ${calculatedTotal.toFixed(2)})`);
            }
        }
        if (data.sale_date && new Date(data.sale_date) > new Date()) {
            result.warnings.push('sale_date está no futuro');
        }
        result.isValid = result.errors.length === 0;
        return result;
    }
    validateInventoryData(data) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!data.location_id) {
            result.errors.push('location_id é obrigatório');
        }
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            result.errors.push('items deve ser um array não vazio');
        }
        else {
            data.items.forEach((item, index) => {
                if (!item.product_id) {
                    result.errors.push(`Item ${index}: product_id é obrigatório`);
                }
                if (item.quantity === undefined || item.quantity === null) {
                    result.errors.push(`Item ${index}: quantity é obrigatório`);
                }
            });
        }
        if (!data.event_date) {
            result.errors.push('event_date é obrigatório');
        }
        else if (!this.isValidDate(data.event_date)) {
            result.errors.push('event_date deve estar em formato ISO válido');
        }
        if (!data.event_type) {
            result.errors.push('event_type é obrigatório');
        }
        else if (!this.isValidInventoryEventType(data.event_type)) {
            result.errors.push(`event_type inválido: ${data.event_type}`);
        }
        if (!data.status) {
            result.errors.push('status é obrigatório');
        }
        result.isValid = result.errors.length === 0;
        return result;
    }
    validateTransferData(data) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!data.from_location_id) {
            result.errors.push('from_location_id é obrigatório');
        }
        if (!data.to_location_id) {
            result.errors.push('to_location_id é obrigatório');
        }
        if (data.from_location_id === data.to_location_id) {
            result.errors.push('from_location_id deve ser diferente de to_location_id');
        }
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            result.errors.push('items deve ser um array não vazio');
        }
        else {
            data.items.forEach((item, index) => {
                if (!item.product_id) {
                    result.errors.push(`Item ${index}: product_id é obrigatório`);
                }
                if (!item.quantity || item.quantity <= 0) {
                    result.errors.push(`Item ${index}: quantity deve ser maior que 0`);
                }
            });
        }
        if (!data.transfer_date) {
            result.errors.push('transfer_date é obrigatório');
        }
        else if (!this.isValidDate(data.transfer_date)) {
            result.errors.push('transfer_date deve estar em formato ISO válido');
        }
        if (!data.status) {
            result.errors.push('status é obrigatório');
        }
        else if (!this.isValidTransferStatus(data.status)) {
            result.errors.push(`status inválido: ${data.status}`);
        }
        result.isValid = result.errors.length === 0;
        return result;
    }
    validateWebhookPayload(payload) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!payload.event_type) {
            result.errors.push('event_type é obrigatório');
        }
        if (!payload.organization_id) {
            result.errors.push('organization_id é obrigatório');
        }
        if (!payload.data) {
            result.errors.push('data é obrigatório');
        }
        if (payload.event_type && payload.data) {
            switch (payload.event_type) {
                case 'sale_completed':
                case 'sale_cancelled':
                    const saleValidation = this.validateSaleData(payload.data);
                    result.errors.push(...saleValidation.errors);
                    result.warnings.push(...saleValidation.warnings);
                    break;
                case 'inventory_adjustment':
                case 'inventory_count':
                    const inventoryValidation = this.validateInventoryData(payload.data);
                    result.errors.push(...inventoryValidation.errors);
                    result.warnings.push(...inventoryValidation.warnings);
                    break;
                case 'transfer_completed':
                case 'transfer_cancelled':
                    const transferValidation = this.validateTransferData(payload.data);
                    result.errors.push(...transferValidation.errors);
                    result.warnings.push(...transferValidation.warnings);
                    break;
                default:
                    result.warnings.push(`Tipo de evento não reconhecido: ${payload.event_type}`);
            }
        }
        result.isValid = result.errors.length === 0;
        return result;
    }
    isValidPaymentMethod(method) {
        const validMethods = [
            'cash', 'credit_card', 'debit_card', 'pix',
            'bank_transfer', 'check', 'store_credit'
        ];
        return validMethods.includes(method.toLowerCase());
    }
    isValidPaymentStatus(status) {
        const validStatuses = [
            'pending', 'processing', 'completed', 'failed',
            'cancelled', 'refunded', 'partial_refund'
        ];
        return validStatuses.includes(status.toLowerCase());
    }
    isValidSaleStatus(status) {
        const validStatuses = [
            'draft', 'pending', 'confirmed', 'processing',
            'completed', 'cancelled', 'refunded'
        ];
        return validStatuses.includes(status.toLowerCase());
    }
    isValidInventoryEventType(type) {
        const validTypes = [
            'inventory_adjustment', 'inventory_count',
            'inventory_damage', 'inventory_expiry'
        ];
        return validTypes.includes(type.toLowerCase());
    }
    isValidTransferStatus(status) {
        const validStatuses = [
            'pending', 'in_transit', 'completed',
            'cancelled', 'rejected'
        ];
        return validStatuses.includes(status.toLowerCase());
    }
    isValidDate(dateString) {
        try {
            const date = new Date(dateString);
            return date instanceof Date && !isNaN(date.getTime());
        }
        catch {
            return false;
        }
    }
    validateBusinessRules(eventType, data, organizationId) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        switch (eventType) {
            case 'sale_completed':
                if (data.total_amount < 10) {
                    result.warnings.push('Venda abaixo do valor mínimo recomendado (R$ 10,00)');
                }
                if (data.items && data.items.length > 50) {
                    result.warnings.push('Venda com muitos itens, verificar se está correto');
                }
                break;
            case 'inventory_adjustment':
                if (data.items) {
                    data.items.forEach((item, index) => {
                        if (Math.abs(item.quantity) > 1000) {
                            result.warnings.push(`Item ${index}: Ajuste de quantidade muito alto (${item.quantity})`);
                        }
                    });
                }
                break;
            case 'transfer_completed':
                const validLocations = ['loja-1', 'loja-2', 'cd-principal', 'cd-secundario'];
                if (data.from_location_id && !validLocations.includes(data.from_location_id)) {
                    result.warnings.push(`Local de origem não reconhecido: ${data.from_location_id}`);
                }
                if (data.to_location_id && !validLocations.includes(data.to_location_id)) {
                    result.warnings.push(`Local de destino não reconhecido: ${data.to_location_id}`);
                }
                break;
        }
        return result;
    }
    sanitizeData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        const sanitized = { ...data };
        delete sanitized.__proto__;
        delete sanitized.constructor;
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'string') {
                sanitized[key] = sanitized[key].trim();
            }
            else if (Array.isArray(sanitized[key])) {
                sanitized[key] = sanitized[key].map((item) => this.sanitizeData(item));
            }
            else if (sanitized[key] && typeof sanitized[key] === 'object') {
                sanitized[key] = this.sanitizeData(sanitized[key]);
            }
        });
        return sanitized;
    }
}
exports.BanbanValidationService = BanbanValidationService;
//# sourceMappingURL=validation.js.map