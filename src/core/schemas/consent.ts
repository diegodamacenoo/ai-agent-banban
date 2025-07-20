import { z } from 'zod';

// Tipos de consentimento
export const CONSENT_TYPES = {
  TERMS_OF_SERVICE: 'terms_of_service',
  PRIVACY_POLICY: 'privacy_policy',
  MARKETING_COMMUNICATIONS: 'marketing_communications',
  DATA_PROCESSING: 'data_processing',
  COOKIES: 'cookies',
  THIRD_PARTY_SHARING: 'third_party_sharing'
} as const;

// Schema para validação de consentimento
export const ConsentSchema = z.object({
  consent_type: z.enum([
    CONSENT_TYPES.TERMS_OF_SERVICE,
    CONSENT_TYPES.PRIVACY_POLICY,
    CONSENT_TYPES.MARKETING_COMMUNICATIONS,
    CONSENT_TYPES.DATA_PROCESSING,
    CONSENT_TYPES.COOKIES,
    CONSENT_TYPES.THIRD_PARTY_SHARING
  ]),
  version: z.string().min(1, 'Versão é obrigatória'),
  accepted: z.boolean().default(true)
});

// Schema para buscar histórico de consentimentos
export const GetConsentHistorySchema = z.object({});

// Schema para múltiplos consentimentos
export const MultipleConsentsSchema = z.array(ConsentSchema)
  .min(1, 'Pelo menos um consentimento é necessário')
  .max(10, 'Número máximo de consentimentos excedido');

// Tipos exportados
export type ConsentType = keyof typeof CONSENT_TYPES;
export type ConsentData = z.infer<typeof ConsentSchema>; 