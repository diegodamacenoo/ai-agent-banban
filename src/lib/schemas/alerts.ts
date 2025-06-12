import { z } from 'zod';

export const alertTypeSchema = z.enum(['stagnant', 'replenishment', 'divergence', 'margin', 'returns', 'redistribution']);
export const alertStatusSchema = z.enum(['open', 'resolved', 'ignored']);

export const updateAlertStatusSchema = z.object({
  alertId: z.string().min(1, 'ID do alerta é obrigatório'),
  alertType: alertTypeSchema,
  status: alertStatusSchema,
  notes: z.string().optional()
});

export const alertHistorySchema = z.object({
  variantId: z.string().min(1, 'ID da variante é obrigatório'),
  alertType: alertTypeSchema.optional(),
  limit: z.number().min(1).max(100).default(50)
});

export const updateThresholdSchema = z.object({
  alertType: alertTypeSchema,
  thresholdConfig: z.record(z.string(), z.any())
});

export const getAlertDetailsSchema = z.object({
  alertId: z.string().min(1, 'ID do alerta é obrigatório'),
  alertType: alertTypeSchema
});

export const getAlertStatisticsSchema = z.object({
  days: z.number().min(1).max(365).default(30)
});

export const exportAlertsSchema = z.object({
  search: z.string().optional(),
  types: z.array(alertTypeSchema).optional(),
  severities: z.array(z.string()).optional(),
  date: z.string().optional()
}).optional();

export type AlertType = z.infer<typeof alertTypeSchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type UpdateAlertStatusData = z.infer<typeof updateAlertStatusSchema>;
export type AlertHistoryData = z.infer<typeof alertHistorySchema>;
export type UpdateThresholdData = z.infer<typeof updateThresholdSchema>;
export type GetAlertDetailsData = z.infer<typeof getAlertDetailsSchema>;
export type GetAlertStatisticsData = z.infer<typeof getAlertStatisticsSchema>;
export type ExportAlertsData = z.infer<typeof exportAlertsSchema>;

// Schema para filtros de alertas
export const alertFiltersSchema = z.object({
  search: z.string().optional(),
  types: z.array(z.enum(['stagnant', 'replenishment', 'divergence', 'margin', 'return', 'redistribution'])).optional(),
  severities: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  locations: z.array(z.string()).optional(),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
});

// Schema para resposta de alertas
export const alertResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    stagnantProducts: z.array(z.any()).optional(),
    replenishmentAlerts: z.array(z.any()).optional(),
    inventoryDivergences: z.array(z.any()).optional(),
    marginAlerts: z.array(z.any()).optional(),
    returnSpikes: z.array(z.any()).optional(),
    redistributionSuggestions: z.array(z.any()).optional(),
  }).optional(),
  error: z.string().optional(),
});

export type AlertResponse = z.infer<typeof alertResponseSchema>;

export type AlertFilters = z.infer<typeof alertFiltersSchema>; 