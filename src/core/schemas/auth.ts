import { z } from 'zod';

// Change Password Schema
export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'A senha atual é obrigatória'),
  newPassword: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'A confirmação da senha é obrigatória')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

// MFA Schemas
export type VerifyMFAData = {
  factorId: string;
  code: string;
};

export const verifyMFASchema = z.object({
  factorId: z.string().min(1, 'Factor ID é obrigatório'),
  code: z.string().min(6, 'Código deve ter no mínimo 6 caracteres').max(8, 'Código deve ter no máximo 8 caracteres')
});

export type UnenrollMFAData = {
  factorId: string;
};

export const unenrollMFASchema = z.object({
  factorId: z.string().min(1, 'Factor ID é obrigatório')
});

// Data Export Schema
export type ProcessDataExportData = {
  exportId: string;
};

export const processDataExportSchema = z.object({
  exportId: z.string()
});

// Account Management Schemas
export type AccountDeletionRequest = {
  userId: string;
  reason?: string;
};

export const accountDeletionRequestSchema = z.object({
  userId: z.string(),
  reason: z.string().optional()
});

export type AccountDeactivation = {
  userId: string;
  reason?: string;
};

export const accountDeactivationSchema = z.object({
  userId: z.string(),
  reason: z.string().optional()
});

// MFA Schemas
export type MFAEnrollment = {
  userId: string;
  factorType: 'totp' | 'sms' | 'email';
};

export const mfaEnrollmentSchema = z.object({
  userId: z.string(),
  factorType: z.enum(['totp', 'sms', 'email'])
});

export type MFAVerification = {
  userId: string;
  factorId: string;
  code: string;
};

export const mfaVerificationSchema = z.object({
  userId: z.string(),
  factorId: z.string(),
  code: z.string()
});

// Session Management Schemas
export type SessionTermination = {
  userId: string;
  sessionId: string;
};

export const sessionTerminationSchema = z.object({
  userId: z.string(),
  sessionId: z.string()
});

// Data Export Status
export type DataExportStatus = 'requested' | 'processing' | 'completed' | 'failed';

export const dataExportStatusSchema = z.enum([
  'requested',
  'processing',
  'completed',
  'failed'
]);

// Session Schemas
export type TerminateSessionData = {
  sessionId: string;
};

export const terminateSessionSchema = z.object({
  sessionId: z.string().min(1, 'ID da sessão é obrigatório')
}); 