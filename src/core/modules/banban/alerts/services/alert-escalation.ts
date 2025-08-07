/**
 * Serviço de Escalação de Alertas
 * Gerencia escalações automáticas baseadas nas regras de configuração
 */

import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';
import { ProcessedAlert, AlertSeverity, AlertStatus } from './alert-processor';
import { BANBAN_ALERTS_MODULE_CONFIG, getEscalationRule } from '../config';

export interface EscalationEvent {
  alertId: string;
  escalationLevel: number;
  escalatedAt: string;
  escalatedBy: 'system' | 'user';
  reason: string;
  notificationChannels: string[];
}

export class AlertEscalationService {
  private static instance: AlertEscalationService;

  private constructor() {}

  static getInstance(): AlertEscalationService {
    if (!AlertEscalationService.instance) {
      AlertEscalationService.instance = new AlertEscalationService();
    }
    return AlertEscalationService.instance;
  }

  /**
   * Verifica se um alerta precisa ser escalado
   */
  shouldEscalate(alert: ProcessedAlert): boolean {
    if (!alert.autoEscalate || alert.status !== AlertStatus.ACTIVE) {
      return false;
    }

    if (!alert.nextEscalationAt) {
      return false;
    }

    const now = new Date();
    const escalationTime = new Date(alert.nextEscalationAt);
    
    return now >= escalationTime;
  }

  /**
   * Executa escalação de um alerta
   */
  async escalateAlert(alert: ProcessedAlert): Promise<EscalationEvent | null> {
    try {
      const priorityMap = {
        [AlertSeverity.CRITICAL]: 'critical',
        [AlertSeverity.WARNING]: 'attention',
        [AlertSeverity.INFO]: 'moderate',
        [AlertSeverity.OPPORTUNITY]: 'opportunity'
      };

      const priority = priorityMap[alert.severity];
      const escalationRule = getEscalationRule(priority);

      if (!escalationRule) {
        conditionalDebugLogSync('[EscalationService] No escalation rule found', { 
          alertId: alert.id, 
          priority 
        });
        return null;
      }

      const currentLevel = alert.escalationLevel || 0;
      const nextLevel = currentLevel + 1;

      if (nextLevel > escalationRule.max_escalations) {
        conditionalDebugLogSync('[EscalationService] Max escalations reached', { 
          alertId: alert.id, 
          currentLevel, 
          maxEscalations: escalationRule.max_escalations 
        });
        return null;
      }

      const escalationEvent: EscalationEvent = {
        alertId: alert.id,
        escalationLevel: nextLevel,
        escalatedAt: new Date().toISOString(),
        escalatedBy: 'system',
        reason: `Escalação automática nível ${nextLevel} - sem resposta em ${escalationRule.escalate_after_minutes} minutos`,
        notificationChannels: this.getNotificationChannels(alert.severity, nextLevel)
      };

      // TODO: Implementar notificações reais
      conditionalDebugLogSync('[EscalationService] Alert escalated', escalationEvent);

      return escalationEvent;

    } catch (error) {
      console.error('[EscalationService] Error escalating alert:', error);
      return null;
    }
  }

  /**
   * Determina canais de notificação baseado na severidade e nível
   */
  private getNotificationChannels(severity: AlertSeverity, escalationLevel: number): string[] {
    const channels: string[] = ['dashboard'];

    switch (severity) {
      case AlertSeverity.CRITICAL:
        channels.push('email', 'sms');
        if (escalationLevel >= 2) {
          channels.push('phone_call', 'slack');
        }
        break;
      
      case AlertSeverity.WARNING:
        channels.push('email');
        if (escalationLevel >= 2) {
          channels.push('sms');
        }
        break;
      
      case AlertSeverity.INFO:
        if (escalationLevel >= 1) {
          channels.push('email');
        }
        break;
      
      case AlertSeverity.OPPORTUNITY:
        // Oportunidades só no dashboard
        break;
    }

    return channels;
  }

  /**
   * Processa todas as escalações pendentes
   */
  async processEscalations(alerts: ProcessedAlert[]): Promise<EscalationEvent[]> {
    const escalations: EscalationEvent[] = [];
    
    for (const alert of alerts) {
      if (this.shouldEscalate(alert)) {
        const escalation = await this.escalateAlert(alert);
        if (escalation) {
          escalations.push(escalation);
        }
      }
    }

    conditionalDebugLogSync('[EscalationService] Processed escalations', {
      totalAlerts: alerts.length,
      escalationsProcessed: escalations.length
    });

    return escalations;
  }

  /**
   * Atualiza próxima escalação de um alerta
   */
  calculateNextEscalation(alert: ProcessedAlert, escalationLevel: number): string | undefined {
    const priorityMap = {
      [AlertSeverity.CRITICAL]: 'critical',
      [AlertSeverity.WARNING]: 'attention',
      [AlertSeverity.INFO]: 'moderate',
      [AlertSeverity.OPPORTUNITY]: 'opportunity'
    };

    const priority = priorityMap[alert.severity];
    const escalationRule = BANBAN_ALERTS_MODULE_CONFIG.business_rules.escalation_rules[priority as keyof typeof BANBAN_ALERTS_MODULE_CONFIG.business_rules.escalation_rules];

    if (!escalationRule || escalationLevel >= escalationRule.max_escalations) {
      return undefined;
    }

    const nextEscalationTime = new Date();
    nextEscalationTime.setMinutes(nextEscalationTime.getMinutes() + escalationRule.escalate_after_minutes);
    
    return nextEscalationTime.toISOString();
  }

  /**
   * Para escalação de um alerta (quando reconhecido/resolvido)
   */
  async stopEscalation(alertId: string, reason: string = 'Alerta reconhecido/resolvido'): Promise<void> {
    conditionalDebugLogSync('[EscalationService] Escalation stopped', {
      alertId,
      reason,
      stoppedAt: new Date().toISOString()
    });

    // TODO: Implementar parada real de escalação
  }
}

export const alertEscalationService = AlertEscalationService.getInstance();
export default AlertEscalationService;