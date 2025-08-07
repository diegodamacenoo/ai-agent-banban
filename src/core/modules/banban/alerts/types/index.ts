/**
 * Tipos TypeScript para o módulo BanBan Alerts
 */

// Re-export dos tipos principais dos serviços
export type {
  ProcessedAlert,
  AlertType,
  AlertSeverity,
  AlertStatus
} from '../services/alert-processor';

export type {
  EscalationEvent
} from '../services/alert-escalation';

export type {
  AlertMetrics,
  PerformanceMetric
} from '../services/alert-metrics';

// Re-export dos tipos de configuração
export type {
  AlertTypeConfig,
  EscalationRule,
  PerformanceMetrics,
  ModuleConfig,
  ProcessorConfig
} from '../config';

// Re-export dos tipos do módulo principal
export type {
  AlertsModuleConfig,
  Alert,
  AlertPriority
} from '../index';

// Tipos para integrações
export interface AlertNotification {
  id: string;
  alertId: string;
  channel: 'email' | 'sms' | 'push' | 'webhook' | 'slack';
  recipient: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  tenantId: string;
  name: string;
  alertType: string;
  priority: string;
  enabled: boolean;
  conditions: Record<string, any>;
  thresholds: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AlertThreshold {
  id: string;
  tenantId: string;
  category: string;
  subcategory?: string;
  thresholdValue: number;
  comparisonOperator: string;
  unit?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para webhooks e integrações
export interface AlertWebhookPayload {
  event: 'alert.created' | 'alert.acknowledged' | 'alert.resolved' | 'alert.escalated';
  alert: ProcessedAlert;
  timestamp: string;
  source: 'banban-alerts';
  version: string;
}

// Tipos para analytics avançados
export interface AlertTrend {
  period: string;
  count: number;
  severity_breakdown: Record<string, number>;
  type_breakdown: Record<string, number>;
  avg_resolution_time: number;
  escalation_rate: number;
}

export interface AlertInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
  generated_at: string;
}

// Interfaces para APIs externas
export interface ExternalAlert {
  external_id: string;
  source_system: string;
  mapped_alert: ProcessedAlert;
  sync_status: 'pending' | 'synced' | 'failed';
  last_sync: string;
}

export default {};