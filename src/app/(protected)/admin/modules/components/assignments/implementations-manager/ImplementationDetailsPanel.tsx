'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Settings,
  Edit,
  Trash2,
  Eye,
  Code,
  Users,
  BadgeCheck,
  Activity,
  MousePointerClick,
} from 'lucide-react';
import { EditImplementationDialog, DeleteImplementationDialog } from '../..';
import { ModuleImplementation, BaseModule } from '@/app/(protected)/admin/modules/types';

interface ImplementationDetailsPanelProps {
  implementation: ModuleImplementation | null;
  baseModule?: BaseModule;
  onDataChange: () => void;
  setSelectedImplementation: (implementation: ModuleImplementation | null) => void;
  onOptimisticUpdate?: (updatedImplementation: ModuleImplementation) => string;
  onOptimisticDelete?: (implementationId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: ModuleImplementation) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

export function ImplementationDetailsPanel({
  implementation,
  baseModule,
  onDataChange,
  setSelectedImplementation,
  onOptimisticUpdate,
  onOptimisticDelete,
  onServerSuccess,
  onServerError,
}: ImplementationDetailsPanelProps) {
  if (!implementation) {
    return (
      <Card size="sm" variant="accent">
        <CardContent className="min-h-[100px] p-6 flex flex-col justify-center items-center text-center text-[hsl(var(--muted-foreground))]">
          <span className="w-[250px] text-sm flex flex-col items-center gap-3">
            <MousePointerClick className="w-8 h-8" />
            Selecione uma implementação para ver os detalhes.
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" variant="outline" className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Detalhes da Implementação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nome de Exibição</label>
          <p className="text-sm text-muted-foreground">{implementation.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium">Chave da Implementação</label>
          <p className="text-sm text-muted-foreground font-mono">{implementation.implementation_key}</p>
        </div>

        <div>
          <label className="text-sm font-medium">Caminho do Componente</label>
          <p className="text-sm text-muted-foreground font-mono break-all">
            {implementation.component_path}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Público-Alvo</label>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4" />
              <Badge variant="secondary">
                {implementation.audience}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Nível de Complexidade</label>
            <div className="flex items-center gap-2 mt-1">
              <Activity className="w-4 h-4" />
              <Badge variant="secondary">
                {implementation.complexity}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {implementation.is_default && (
            <Badge variant="outline" className="flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              Implementação Padrão
            </Badge>
          )}
          <Badge variant="secondary">
            {implementation.is_active && (!baseModule || (baseModule.is_active && !baseModule.archived_at && !baseModule.deleted_at)) ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <div className='grid grid-cols-3 gap-1'>
            <EditImplementationDialog
              implementation={implementation}
              onSuccess={() => {
                setSelectedImplementation(null);
                onDataChange();
              }}
              onOptimisticUpdate={onOptimisticUpdate}
              onServerSuccess={onServerSuccess}
              onServerError={onServerError}
              trigger={
                <Button variant="secondary" className="w-full" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                  Editar
                </Button>
              }
            />
            <Button variant="secondary" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
              Testar
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Code className="w-4 h-4" />}>
              Ver Código
            </Button>
          </div>

          <DeleteImplementationDialog
            implementation={implementation}
            onDelete={() => {
              setSelectedImplementation(null);
              onDataChange();
            }}
            onOptimisticDelete={onOptimisticDelete}
            onServerSuccess={onServerSuccess}
            onServerError={onServerError}
          >
            <Button variant="destructive" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}>
              Remover
            </Button>
          </DeleteImplementationDialog>
        </div>
      </CardContent>
    </Card>
  );
}
