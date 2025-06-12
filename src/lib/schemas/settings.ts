import { z } from 'zod';

// Schema para atualização de configurações gerais
export const updateGeneralSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['pt', 'en', 'es']).optional(),
  timezone: z.string().optional(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  time_format: z.enum(['12h', '24h']).optional(),
});

// Schema para configurações de notificação
export const updateNotificationSettingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  security_alerts: z.boolean().optional(),
});

// Schema para configurações de privacidade
export const updatePrivacySettingsSchema = z.object({
  profile_visibility: z.enum(['public', 'organization', 'private']).optional(),
  show_email: z.boolean().optional(),
  show_phone: z.boolean().optional(),
  allow_contact: z.boolean().optional(),
  data_processing_consent: z.boolean().optional(),
});

// Schema para configurações de segurança
export const updateSecuritySettingsSchema = z.object({
  two_factor_enabled: z.boolean().optional(),
  session_timeout: z.number().min(5).max(1440).optional(), // 5 min a 24h
  login_notifications: z.boolean().optional(),
  device_tracking: z.boolean().optional(),
  password_expiry_days: z.number().min(30).max(365).optional(),
});

// Schema para backup de configurações
export const exportSettingsSchema = z.object({
  include_personal: z.boolean().default(true),
  include_preferences: z.boolean().default(true),
  include_security: z.boolean().default(false),
  format: z.enum(['json', 'csv']).default('json'),
});

// Schema para importação de configurações
export const importSettingsSchema = z.object({
  settings_data: z.string().min(1, 'Dados de configuração são obrigatórios'),
  overwrite_existing: z.boolean().default(false),
  validate_only: z.boolean().default(false),
});

// Schema para reset de configurações
export const resetSettingsSchema = z.object({
  section: z.enum(['all', 'general', 'notifications', 'privacy', 'security']),
  confirm: z.boolean().refine(val => val === true, {
    message: 'Confirmação é obrigatória para reset de configurações'
  }),
});

// Tipos TypeScript
export type UpdateGeneralSettingsData = z.infer<typeof updateGeneralSettingsSchema>;
export type UpdateNotificationSettingsData = z.infer<typeof updateNotificationSettingsSchema>;
export type UpdatePrivacySettingsData = z.infer<typeof updatePrivacySettingsSchema>;
export type UpdateSecuritySettingsData = z.infer<typeof updateSecuritySettingsSchema>;
export type ExportSettingsData = z.infer<typeof exportSettingsSchema>;
export type ImportSettingsData = z.infer<typeof importSettingsSchema>;
export type ResetSettingsData = z.infer<typeof resetSettingsSchema>;

// Schema para buscar configurações (sem parâmetros)
export const getSettingsSchema = z.object({});
export type GetSettingsData = z.infer<typeof getSettingsSchema>; 