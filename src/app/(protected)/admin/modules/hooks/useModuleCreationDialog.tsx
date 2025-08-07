'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ModuleCreationDialogContextType {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  toggleDialog: () => void;
}

const ModuleCreationDialogContext = createContext<ModuleCreationDialogContextType | undefined>(undefined);

interface ModuleCreationDialogProviderProps {
  children: ReactNode;
}

/**
 * Provider para gerenciar o estado do dialog de criação de módulos
 */
export function ModuleCreationDialogProvider({ children }: ModuleCreationDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);
  const toggleDialog = () => setIsOpen(prev => !prev);

  return (
    <ModuleCreationDialogContext.Provider
      value={{
        isOpen,
        openDialog,
        closeDialog,
        toggleDialog
      }}
    >
      {children}
    </ModuleCreationDialogContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do dialog de criação de módulos
 */
export function useModuleCreationDialog() {
  const context = useContext(ModuleCreationDialogContext);
  if (!context) {
    throw new Error('useModuleCreationDialog deve ser usado dentro de ModuleCreationDialogProvider');
  }
  return context;
}