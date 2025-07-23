// Mapeamentos para transformar valores do banco em labels amigáveis para exibição

export const audienceMappings: Record<string, string> = {
  'generic': 'Módulo Genérico',
  'client-specific': 'Cliente Específico',
  'banban': 'Banban',
  'riachuelo': 'Riachuelo',
  'ca': 'C&A',
  'universal': 'Universal',
  'enterprise': 'Empresarial',
  'small-business': 'Pequenos Negócios',
  'startup': 'Startups',
};

export const complexityMappings: Record<string, string> = {
  'low': 'Plano Starter',
  'medium': 'Plano Growth',
  'high': 'Plano Professional',
  'very-high': 'Plano Enterprise',
  'simple': 'Todos os Planos',
  'moderate': 'Growth ou Superior',
  'complex': 'Professional ou Superior',
  'advanced': 'Plano Avançado',
  'basic': 'Plano Básico',
  'standard': 'Plano Padrão',
  'enterprise': 'Plano Enterprise',
};

// Função auxiliar para obter o label de audiência
export function getAudienceLabel(audience: string): string {
  return audienceMappings[audience.toLowerCase()] || audience;
}

// Função auxiliar para obter o label de disponibilidade (anteriormente complexidade)
export function getComplexityLabel(complexity: string): string {
  return complexityMappings[complexity.toLowerCase()] || complexity;
}