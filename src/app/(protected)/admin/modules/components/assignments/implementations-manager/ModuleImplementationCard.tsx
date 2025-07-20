'use client';

import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Plus,
  BadgeCheck,
  Package,
  ChevronsDownUp,
  ChevronsUpDown,
  LucideProps,
  Database,
  BarChart3,
  Activity,
  Settings,
  Bell,
  Users,
  Shield,
  Zap,
  Globe,
  Archive,
  Trash2,
} from 'lucide-react';
import { CreateImplementationDialog } from '../..';
import { BaseModule, ModuleImplementation } from '@/app/(protected)/admin/modules/types';

const iconComponents: { [key: string]: React.ComponentType<LucideProps> } = {
  Package,
  BarChart3,
  Activity,
  Settings,
  Bell,
  Users,
  Shield,
  Zap,
  Database,
  Globe,
};

const IconRenderer = ({ name, ...props }: { name: string } & LucideProps) => {
  const LucideIcon = iconComponents[name];
  if (!LucideIcon) {
    return <Database {...props} />; // Ícone padrão
  }
  return <LucideIcon {...props} />;
};

interface ModuleImplementationCardProps {
  module: BaseModule & { implementations: ModuleImplementation[] };
  baseModules: BaseModule[];
  expanded: boolean;
  onToggleExpand: () => void;
  onDataChange: () => void;
  selectedImplementation: ModuleImplementation | null;
  onSelectImplementation: (implementation: ModuleImplementation) => void;
  onOptimisticUpdate?: (updatedImplementation: ModuleImplementation) => string;
  onOptimisticDelete?: (implementationId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: ModuleImplementation) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

export function ModuleImplementationCard({
  module,
  baseModules,
  expanded,
  onToggleExpand,
  onDataChange,
  selectedImplementation,
  onSelectImplementation,
  onOptimisticUpdate,
  onOptimisticDelete,
  onServerSuccess,
  onServerError,
}: ModuleImplementationCardProps) {
  return (
    <Card key={module.id} variant="highlight" className="p-1 bg-[hsl(var(--highlight))]">
      {/* Module Header */}
      <div className="flex flex-row gap-3 px-4 py-2 items-center justify-between">
        <div className="w-fit flex items-center gap-3">
          <IconRenderer name={module.icon || 'Database'} strokeWidth={2.3} className="w-4 h-4 text-[hsl(var(--highlight-foreground))]" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{module.name}</p>
              {module.archived_at && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Arquivado
                </Badge>
              )}
              {module.deleted_at && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  Excluído
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="w-fit flex items-center gap-2">
          <span className="text-xs">
            {module.implementations.length} implementações
          </span>
          {module.implementations.some(impl => impl.is_default) && (
            <BadgeCheck className="w-4 h-4 mx-1" />
          )}

          <CreateImplementationDialog
            baseModules={baseModules}
            initialModuleId={module.id}
            onImplementationCreated={onDataChange}
          >
            <Button variant="highlight" size="icon" leftIcon={<Plus className="w-4 h-4" />}></Button>
          </CreateImplementationDialog>
          <Button
            variant="highlight"
            size="icon"
            onClick={onToggleExpand}
            leftIcon={expanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
          >
          </Button>
        </div>
      </div>

      {/* Implementations List */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
        <Card size="xs" className="space-y-2">
          {module.implementations.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Nenhuma implementação encontrada</p>
              <CreateImplementationDialog
                baseModules={baseModules}
                initialModuleId={module.id}
                onImplementationCreated={onDataChange}
              >
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Implementação
                </Button>
              </CreateImplementationDialog>
            </div>
          ) : (
            <>
              {/* Table Body */}
              <div className="space-y-1">
                {module.implementations
                  .sort((a, b) => {
                    // Primeiro ordenar por status (ativos primeiro)
                    if (a.is_active !== b.is_active) {
                      return a.is_active ? -1 : 1;
                    }
                    // Segundo ordenar por implementação padrão (padrão primeiro)
                    if (a.is_default !== b.is_default) {
                      return a.is_default ? -1 : 1;
                    }
                    // Depois ordenar alfabeticamente por nome
                    return a.name.localeCompare(b.name);
                  })
                  .map((implementation, idx) => (
                  <div key={implementation.id}>
                    <div
                      className={`grid grid-cols-12 gap-4 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-[hsl(var(--secondary))] ${selectedImplementation?.id === implementation.id ? 'ring-2 ring-[hsl(var(--highlight-foreground))] bg-[hsl(var(--highlight-hover))]' : ''
                        }`}
                      onClick={() => onSelectImplementation(implementation)}
                    >
                      {/* Implementation Name */}
                      <div className="col-span-5 flex gap-3">
                        <div>
                          <div className="flex gap-2">
                            <span className="font-medium text-sm">{implementation.name}</span>
                            {implementation.is_default && (
                              <BadgeCheck className="w-4 h-4" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {implementation.implementation_key}
                          </p>
                        </div>
                      </div>

                      {/* Audience */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-muted-foreground">
                          {implementation.audience}
                        </span>
                      </div>

                      {/* Complexity */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-muted-foreground">
                          {implementation.complexity}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-3 flex items-center justify-end">
                        <Badge className="w-fit">
                          {implementation.is_active && module.is_active && !module.archived_at && !module.deleted_at ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                    {idx < module.implementations.length - 1 && (
                      <div className="my-1">
                        <hr className="border-muted" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </Card>
  );
}
