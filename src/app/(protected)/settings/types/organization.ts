import { z } from 'zod';
import { OrganizationSettingsSchema, OrganizationSettingsUpdateSchema } from '@/lib/schemas/organization';

export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>;
export type OrganizationSettingsUpdate = z.infer<typeof OrganizationSettingsUpdateSchema>; 