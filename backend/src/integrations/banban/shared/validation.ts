export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BanbanSaleData {
  sale_id?: string;
  customer_id?: string;
  location_id: string;
  items: BanbanSaleItem[];
  total_amount: number;
  payment_method: string;
  payment_status: string;
  sale_date: string;
  status: string;
}

export interface BanbanSaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount?: number;
}

export interface BanbanInventoryData {
  location_id: string;
  items: BanbanInventoryItem[];
  event_date: string;
  event_type: string;
  status: string;
  notes?: string;
}

export interface BanbanInventoryItem {
  product_id: string;
  quantity: number;
  unit_cost?: number;
  reason?: string;
  notes?: string;
}

export interface BanbanTransferData {
  from_location_id: string;
  to_location_id: string;
  items: BanbanTransferItem[];
  transfer_date: string;
  status: string;
  notes?: string;
}

export interface BanbanTransferItem {
  product_id: string;
  quantity: number;
  unit_cost?: number;
  condition?: string;
}

export class BanbanValidationService {
  
  // Validação de dados de venda
  validateSaleData(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validações obrigatórias
    if (!data.location_id) {
      result.errors.push('location_id é obrigatório');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      result.errors.push('items deve ser um array não vazio');
    } else {
      data.items.forEach((item: any, index: number) => {
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

        // Validação de consistência
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
    } else if (!this.isValidPaymentMethod(data.payment_method)) {
      result.errors.push(`payment_method inválido: ${data.payment_method}`);
    }

    if (!data.payment_status) {
      result.errors.push('payment_status é obrigatório');
    } else if (!this.isValidPaymentStatus(data.payment_status)) {
      result.errors.push(`payment_status inválido: ${data.payment_status}`);
    }

    if (!data.sale_date) {
      result.errors.push('sale_date é obrigatório');
    } else if (!this.isValidDate(data.sale_date)) {
      result.errors.push('sale_date deve estar em formato ISO válido');
    }

    if (!data.status) {
      result.errors.push('status é obrigatório');
    } else if (!this.isValidSaleStatus(data.status)) {
      result.errors.push(`status inválido: ${data.status}`);
    }

    // Validação de consistência de valores
    if (data.items && data.total_amount) {
      const calculatedTotal = data.items.reduce((sum: number, item: any) => {
        return sum + (item.total_price || 0);
      }, 0);

      if (Math.abs(calculatedTotal - data.total_amount) > 0.01) {
        result.warnings.push(`total_amount pode estar incorreto (calculado: ${calculatedTotal.toFixed(2)})`);
      }
    }

    // Validações de negócio
    if (data.sale_date && new Date(data.sale_date) > new Date()) {
      result.warnings.push('sale_date está no futuro');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Validação de dados de inventário
  validateInventoryData(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!data.location_id) {
      result.errors.push('location_id é obrigatório');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      result.errors.push('items deve ser um array não vazio');
    } else {
      data.items.forEach((item: any, index: number) => {
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
    } else if (!this.isValidDate(data.event_date)) {
      result.errors.push('event_date deve estar em formato ISO válido');
    }

    if (!data.event_type) {
      result.errors.push('event_type é obrigatório');
    } else if (!this.isValidInventoryEventType(data.event_type)) {
      result.errors.push(`event_type inválido: ${data.event_type}`);
    }

    if (!data.status) {
      result.errors.push('status é obrigatório');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Validação de dados de transferência
  validateTransferData(data: any): ValidationResult {
    const result: ValidationResult = {
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
    } else {
      data.items.forEach((item: any, index: number) => {
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
    } else if (!this.isValidDate(data.transfer_date)) {
      result.errors.push('transfer_date deve estar em formato ISO válido');
    }

    if (!data.status) {
      result.errors.push('status é obrigatório');
    } else if (!this.isValidTransferStatus(data.status)) {
      result.errors.push(`status inválido: ${data.status}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Validação de webhook payload
  validateWebhookPayload(payload: any): ValidationResult {
    const result: ValidationResult = {
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

    // Validação específica por tipo de evento
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

  // Métodos auxiliares de validação
  private isValidPaymentMethod(method: string): boolean {
    const validMethods = [
      'cash', 'credit_card', 'debit_card', 'pix', 
      'bank_transfer', 'check', 'store_credit'
    ];
    return validMethods.includes(method.toLowerCase());
  }

  private isValidPaymentStatus(status: string): boolean {
    const validStatuses = [
      'pending', 'processing', 'completed', 'failed', 
      'cancelled', 'refunded', 'partial_refund'
    ];
    return validStatuses.includes(status.toLowerCase());
  }

  private isValidSaleStatus(status: string): boolean {
    const validStatuses = [
      'draft', 'pending', 'confirmed', 'processing', 
      'completed', 'cancelled', 'refunded'
    ];
    return validStatuses.includes(status.toLowerCase());
  }

  private isValidInventoryEventType(type: string): boolean {
    const validTypes = [
      'inventory_adjustment', 'inventory_count', 
      'inventory_damage', 'inventory_expiry'
    ];
    return validTypes.includes(type.toLowerCase());
  }

  private isValidTransferStatus(status: string): boolean {
    const validStatuses = [
      'pending', 'in_transit', 'completed', 
      'cancelled', 'rejected'
    ];
    return validStatuses.includes(status.toLowerCase());
  }

  private isValidDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  // Validações de negócio específicas
  validateBusinessRules(eventType: string, data: any, organizationId: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validações específicas para Banban Fashion
    switch (eventType) {
      case 'sale_completed':
        // Validar se o valor mínimo de venda foi atingido (R$ 10,00)
        if (data.total_amount < 10) {
          result.warnings.push('Venda abaixo do valor mínimo recomendado (R$ 10,00)');
        }

        // Validar se há muitos itens (mais de 50 pode indicar erro)
        if (data.items && data.items.length > 50) {
          result.warnings.push('Venda com muitos itens, verificar se está correto');
        }
        break;

      case 'inventory_adjustment':
        // Validar ajustes grandes de inventário
        if (data.items) {
          data.items.forEach((item: any, index: number) => {
            if (Math.abs(item.quantity) > 1000) {
              result.warnings.push(`Item ${index}: Ajuste de quantidade muito alto (${item.quantity})`);
            }
          });
        }
        break;

      case 'transfer_completed':
        // Validar transferências entre locais válidos
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

  // Sanitização de dados
  sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Remover campos perigosos ou desnecessários
    delete sanitized.__proto__;
    delete sanitized.constructor;

    // Normalizar strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      } else if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) => this.sanitizeData(item));
      } else if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }
}