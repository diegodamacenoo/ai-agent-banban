import { z } from 'zod';

export const softDeleteUserSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
});

export const hardDeleteUserSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
});

export const restoreUserSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
});

export const updateUserSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
  first_name: z.string().min(1, 'Nome é obrigatório').optional(),
  last_name: z.string().min(1, 'Sobrenome é obrigatório').optional(),
  role: z.enum(['organization_admin', 'user', 'master_admin']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'DELETED']).optional(),
  job_title: z.string().optional(),
  phone: z.string().optional()
});

export const deactivateUserSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
}); 