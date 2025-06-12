'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface RefreshContextType {
  refreshPage: () => void;
}

export const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

interface RefreshProviderProps {
  children: ReactNode;
  refreshFunction: () => void;
}

export function RefreshProvider({ children, refreshFunction }: RefreshProviderProps) {
  const contextValue = {
    refreshPage: refreshFunction,
  };

  return (
    <RefreshContext.Provider value={contextValue}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};
