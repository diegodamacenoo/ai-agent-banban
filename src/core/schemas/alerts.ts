import { z } from 'zod';

// Alert Types
export type AlertType = 'stagnant' | 'replenishment' | 'divergence' | 'margin' | 'returns' | 'redistribution';
export type AlertStatus = 'open' | 'resolved' | 'ignored';

// Alert Status Update
export type UpdateAlertStatusData = {
  alertId: string;
  alertType: AlertType;
  status: AlertStatus;
  notes?: string;
};

export const updateAlertStatusSchema = z.object({
  alertId: z.string(),
  alertType: z.enum(['stagnant', 'replenishment', 'divergence', 'margin', 'returns', 'redistribution']),
  status: z.enum(['open', 'resolved', 'ignored']),
  notes: z.string().optional()
});

// Alert History
export type AlertHistoryData = {
  variantId: string;
  alertType?: AlertType;
  limit?: number;
};

export const alertHistorySchema = z.object({
  variantId: z.string(),
  alertType: z.enum(['stagnant', 'replenishment', 'divergence', 'margin', 'returns', 'redistribution']).optional(),
  limit: z.number().min(1).max(100).default(10)
});

// Alert Details
export const getAlertDetailsSchema = z.object({
  alertId: z.string(),
  alertType: z.enum(['stagnant', 'replenishment', 'divergence', 'margin', 'returns', 'redistribution'])
});

// Alert Statistics
export const getAlertStatisticsSchema = z.object({
  days: z.number().min(1).max(365).default(30)
});

// Alert Thresholds
export type UpdateThresholdData = {
  alertType: AlertType;
  thresholds: Record<string, number>;
};

export const updateThresholdSchema = z.object({
  alertType: z.enum(['stagnant', 'replenishment', 'divergence', 'margin', 'returns', 'redistribution']),
  thresholds: z.record(z.string(), z.number())
});

// Export Alerts
export type ExportAlertsData = {
  types?: AlertType[];
  severities?: string[];
  date?: string;
  search?: string;
};

export const exportAlertsSchema = z.object({
  types: z.array(z.enum(['stagnant', 'replenishment', 'divergence', 'margin', 'returns', 'redistribution'])).optional(),
  severities: z.array(z.string()).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().min(1).max(100).optional()
}); 