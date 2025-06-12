import { z } from 'zod';

// Schema para configurações de alertas de segurança
export const securityAlertSettingsSchema = z.object({
  alert_new_device: z.boolean().default(true),
  alert_failed_attempts: z.boolean().default(true), 
  alert_user_deletion: z.boolean().default(true),
  failed_attempts_threshold: z.number().int().min(2).max(10).default(3)
});

// Schema para atualização (todos campos opcionais)
export const updateSecurityAlertSettingsSchema = securityAlertSettingsSchema.partial();

// Schema para dispositivo conhecido
export const userKnownDeviceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  device_fingerprint: z.string(),
  user_agent: z.string().optional(),
  first_seen_at: z.string(),
  last_seen_at: z.string(),
  is_trusted: z.boolean(),
  created_at: z.string()
});

// Schema para histórico de tentativas de login
export const loginAttemptHistorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  email: z.string().email(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  success: z.boolean(),
  failure_reason: z.string().optional(),
  attempted_at: z.string(),
  device_fingerprint: z.string().optional()
});

// Tipos TypeScript
export type SecurityAlertSettings = z.infer<typeof securityAlertSettingsSchema>;
export type UpdateSecurityAlertSettings = z.infer<typeof updateSecurityAlertSettingsSchema>;
export type UserKnownDevice = z.infer<typeof userKnownDeviceSchema>;
export type LoginAttemptHistory = z.infer<typeof loginAttemptHistorySchema>;

// Schema para evento de segurança
export const securityEventSchema = z.object({
  type: z.enum(['new_device', 'failed_attempts', 'user_deletion']),
  user_id: z.string().uuid(),
  user_email: z.string().email(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  device_fingerprint: z.string().optional(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

export type SecurityEvent = z.infer<typeof securityEventSchema>; 