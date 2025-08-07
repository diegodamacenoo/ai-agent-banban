'use client';

import { Suspense } from 'react';
import { Layout } from '@/shared/components/Layout';
import { Skeleton } from '@/shared/ui/skeleton';
import { ModuleCreationDialog } from './components/ModuleCreationDialog';
import { ModuleCreationDialogProvider, useModuleCreationDialog } from './contexts/ModuleCreationDialogContext';

/**
 * Layout compartilhado para todas as páginas de gestão de módulos
 * 
 * Responsabilidades:
 * - Fornecer estrutura base para todas as sub-páginas
 * - Gerenciar Context Providers compartilhados (futuro)
 * - Breadcrumbs automáticos baseados na rota
 * - Loading states consistentes
 * 
 * Padrões aplicados:
 * - Suspense boundaries para carregamento otimizado
 * - Context providers para estado global (a ser implementado)
 * - Estrutura responsiva consistente
 */
export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleCreationDialogProvider>
      <div className="flex flex-col min-h-screen">
        <Suspense fallback={
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        }>
          {children}
        </Suspense>
        
        {/* Dialog global para criação de módulos */}
        <ModuleCreationDialogWrapper />
      </div>
    </ModuleCreationDialogProvider>
  );
}

/**
 * Wrapper component para o dialog de criação de módulos
 * Separado para usar o hook dentro do Provider
 */
function ModuleCreationDialogWrapper() {
  const { isOpen, closeDialog } = useModuleCreationDialog();
  
  return (
    <ModuleCreationDialog 
      open={isOpen} 
      onOpenChange={closeDialog}
    />
  );
}