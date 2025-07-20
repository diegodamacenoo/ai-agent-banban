import { z } from 'zod';

// Schema para validaÃ§Ã£o de dados de configuraÃ§Ã£o da organizaÃ§Ã£o
export const OrganizationSettingsSchema = z.object({
  name: z.string().min(1, 'Nome da organizaÃ§Ã£o Ã© obrigatÃ³rio'),
  logo_url: z.string().url().optional().nullable(),
  domain: z.string().optional().nullable(),
  timezone: z.string().optional(),
  allowed_domains: z.array(z.string()).optional(),
  address: z.string().optional().nullable(),
  billing_email: z.string().email().optional().nullable(),
});

export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>;

export const OrganizationSettingsUpdateSchema = OrganizationSettingsSchema.partial();
export type OrganizationSettingsUpdate = z.infer<typeof OrganizationSettingsUpdateSchema>; 
