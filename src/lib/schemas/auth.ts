import { z } from 'zod';

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória.'),
  newPassword: z.string()
    .min(8, 'A nova senha deve ter no mínimo 8 caracteres.')
    .regex(/[A-Z]/, 'A nova senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[a-z]/, 'A nova senha deve conter pelo menos uma letra minúscula.')
    .regex(/[0-9]/, 'A nova senha deve conter pelo menos um número.')
    .regex(/[^a-zA-Z0-9]/, 'A nova senha deve conter pelo menos um caractere especial.'),
  confirmNewPassword: z.string().min(1, 'Confirmação de senha é obrigatória.'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmNewPassword'],
});

export const RequestPasswordResetSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.'),
});

// Schemas para gerenciamento de sessões
export const terminateSessionSchema = z.object({
  sessionId: z.string().min(1, 'ID da sessão é obrigatório')
});

// Schemas para processamento de exportação de dados
export const processDataExportSchema = z.object({
  exportId: z.string().min(1, 'ID da exportação é obrigatório')
});

// Schemas para MFA (Multi-Factor Authentication)
export const verifyMFASchema = z.object({
  factorId: z.string().min(1, 'ID do fator é obrigatório'),
  code: z.string().min(6, 'Código deve ter pelo menos 6 caracteres').max(8, 'Código deve ter no máximo 8 caracteres')
});

export const unenrollMFASchema = z.object({
  factorId: z.string().min(1, 'ID do fator é obrigatório')
});

export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type RequestPasswordResetData = z.infer<typeof RequestPasswordResetSchema>;
export type TerminateSessionData = z.infer<typeof terminateSessionSchema>;
export type ProcessDataExportData = z.infer<typeof processDataExportSchema>;
export type VerifyMFAData = z.infer<typeof verifyMFASchema>;
export type UnenrollMFAData = z.infer<typeof unenrollMFASchema>; 