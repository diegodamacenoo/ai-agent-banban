import { WizardStepDefinition, WizardStep } from '../types';
import {
  Package,
  Settings,
  Palette,
  Sliders,
  FileCheck,
  CheckSquare,
  Wrench,
  Building2
} from 'lucide-react';

/**
 * Configuração dos steps do wizard de criação de módulos.
 * Define a sequência, validações e dependências entre steps.
 */
export const WIZARD_STEPS: WizardStepDefinition[] = [
  {
    id: 'module-type',
    title: 'Tipo de Módulo',
    description: 'Escolha entre módulo padrão ou personalizado para cliente',
    icon: Package,
    isOptional: false,
    estimatedTime: '1-2 min',
    dependencies: []
  },
  {
    id: 'basic-config',
    title: 'Configuração Básica',
    description: 'Nome, descrição e informações fundamentais do módulo',
    icon: Settings,
    isOptional: false,
    estimatedTime: '3-5 min',
    dependencies: ['module-type']
  },
  {
    id: 'implementation-config',
    title: 'Configurar Implementação',
    description: 'Definir como o módulo será implementado especificamente',
    icon: Wrench,
    isOptional: false,
    estimatedTime: '3-5 min',
    dependencies: ['basic-config']
  },
  {
    id: 'client-config',
    title: 'Atribuição de Cliente',
    description: 'Selecionar cliente e criar atribuição do módulo',
    icon: Building2,
    isOptional: false,
    estimatedTime: '2-3 min',
    dependencies: ['implementation-config']
  },
  {
    id: 'final-review',
    title: 'Revisão e Criação',
    description: 'Revisar configurações, criar módulo e acompanhar implementação',
    icon: FileCheck,
    isOptional: false,
    estimatedTime: '3-5 min',
    dependencies: ['basic-config']
  }
];

/**
 * Retorna apenas os steps visíveis baseado no tipo de módulo e configuração.
 */
export function getVisibleSteps(moduleType?: 'standard' | 'custom', config?: any): WizardStepDefinition[] {
  return WIZARD_STEPS.filter(step => isStepVisible(step.id, moduleType, config));
}

/**
 * Retorna o próximo step baseado no atual e na configuração, pulando steps invisíveis.
 */
export function getNextStep(currentStep: WizardStep, moduleType?: 'standard' | 'custom', config?: any): WizardStep | null {
  const visibleSteps = getVisibleSteps(moduleType, config);
  const currentIndex = visibleSteps.findIndex(step => step.id === currentStep);
  
  if (currentIndex === -1 || currentIndex === visibleSteps.length - 1) {
    return null;
  }

  return visibleSteps[currentIndex + 1].id;
}

/**
 * Retorna o step anterior baseado no atual e na configuração, pulando steps invisíveis.
 */
export function getPreviousStep(currentStep: WizardStep, moduleType?: 'standard' | 'custom', config?: any): WizardStep | null {
  const visibleSteps = getVisibleSteps(moduleType, config);
  const currentIndex = visibleSteps.findIndex(step => step.id === currentStep);
  
  if (currentIndex === -1 || currentIndex === 0) {
    return null;
  }

  return visibleSteps[currentIndex - 1].id;
}

/**
 * Verifica se um step deve ser exibido baseado no tipo do módulo e configuração.
 */
export function isStepVisible(stepId: WizardStep, moduleType?: 'standard' | 'custom', config?: any): boolean {
  // Todos os steps são sempre visíveis agora
  return true;
}

/**
 * Retorna o índice efetivo do step considerando steps ocultos.
 */
export function getEffectiveStepIndex(stepId: WizardStep, moduleType?: 'standard' | 'custom', config?: any): number {
  const visibleSteps = getVisibleSteps(moduleType, config);
  return visibleSteps.findIndex(step => step.id === stepId);
}

/**
 * Retorna o total de steps visíveis para o tipo de módulo e configuração.
 */
export function getTotalVisibleSteps(moduleType?: 'standard' | 'custom', config?: any): number {
  return getVisibleSteps(moduleType, config).length;
}