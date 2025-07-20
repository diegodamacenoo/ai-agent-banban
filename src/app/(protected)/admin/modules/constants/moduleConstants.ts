import {
  Package,
  CircleCheck,
  PlayCircle,
  CircleAlert,
  Settings,
  CircleMinus,
  Archive,
  Layers,
  Cog,
  Factory,
  CreditCard,
  Banknote,
  Building,
  Monitor,
  Server,
  Laptop,
  Plug,
  Database,
  Bot
} from 'lucide-react';
import { ModuleMaturity, ModuleTechnicalType } from '@/shared/types/module-catalog';

// Mapeamento para os rótulos de maturidade
export const MATURITY_LABELS: Record<ModuleMaturity, string> = {
  'PLANNED': 'Planejamento',
  'IN_DEVELOPMENT': 'Desenvolvimento',
  'ALPHA': 'Alpha',
  'BETA': 'Beta',
  'RC': 'Release Candidate',
  'GA': 'Produção',
  'MAINTENANCE': 'Manutenção',
  'DEPRECATED': 'Obsoleto',
  'RETIRED': 'Aposentado',
};

// Mapeamento para ícones de status visual
export const STATUS_ICONS = {
  'GA': CircleCheck,
  'BETA': PlayCircle, 
  'ALPHA': CircleAlert,
  'MAINTENANCE': Settings,
  'PLANNED': CircleMinus
} as const;

// Descrições detalhadas para os tooltips
export const MATURITY_DESCRIPTIONS: Record<ModuleMaturity, string> = {
  'PLANNED': 'Módulo em fase de planejamento. Ainda não foi iniciado o desenvolvimento.',
  'IN_DEVELOPMENT': 'Módulo em desenvolvimento ativo. Funcionalidades sendo implementadas.',
  'ALPHA': 'Versão inicial para testes internos. Pode conter bugs e funcionalidades incompletas.',
  'BETA': 'Versão para testes com usuários selecionados. Funcionalidades principais prontas.',
  'RC': 'Release Candidate - Candidato a lançamento. Aguardando validação final.',
  'GA': 'General Availability - Pronto para produção. Estável, testado e disponível para todos os clientes.',
  'MAINTENANCE': 'Em modo de manutenção. Recebe apenas correções de bugs e atualizações de segurança.',
  'DEPRECATED': 'Obsoleto. Será descontinuado em breve. Considere migrar para alternativas.',
  'RETIRED': 'Aposentado. Não mais disponível ou suportado.',
};

export const MATURITY_BADGE_VARIANT: Record<ModuleMaturity, 'default' | 'secondary' | 'destructive' | "outline" | "light_destructive" | "light_warning"> = {
  'PLANNED': 'outline',        // Cinza claro - ainda planejando
  'IN_DEVELOPMENT': 'outline', // Azul - em desenvolvimento ativo
  'ALPHA': 'outline',        // Azul - testes internos
  'BETA': 'outline',          // Azul escuro - testes limitados
  'RC': 'outline',            // Azul escuro - quase pronto
  'GA': 'secondary',            // Verde - pronto para produção
  'MAINTENANCE': 'light_warning',  // Azul - manutenção
  'DEPRECATED': 'light_destructive', // Vermelho - obsoleto
  'RETIRED': 'light_destructive',    // Vermelho - aposentado
};

// Mapeamentos para categorias
export const CATEGORY_LABELS: Record<string, string> = {
  'standard': 'Padrão',
  'custom': 'Personalizado',
  'industry': 'Setorial'
};

export const CATEGORY_ICONS: Record<string, any> = {
  'standard': Layers,
  'custom': Cog,
  'industry': Factory
};

// Mapeamentos para preços
export const PRICING_LABELS: Record<string, string> = {
  'free': 'Gratuito',
  'basic': 'Básico',
  'standard': 'Padrão',
  'premium': 'Premium',
  'enterprise': 'Empresarial'
};

export const PRICING_ICONS: Record<string, any> = {
  'free': Package,
  'basic': CreditCard,
  'standard': CreditCard,
  'premium': Banknote,
  'enterprise': Building
};

// Mapeamentos para tipos técnicos
export const TECHNICAL_TYPE_LABELS: Record<ModuleTechnicalType, string> = {
  'frontend': 'Frontend',
  'backend': 'Backend',
  'full-stack': 'Full-Stack',
  'integration': 'Integration',
  'data-processing': 'Data Processing',
  'automation': 'Automation'
};

export const TECHNICAL_TYPE_ICONS: Record<ModuleTechnicalType, any> = {
  'frontend': Monitor,
  'backend': Server,
  'full-stack': Laptop,
  'integration': Plug,
  'data-processing': Database,
  'automation': Bot
};

// Status de módulos
export const MODULE_STATUS = {
  ALL: 'all',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  ORPHANED: 'ORPHANED'
} as const;

export const STATUS_LABELS: Record<string, string> = {
  [MODULE_STATUS.ALL]: 'Todos',
  [MODULE_STATUS.ACTIVE]: 'Ativos',
  [MODULE_STATUS.ARCHIVED]: 'Arquivados',
  [MODULE_STATUS.ORPHANED]: 'Órfãos'
};

// Configurações da tabela
export const TABLE_CONFIG = {
  MIN_WIDTH: '1000px',
  COLUMNS: {
    MODULE: 'w-[25%]',
    STATUS: 'w-[12%]',
    HEALTH: 'w-[8%]',
    ADOPTION: 'w-[8%]',
    PERFORMANCE: 'w-[11%]',
    AVAILABILITY: 'w-[12%]',
    ALERTS: 'w-[10%]',
    ACTIONS: 'w-[40px]'
  }
};