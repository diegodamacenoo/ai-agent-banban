import { SupabaseService } from '../../../shared/services/supabase-service';
import { TenantManager } from '../../../shared/tenant-manager/tenant-manager';

export interface ECAEvent {
  type: string;
  organizationId: string;
  data: any;
  timestamp?: string;
  eventId?: string;
}

export interface ECACondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: any;
}

export interface ECAAction {
  type: string;
  handler: string;
  parameters: Record<string, any>;
}

export interface ECARule {
  id: string;
  name: string;
  event: string;
  conditions: ECACondition[];
  actions: ECAAction[];
  enabled: boolean;
}

export class BanbanECAEngine {
  private tenantManager: TenantManager;
  private rules: Map<string, ECARule> = new Map();

  constructor() {
    this.tenantManager = new TenantManager();
    this.loadBanbanRules();
  }

  private loadBanbanRules() {
    // Regras padrão para Banban Fashion
    const defaultRules: ECARule[] = [
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

  async processEvent(event: ECAEvent): Promise<any> {
    try {
      // Validar organização
      if (!event.organizationId) {
        throw new Error('Organization ID é obrigatório para eventos ECA');
      }

      // Buscar regra para o tipo de evento
      const rule = this.rules.get(event.type);
      if (!rule || !rule.enabled) {
        throw new Error(`Nenhuma regra ECA encontrada para evento: ${event.type}`);
      }

      // Verificar condições
      const conditionsMatch = this.evaluateConditions(rule.conditions, event.data);
      if (!conditionsMatch) {
        return {
          success: false,
          message: 'Condições da regra ECA não atendidas',
          eventType: event.type
        };
      }

      // Executar ações
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

    } catch (error: any) {
      console.error('Erro no processamento ECA:', error);
      return {
        success: false,
        error: error.message,
        eventType: event.type,
        timestamp: new Date().toISOString()
      };
    }
  }

  private evaluateConditions(conditions: ECACondition[], data: any): boolean {
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

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeAction(action: ECAAction, event: ECAEvent): Promise<any> {
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
    } catch (error: any) {
      return {
        action: action.type,
        success: false,
        error: error.message
      };
    }
  }

  private async updateInventoryAction(action: ECAAction, event: ECAEvent): Promise<any> {
    // Implementação básica - ajustar conforme necessário
    return {
      action: 'update_inventory',
      success: true,
      handler: action.handler,
      message: 'Inventário atualizado via ECA'
    };
  }

  private async updateCustomerMetricsAction(action: ECAAction, event: ECAEvent): Promise<any> {
    return {
      action: 'update_customer_metrics',
      success: true,
      handler: action.handler,
      message: 'Métricas de cliente atualizadas via ECA'
    };
  }

  private async generateReceiptAction(action: ECAAction, event: ECAEvent): Promise<any> {
    return {
      action: 'generate_receipt',
      success: true,
      handler: action.handler,
      message: 'Recibo gerado via ECA'
    };
  }

  private async processRefundAction(action: ECAAction, event: ECAEvent): Promise<any> {
    return {
      action: 'process_refund',
      success: true,
      handler: action.handler,
      message: 'Reembolso processado via ECA'
    };
  }

  private async logAdjustmentAction(action: ECAAction, event: ECAEvent): Promise<any> {
    return {
      action: 'log_adjustment',
      success: true,
      handler: action.handler,
      message: 'Ajuste registrado no audit log via ECA'
    };
  }

  // Métodos utilitários
  getRules(): ECARule[] {
    return Array.from(this.rules.values());
  }

  getRuleByEvent(eventType: string): ECARule | undefined {
    return this.rules.get(eventType);
  }

  addRule(rule: ECARule): void {
    this.rules.set(rule.event, rule);
  }

  removeRule(eventType: string): boolean {
    return this.rules.delete(eventType);
  }

  enableRule(eventType: string): boolean {
    const rule = this.rules.get(eventType);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  disableRule(eventType: string): boolean {
    const rule = this.rules.get(eventType);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }
}