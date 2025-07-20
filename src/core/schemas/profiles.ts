import { z } from 'zod';

export const UploadAvatarSchema = z.object({
  avatar: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, {
      message: 'O arquivo deve ter no máximo 5MB'
    })
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), {
      message: 'O arquivo deve ser uma imagem (JPEG, PNG ou WebP)'
    })
});

export type UploadAvatarData = z.infer<typeof UploadAvatarSchema>;

export const UpdateProfileSchema = z.object({
  first_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  last_name: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  job_title: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  team: z.string().nullable(),
  username: z.string().nullable(),
  avatar_url: z.string().nullable()
});

export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>; 