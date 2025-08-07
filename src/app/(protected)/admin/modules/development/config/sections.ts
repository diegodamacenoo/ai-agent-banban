
import { Section } from '../types';
import {
  BarChart3,
  Code2,
  CheckCircle2,
  FileCode,
  Wrench,
  Rocket
} from 'lucide-react';

/**
 * Configuração central para todas as seções do Guia Interativo de Desenvolvimento.
 * Esta é a fonte da verdade para a estrutura do guia.
 */
export const SECTIONS_CONFIG: Section[] = [
  {
    id: 'dashboard',
    name: 'Dashboard de Desenvolvimento',
    shortName: 'Dashboard',
    description: 'Visão geral das métricas e status do ambiente',
    status: 'completed',
    icon: BarChart3,
    completedSteps: 4,
    totalSteps: 4,
    estimatedTime: '2 min'
  },
  {
    id: 'validation',
    name: 'Validação Estrutural',
    shortName: 'Validação',
    description: 'Verificação de arquivos e configurações obrigatórias',
    status: 'completed',
    icon: CheckCircle2,
    completedSteps: 12,
    totalSteps: 12,
    estimatedTime: '3-5 min'
  },
  {
    id: 'templates',
    name: 'Templates e Preview',
    shortName: 'Templates',
    description: 'Visualização e customização de templates',
    status: 'pending',
    icon: FileCode,
    completedSteps: 0,
    totalSteps: 6,
    estimatedTime: '5-10 min'
  },
  {
    id: 'tools',
    name: 'Ferramentas de Debug',
    shortName: 'Debug',
    description: 'Ferramentas integradas para diagnóstico e debug',
    status: 'pending',
    icon: Wrench,
    completedSteps: 0,
    totalSteps: 8,
    estimatedTime: '5 min'
  },
  {
    id: 'deployment',
    name: 'Deploy e Monitoramento',
    shortName: 'Deploy',
    description: 'Deployment e monitoramento em tempo real',
    status: 'pending',
    icon: Rocket,
    completedSteps: 0,
    totalSteps: 7,
    estimatedTime: '8-12 min'
  }
];
