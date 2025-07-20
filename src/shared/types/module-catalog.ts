export type ModuleMaturity = 'PLANNED' | 'IN_DEVELOPMENT' | 'ALPHA' | 'BETA' | 'RC' | 'GA' | 'MAINTENANCE' | 'DEPRECATED' | 'RETIRED';

export type PricingTier = 'free' | 'standard' | 'premium' | 'enterprise';

export type ModuleStatus = 'ACTIVE' | 'ARCHIVED' | 'DEPRECATED';

export type ModuleTechnicalType = 'frontend' | 'backend' | 'full-stack' | 'integration' | 'data-processing' | 'automation';

export type ModuleComplexity = 'basic' | 'medium' | 'advanced' | 'enterprise';

export type ModuleClientScope = 'single-client' | 'multi-client' | 'client-agnostic';

export type ModuleIndustryVertical = 'fashion' | 'retail' | 'manufacturing' | 'logistics' | 'generic';

export type ModuleFunctionalCategory = 'analytics' | 'inventory' | 'alerts' | 'performance' | 'reports' | 'integrations' | 'workflows' | 'standard';

export interface CoreModule {
  id: string; // uuid
  slug: string; // ex: 'banban-inventory'
  name: string; // ex: 'Controle de Estoque'
  description: string;
  pricing_tier: PricingTier;
  maturity_status: ModuleMaturity;
  status: ModuleStatus;
  is_archived?: boolean; // indica se o módulo core está arquivado
  archived_at?: string | null;
  created_at: string; // timestamp
  updated_at: string; // timestamp
  
  // Novos campos para classificação técnica
  technical_type: ModuleTechnicalType; // tipo técnico do módulo
  complexity_level: ModuleComplexity; // nível de complexidade
  tech_tags: string[]; // tags de tecnologia
  
  // Novos campos para organização hierárquica
  client_scope: ModuleClientScope; // escopo de uso por clientes
  primary_client?: string; // cliente principal (se single-client)
  industry_vertical: ModuleIndustryVertical; // vertical da indústria
  functional_category: ModuleFunctionalCategory; // categoria funcional
  
  // Campos expandidos para mais detalhes
  dependencies?: string[]; // dependências do módulo
  category?: 'standard' | 'custom' | 'industry';
  author?: string; // autor/desenvolvedor
  vendor?: string; // fornecedor
  repository_url?: string; // URL do repositório
  documentation_url?: string; // URL da documentação
  is_available?: boolean; // disponível para instalação
  requires_approval?: boolean; // requer aprovação para instalação
  base_price_monthly?: number; // preço base mensal
  usage_based_pricing?: Record<string, number>; // pricing por uso
  deprecated_at?: string; // data de depreciação
} 