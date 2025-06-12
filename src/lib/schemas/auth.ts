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