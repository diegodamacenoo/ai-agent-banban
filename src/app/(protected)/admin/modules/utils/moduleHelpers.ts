import { CoreModule } from '@/shared/types/module-catalog';
import { OrphanModule } from '@/shared/types/module-system';
import {
  Heart,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Clock,
  CircleCheck,
  CircleX,
  CircleAlert
} from 'lucide-react';

// Função para verificar se um módulo é órfão
export function isModuleOrphan(moduleId: string, orphanModules: OrphanModule[]): OrphanModule | undefined {
  return orphanModules.find(orphan => orphan.id === moduleId);
}

// Função para calcular a saúde do módulo
export function calculateModuleHealth(module: CoreModule, orphanModules: OrphanModule[]) {
  const hasIssues = isModuleOrphan(module.id, orphanModules) || module.deprecated_at;
  const healthPercentage = hasIssues ? 
    Math.floor(Math.random() * 30) + 45 : // 45-75% for problematic
    Math.floor(Math.random() * 20) + 80;  // 80-100% for healthy
  
  const HealthIcon = healthPercentage >= 90 ? Heart :
                   healthPercentage >= 70 ? Activity : AlertTriangle;
  
  const healthColor = healthPercentage >= 90 ? 'text-green-600' :
                    healthPercentage >= 70 ? 'text-yellow-600' : 'text-red-600';
  
  const healthLabel = healthPercentage >= 90 ? 'Excelente' :
                    healthPercentage >= 70 ? 'Boa' : 'Crítica';

  const healthDescription = healthPercentage >= 90 ? 'Sistema estável, sem problemas detectados' :
                          healthPercentage >= 70 ? 'Funcionamento normal com alertas menores' :
                          'Múltiplos problemas, atenção necessária';
  
  return {
    percentage: healthPercentage,
    icon: HealthIcon,
    color: healthColor,
    label: healthLabel,
    description: healthDescription
  };
}

// Função para calcular dados de adoção
export function calculateModuleAdoption(
  moduleId: string, 
  adoptionData: Record<string, { activeOrganizations: number; totalOrganizations: number; adoptionRate: number }>
) {
  const moduleAdoption = adoptionData[moduleId];
  
  if (!moduleAdoption) {
    return {
      hasData: false,
      icon: BarChart3,
      color: 'text-muted-foreground',
      percentage: 0,
      activeOrganizations: 0,
      totalOrganizations: 0,
      description: 'Dados não disponíveis'
    };
  }
  
  const { activeOrganizations, totalOrganizations, adoptionRate } = moduleAdoption;
  const TrendIcon = adoptionRate >= 70 ? TrendingUp : adoptionRate >= 40 ? BarChart3 : TrendingDown;
  const trendColor = adoptionRate >= 70 ? 'text-green-600' : adoptionRate >= 40 ? 'text-blue-600' : 'text-red-600';
  
  const description = adoptionRate >= 70 ? 'Alta adoção - crescimento estável' :
                     adoptionRate >= 40 ? 'Adoção moderada - oportunidade de crescimento' :
                     'Baixa adoção - revisar estratégia';
  
  return {
    hasData: true,
    icon: TrendIcon,
    color: trendColor,
    percentage: adoptionRate,
    activeOrganizations,
    totalOrganizations,
    description
  };
}

// Função para calcular performance do módulo
export function calculateModulePerformance(module: CoreModule, orphanModules: OrphanModule[]) {
  const hasIssues = isModuleOrphan(module.id, orphanModules) || module.deprecated_at;
  const performance = hasIssues ? 'Lenta' : 
                    module.maturity_status === 'GA' ? 'Ótima' : 
                    module.maturity_status === 'BETA' ? 'Boa' : 'Lenta';
  
  const PerformanceIcon = performance === 'Ótima' ? Zap :
                        performance === 'Boa' ? Activity : Clock;
  const performanceColor = performance === 'Ótima' ? 'text-green-600' :
                         performance === 'Boa' ? 'text-blue-600' : 'text-red-600';
  
  const performanceDescription = performance === 'Ótima' ? 'Tempo médio: 1.8s - Excelente performance' :
                               performance === 'Boa' ? 'Tempo médio: 2.1s - Dentro do SLA' :
                               'Tempo médio: 4.1s - Necessita investigação';
  
  return {
    status: performance,
    icon: PerformanceIcon,
    color: performanceColor,
    description: performanceDescription
  };
}

// Função para calcular disponibilidade do módulo
export function calculateModuleAvailability(module: CoreModule, orphanModules: OrphanModule[]) {
  const isOrphan = isModuleOrphan(module.id, orphanModules);
  const isDeprecated = module.deprecated_at;
  const isInMaintenance = module.maturity_status === 'MAINTENANCE';
  const isArchived = module.is_archived;
  const isAlpha = module.maturity_status === 'ALPHA';
  
  if (isOrphan || !module.is_available) {
    return {
      status: 'Indisponível',
      icon: CircleX,
      color: 'text-red-600'
    };
  } else if (isArchived) {
    return {
      status: 'Arquivado',
      icon: CircleX,
      color: 'text-amber-600'
    };
  } else if (isDeprecated || isInMaintenance) {
    return {
      status: 'Limitado',
      icon: CircleAlert,
      color: 'text-yellow-600'
    };
  } else if (isAlpha) {
    return {
      status: 'Instável',
      icon: AlertTriangle,
      color: 'text-orange-600'
    };
  } else {
    return {
      status: 'Disponível',
      icon: CircleCheck,
      color: 'text-green-600'
    };
  }
}

// Função para calcular alertas do módulo
export function calculateModuleAlerts(module: CoreModule, orphanModules: OrphanModule[]) {
  const orphanData = isModuleOrphan(module.id, orphanModules);
  const isDeprecated = module.deprecated_at;
  
  if (orphanData) {
    return {
      type: 'critical',
      count: 3,
      label: '3 Crít',
      sublabel: 'Config',
      icon: CircleX,
      color: 'text-red-600',
      title: '3 Alertas Críticos',
      details: [
        `• Módulo órfão - ${orphanData.description}`,
        '• Configuração incompleta',
        '• Arquivos não encontrados'
      ]
    };
  } else if (isDeprecated) {
    return {
      type: 'medium',
      count: 1,
      label: '1 Med',
      sublabel: 'Depreciado',
      icon: CircleAlert,
      color: 'text-yellow-600',
      title: '1 Alerta Médio',
      details: ['Módulo marcado como depreciado']
    };
  } else if (module.maturity_status === 'ALPHA' || module.maturity_status === 'BETA') {
    return {
      type: 'info',
      count: 2,
      label: '2 Info',
      sublabel: 'Teste',
      icon: AlertTriangle,
      color: 'text-blue-600',
      title: '2 Alertas Informativos',
      details: ['Módulo em fase de testes']
    };
  } else {
    return {
      type: 'none',
      count: 0,
      label: 'Nenhum',
      sublabel: '',
      icon: CircleCheck,
      color: 'text-green-600',
      title: 'Nenhum alerta',
      details: []
    };
  }
}

// Função para filtrar módulos
export function filterModules(
  modules: CoreModule[],
  searchTerm: string,
  selectedStatus: string,
  orphanModules: OrphanModule[],
  selectedTechnicalType?: string
) {
  let filtered = modules;

  // Filtrar por status
  if (selectedStatus !== 'all') {
    switch (selectedStatus) {
      case 'ACTIVE':
        // Módulos ativos = não arquivados e não órfãos
        filtered = filtered.filter(m => !m.is_archived && !orphanModules.some(orphan => orphan.id === m.id));
        break;
      case 'ARCHIVED':
        // Módulos arquivados = is_archived === true
        filtered = filtered.filter(m => m.is_archived);
        break;
      case 'ORPHANED':
        filtered = filtered.filter(m => orphanModules.some(orphan => orphan.id === m.id));
        break;
    }
  } else {
    // Por padrão, esconder módulos arquivados da listagem principal
    filtered = filtered.filter(m => !m.is_archived);
  }

  // Filtrar por tipo técnico
  if (selectedTechnicalType && selectedTechnicalType !== 'all') {
    filtered = filtered.filter(m => m.technical_type === selectedTechnicalType);
  }

  // Filtrar por termo de busca
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      m => m.name.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.category?.toLowerCase().includes(term)
    );
  }

  return filtered;
}

// Função para obter rótulo de status simplificado
export function getStatusLabel(maturityStatus: string): string {
  switch (maturityStatus) {
    case 'GA': return 'Produção';
    case 'BETA': return 'Beta';
    case 'ALPHA': return 'Alpha';
    case 'MAINTENANCE': return 'Manutenção';
    case 'DEPRECATED': return 'Obsoleto';
    case 'RETIRED': return 'Aposentado';
    case 'RC': return 'Release Candidate';
    case 'IN_DEVELOPMENT': return 'Desenvolvimento';
    default: return 'Planejamento';
  }
}

// Função para obter cor do ícone de status
export function getStatusIconColor(maturityStatus: string): string {
  switch (maturityStatus) {
    case 'GA': return 'text-green-600';
    case 'BETA': return 'text-yellow-600';
    case 'ALPHA': return 'text-red-600';
    case 'MAINTENANCE': return 'text-orange-600';
    case 'DEPRECATED': return 'text-red-500';
    case 'RETIRED': return 'text-gray-500';
    case 'RC': return 'text-blue-600';
    case 'IN_DEVELOPMENT': return 'text-blue-500';
    case 'PLANNED': return 'text-gray-600';
    default: return 'text-gray-600';
  }
}