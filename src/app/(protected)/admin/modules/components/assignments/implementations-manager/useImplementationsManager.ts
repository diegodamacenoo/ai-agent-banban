'use client';

import { useState, useMemo, useEffect } from 'react';
import { BaseModule, ModuleImplementation } from '@/app/(protected)/admin/modules/types';

interface UseImplementationsManagerProps {
  baseModules: BaseModule[];
  implementations: ModuleImplementation[];
  getImplementationsForModule: (baseModuleId: string) => ModuleImplementation[];
  includeArchivedModules?: boolean;
  includeDeletedModules?: boolean;
}

export function useImplementationsManager({
  baseModules,
  implementations,
  getImplementationsForModule,
  includeArchivedModules = false,
  includeDeletedModules = false,
}: UseImplementationsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedImplementation, setSelectedImplementation] = useState<ModuleImplementation | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isInitialExpansionSet, setIsInitialExpansionSet] = useState(false);
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const toggleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const processedModules = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // Filtrar módulos base baseado no status de arquivamento/exclusão
    const filteredBaseModules = baseModules.filter(module => {
      // Se módulo está deletado, só incluir se includeDeletedModules for true
      if (module.deleted_at && !includeDeletedModules) {
        return false;
      }
      
      // Se módulo está arquivado, só incluir se includeArchivedModules for true
      if (module.archived_at && !includeArchivedModules) {
        return false;
      }
      
      return true;
    });

    const modulesWithImplementations = filteredBaseModules.map(module => ({
      ...module,
      implementations: getImplementationsForModule(module.id)
    }));

    if (searchTerm === '') {
        return modulesWithImplementations.filter(module => {
            const matchesModuleFilter = selectedModule === 'all' || module.id === selectedModule;
            return matchesModuleFilter && module.implementations.length > 0;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }

    return modulesWithImplementations.filter(module => {
      const matchesModuleFilter = selectedModule === 'all' || module.id === selectedModule;
      if (!matchesModuleFilter) return false;

      const moduleMatches = module.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                            module.slug.toLowerCase().includes(lowerCaseSearchTerm);

      const implementationMatches = module.implementations.some(impl =>
        impl.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        impl.implementation_key.toLowerCase().includes(lowerCaseSearchTerm)
      );

      return moduleMatches || implementationMatches;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseModules, implementations, getImplementationsForModule, searchTerm, selectedModule, includeArchivedModules, includeDeletedModules]);

  const toggleAll = () => {
    const nextState = !isAllExpanded;
    const newExpandedState: Record<string, boolean> = {};
    processedModules.forEach(module => {
      newExpandedState[module.id] = nextState;
    });
    setExpandedModules(newExpandedState);
    setIsAllExpanded(nextState);
  };

  useEffect(() => {
    if (processedModules.length > 0 && !isInitialExpansionSet) {
      const initialExpandedState: Record<string, boolean> = {};
      initialExpandedState[processedModules[0].id] = true;
      setExpandedModules(initialExpandedState);
      setIsInitialExpansionSet(true);
    }
  }, [processedModules, isInitialExpansionSet]);

  // Calcular total de implementações visíveis com os filtros atuais (incluindo busca)
  const totalVisibleImplementations = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    const filteredBaseModules = baseModules.filter(module => {
      // Se módulo está deletado, só incluir se includeDeletedModules for true
      if (module.deleted_at && !includeDeletedModules) {
        return false;
      }
      
      // Se módulo está arquivado, só incluir se includeArchivedModules for true
      if (module.archived_at && !includeArchivedModules) {
        return false;
      }
      
      return true;
    });

    const modulesWithImplementations = filteredBaseModules.map(module => ({
      ...module,
      implementations: getImplementationsForModule(module.id)
    }));

    // Se não há busca, contar todas as implementações dos módulos visíveis
    if (searchTerm === '') {
      return modulesWithImplementations.reduce((total, module) => {
        return total + module.implementations.length;
      }, 0);
    }

    // Com busca, aplicar a mesma lógica do processedModules para contar
    const filteredModules = modulesWithImplementations.filter(module => {
      const matchesModuleFilter = selectedModule === 'all' || module.id === selectedModule;
      if (!matchesModuleFilter) return false;

      const moduleMatches = module.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                            module.slug.toLowerCase().includes(lowerCaseSearchTerm);

      const implementationMatches = module.implementations.some(impl =>
        impl.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        impl.implementation_key.toLowerCase().includes(lowerCaseSearchTerm)
      );

      return moduleMatches || implementationMatches;
    });

    return filteredModules.reduce((total, module) => {
      return total + module.implementations.length;
    }, 0);
  }, [baseModules, getImplementationsForModule, includeArchivedModules, includeDeletedModules, searchTerm, selectedModule]);

  return {
    searchTerm,
    setSearchTerm,
    selectedModule,
    setSelectedModule,
    selectedImplementation,
    setSelectedImplementation,
    expandedModules,
    toggleExpand,
    isAllExpanded,
    toggleAll,
    processedModules,
    totalVisibleImplementations,
  };
}
