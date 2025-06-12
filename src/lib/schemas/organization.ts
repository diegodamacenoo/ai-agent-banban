import { z } from 'zod';

export const OrganizationSettingsSchema = z.object({
  id: z.string().uuid(),
  company_legal_name: z.string().nullable(),
  company_trading_name: z.string().nullable(),
  cnpj: z.string().nullable(),
  state_registration: z.string().nullable(),
  address_street: z.string().nullable(),
  address_state_province: z.string().nullable(),
  address_city: z.string().nullable(),
  address_postal_code: z.string().nullable(),
  default_timezone: z.string().nullable(),
  default_currency: z.string().nullable(),
  idle_product_threshold_days: z.number().int().nullable(),
  min_stock_coverage_alert_days: z.number().int().nullable(),
  min_acceptable_margin_percentage: z.number().nullable(),
  default_export_format: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const OrganizationSettingsUpdateSchema = OrganizationSettingsSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .partial(); 