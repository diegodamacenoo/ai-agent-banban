import { z } from 'zod';

// Security Alert Settings
export interface SecurityAlertSettings {
  alert_new_device: boolean;
  alert_failed_attempts: boolean;
  alert_user_deletion: boolean;
  failed_attempts_threshold: number;
}

// Known Device
export interface UserKnownDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  user_agent?: string;
  last_seen_at: string;
  created_at: string;
}

// Zod Schemas
export const SecurityAlertSettingsSchema = z.object({
  alert_new_device: z.boolean(),
  alert_failed_attempts: z.boolean(),
  alert_user_deletion: z.boolean(),
  failed_attempts_threshold: z.number().min(1).max(10)
});

export const UserKnownDeviceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  device_fingerprint: z.string(),
  user_agent: z.string().optional(),
  last_seen_at: z.string(),
  created_at: z.string()
}); 