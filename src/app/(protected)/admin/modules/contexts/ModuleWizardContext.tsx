'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useModuleWizardReducer } from '../development/hooks/useModuleWizardReducer';

const ModuleWizardContext = createContext<ReturnType<typeof useModuleWizardReducer> | undefined>(undefined);

interface ModuleWizardProviderProps {
  children: ReactNode;
}

/**
 * Provider para compartilhar o estado do wizard entre componentes
 * Otimizado para reduzir re-renderizações desnecessárias
 */
export function ModuleWizardProvider({ children }: ModuleWizardProviderProps) {
  const wizardData = useModuleWizardReducer();
  
  // Memoizar o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(() => wizardData, [
    wizardData.state.currentStep,
    wizardData.state.config,
    wizardData.canProceed,
    wizardData.canGoBack,
    wizardData.progress.percentage,
    wizardData.historyInfo.canUndo,
    wizardData.historyInfo.historySize
  ]);

  return (
    <ModuleWizardContext.Provider value={contextValue}>
      {children}
    </ModuleWizardContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do wizard (substitui o useModuleWizard direto)
 */
export function useModuleWizardContext() {
  const context = useContext(ModuleWizardContext);
  if (!context) {
    throw new Error('useModuleWizardContext deve ser usado dentro de ModuleWizardProvider');
  }
  return context;
}