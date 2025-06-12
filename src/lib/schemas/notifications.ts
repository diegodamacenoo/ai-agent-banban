import { z } from 'zod';

// Schema para validação de preferências de notificação
export const NotificationPreferencesSchema = z.object({
  prefers_email_notifications: z.boolean(),
  prefers_push_notifications: z.boolean(),
});

// Schema para configurações de alertas de segurança
export const SecurityAlertSettingsSchema = z.object({
  alert_new_device: z.boolean(),
  alert_failed_attempts: z.boolean(),
  alert_user_deletion: z.boolean(),
  failed_attempts_threshold: z.number().min(2).max(10),
});

// Schema para buscar preferências (sem parâmetros)
export const GetNotificationPreferencesSchema = z.object({});

// Schema para buscar configurações de segurança (sem parâmetros)
export const GetSecurityAlertSettingsSchema = z.object({}); 