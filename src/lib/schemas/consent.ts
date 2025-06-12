import { z } from 'zod';

// Schema para validação de consentimento
export const ConsentSchema = z.object({
  consent_type: z.enum(['terms_of_service', 'privacy_policy', 'marketing']),
  version: z.string().min(1, 'Versão é obrigatória'),
  accepted: z.boolean().refine(val => val === true, 'Consentimento deve ser aceito')
});

// Schema para múltiplos consentimentos
export const MultipleConsentsSchema = z.array(ConsentSchema);

// Schema para buscar histórico (sem parâmetros)
export const GetConsentHistorySchema = z.object({}); 