import { useMemo } from 'react';
import { CoreModule } from '@/shared/types/module-catalog';
import { OrphanModule } from '@/shared/types/module-system';
import { ModuleAdoptionData } from './useModuleData';
import { isModuleOrphan } from '../utils/moduleHelpers';

export interface ExecutiveStats {
  total: number;
  produção: number;
  beta: number;
  problemas: number;
  prodPercentage: string;
  betaPercentage: string;
  problemsPercentage: string;
  avgAdoption: string;
}

export interface UseModuleStatsReturn {
  executiveStats: ExecutiveStats;
}

export function useModuleStats(
  modules: CoreModule[],
  adoptionData: Record<string, ModuleAdoptionData>,
  orphanModules: OrphanModule[]
): UseModuleStatsReturn {
  
  const executiveStats = useMemo(() => {
    const total = modules.length;
    const produção = modules.filter(m => m.maturity_status === 'GA').length;
    const beta = modules.filter(m => m.maturity_status === 'BETA').length;
    const problemas = modules.filter(m => isModuleOrphan(m.id, orphanModules) || m.deprecated_at).length;
    
    const prodPercentage = total > 0 ? ((produção / total) * 100).toFixed(1) : '0.0';
    const betaPercentage = total > 0 ? ((beta / total) * 100).toFixed(1) : '0.0';
    const problemsPercentage = total > 0 ? ((problemas / total) * 100).toFixed(1) : '0.0';
    
    // Calculate average adoption
    const totalAdoption = Object.values(adoptionData).reduce((sum, data) => sum + data.adoptionRate, 0);
    const avgAdoption = Object.keys(adoptionData).length > 0 ? (totalAdoption / Object.keys(adoptionData).length).toFixed(1) : '0.0';
    
    return {
      total,
      produção,
      beta,
      problemas,
      prodPercentage,
      betaPercentage,
      problemsPercentage,
      avgAdoption
    };
  }, [modules, adoptionData, orphanModules]);

  return {
    executiveStats
  };
}