import { z } from 'zod';
import { userRoleOptions } from '@/app/(protected)/settings/types/user-settings-types';

// Schemas from users.ts
export const updateUserSchema = z.object({
  id: z.string(),
  perfil: z.enum(userRoleOptions).optional(),
});

export const deactivateUserSchema = z.object({
  id: z.string(),
});

export const softDeleteUserSchema = z.object({
  id: z.string(),
});

export const hardDeleteUserSchema = z.object({
  id: z.string(),
});

export const restoreUserSchema = z.object({
  id: z.string(),
});


// Schemas from roles.ts
export const PerfilSchema = z.object({
  name: z.string().min(1, 'Nome do perfil é obrigatório'),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const UpdatePerfilSchema = PerfilSchema.extend({
  id: z.string().uuid('ID inválido'),
});

export const DeletePerfilSchema = z.object({
  id: z.string().uuid('ID inválido para deleção'),
});


// Schemas from invites.ts
export const inviteUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(userRoleOptions).default('reader'),
  expiresIn: z.number().int().min(1).max(30).default(7), // Dias para expiração, padrão 7 dias
});

export const resendInviteSchema = z.object({
  id: z.string(),
});

export const cancelInviteSchema = z.object({
  id: z.string(),
}); 