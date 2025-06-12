import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().optional(),
  job_title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  team: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  email: z.string().email('E-mail inválido'),
  role: z.string(),
  theme: z.string(),
});

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const UploadAvatarSchema = z.object({
  avatar: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `O tamanho máximo do arquivo é 2MB.`)
    .refine(
      (file) => VALID_IMAGE_TYPES.includes(file?.type),
      "Formato de arquivo inválido. Apenas JPG, PNG, WEBP ou GIF são permitidos."
    ),
});

export const GetTeamsSchema = z.object({}); 