'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/shared/ui/dropdown-menu';
import {
  Settings,
  Search,
  Database,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleDashed,
  Archive,
  Trash2,
  Eye,
} from 'lucide-react';
import { useImplementationsManager } from './useImplementationsManager';
import { ModuleImplementationCard } from './ModuleImplementationCard';
import { ImplementationDetailsPanel } from './ImplementationDetailsPanel';
import { BaseModule, ModuleImplementation } from '@/app/(protected)/admin/modules/types';

interface ImplementationsManagerProps {
  baseModules: BaseModule[];
  implementations: ModuleImplementation[];
  loading: boolean;
  getImplementationsForModule: (baseModuleId: string) => ModuleImplementation[];
  onDataChange: () => void;
  onOptimisticUpdate?: (updatedImplementation: ModuleImplementation) => string;
  onOptimisticDelete?: (implementationId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: ModuleImplementation) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  hasOptimisticOperations?: boolean;
  includeArchivedModules?: boolean;
  includeDeletedModules?: boolean;
  onToggleArchivedModules?: (include: boolean) => void;
  onToggleDeletedModules?: (include: boolean) => void;
}

export function ImplementationsManager({
  baseModules,
  implementations,
  getImplementationsForModule,
  loading,
  onDataChange,
  onOptimisticUpdate,
  onOptimisticDelete,
  onServerSuccess,
  onServerError,
  hasOptimisticOperations,
  includeArchivedModules = false,
  includeDeletedModules = false,
  onToggleArchivedModules,
  onToggleDeletedModules,
}: ImplementationsManagerProps) {
  const {
    searchTerm,
    setSearchTerm,
    selectedImplementation,
    setSelectedImplementation,
    expandedModules,
    toggleExpand,
    isAllExpanded,
    toggleAll,
    processedModules,
  } = useImplementationsManager({
    baseModules,
    implementations,
    getImplementationsForModule,
    includeArchivedModules,
    includeDeletedModules,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <Eye className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Incluir Módulos</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={!includeArchivedModules && !includeDeletedModules}
              onCheckedChange={() => {
                onToggleArchivedModules?.(false);
                onToggleDeletedModules?.(false);
              }}
            >
              Apenas Ativos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={includeArchivedModules}
              onCheckedChange={(checked) => onToggleArchivedModules?.(!!checked)}
            >
              Arquivados
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={includeDeletedModules}
              onCheckedChange={(checked) => onToggleDeletedModules?.(!!checked)}
            >
              Excluídos
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="secondary"
          onClick={toggleAll}
          leftIcon={isAllExpanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
        >
        </Button>

        {/* Indicador de operações otimísticas */}
        {hasOptimisticOperations && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Atualizando...
          </div>
        )}
      </div>

      {/* Layout: Lista + Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Lista de Módulos e Implementações */}
        <div className="lg:col-span-2">
          {processedModules.length === 0 ? (
            <Card size="sm" variant="accent" className="p-6">
              <CardContent className="min-h-[100px] p-6 flex flex-col justify-center items-center text-center text-[hsl(var(--muted-foreground))]">
                <CircleDashed className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {searchTerm
                    ? 'Nenhum módulo encontrado com os filtros aplicados.'
                    : 'Nenhuma implementação encontrada.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {processedModules.map((module) => (
                <ModuleImplementationCard
                  key={module.id}
                  module={module}
                  baseModules={baseModules}
                  expanded={!!expandedModules[module.id]}
                  onToggleExpand={() => toggleExpand(module.id)}
                  onDataChange={onDataChange}
                  selectedImplementation={selectedImplementation}
                  onSelectImplementation={setSelectedImplementation}
                  onOptimisticUpdate={onOptimisticUpdate}
                  onOptimisticDelete={onOptimisticDelete}
                  onServerSuccess={onServerSuccess}
                  onServerError={onServerError}
                />
              ))}
            </div>
          )}
        </div>

        {/* Painel de Detalhes */}
        <div className="lg:col-span-1">
          <ImplementationDetailsPanel
            implementation={selectedImplementation}
            baseModule={selectedImplementation ? baseModules.find(m => m.id === selectedImplementation.base_module_id) : undefined}
            onDataChange={onDataChange}
            setSelectedImplementation={setSelectedImplementation}
            onOptimisticUpdate={onOptimisticUpdate}
            onOptimisticDelete={onOptimisticDelete}
            onServerSuccess={onServerSuccess}
            onServerError={onServerError}
          />
        </div>
      </div>
    </div>
  );
}
