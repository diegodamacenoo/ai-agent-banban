'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Power, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/shared/ui/toast';

// Import das server actions
import { archiveBaseModule, restoreBaseModule } from '@/app/actions/admin/modules/base-modules';

// Tipo do módulo base
interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  // Dados derivados para validação
  assignmentsCount?: number;
  organizationsCount?: number;
}

interface ArchiveModuleDialogProps {
  module: BaseModule;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ArchiveModuleDialog({
  module, onSuccess, trigger }: ArchiveModuleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Determinar se o módulo está arquivado ou ativo
  const isArchived = module.archived_at !== null;
  const isActive = module.is_active && !isArchived;
  
  const newStatus = !isActive;
  const action = newStatus ? 'restaurar' : 'arquivar';
  const actionPast = newStatus ? 'restaurado' : 'arquivado';

  const handleToggle = async () => {
    setIsUpdating(true);
    
    try {
      const result = newStatus 
        ? await restoreBaseModule(module.id)
        : await archiveBaseModule(module.id);
      
      if (result.success) {
        toast.success(`O módulo base "${module.name}" foi ${actionPast}.`, {
          title: `Módulo ${actionPast} com sucesso!`,
        });
        
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Ocorreu um erro inesperado.', {
          title: `Erro ao ${action} módulo`,
        });
      }
    } catch (error) {
      console.debug(`Erro ao ${action} módulo base:`, error);
      toast.error('Ocorreu um erro inesperado. Tente novamente.', {
        title: `Erro ao ${action} módulo`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Verificar impacto da ação
  const hasActiveAssignments = isActive && (module.assignmentsCount || 0) > 0;

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className={newStatus ? "text-green-600 hover:text-green-700" : "text-yellow-600 hover:text-yellow-700"}>
      <Power className="w-4 h-4" />
      {newStatus ? 'Restaurar' : 'Arquivar'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {newStatus ? 'Restaurar' : 'Arquivar'} Módulo
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você está prestes a {action} o módulo base:
              </p>
              
              <div className="rounded-lg p-3 bg-[hsl(var(--secondary))]">
                <div className="font-medium text-[hsl(var(--foreground))]">{module.name}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">{module.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    Status atual: {isActive ? 'Ativo' : isArchived ? 'Arquivado' : 'Inativo'}
                  </Badge>
                  <Badge variant="secondary">{module.category}</Badge>                
                </div>
              </div>

              {/* Informações sobre o impacto */}
              {newStatus ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Restaurando módulo</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    O módulo será restaurado do arquivo e voltará a ficar disponível para novos assignments.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Arquivando módulo</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    O módulo será arquivado permanentemente. Não ficará disponível para novos assignments, mas assignments existentes continuarão funcionando.
                  </p>
                </div>
              )}

              {/* Aviso sobre assignments ativos */}
              {hasActiveAssignments && !newStatus && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Atenção: Módulo possui atribuições ativas</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Este módulo possui {module.assignmentsCount} atribuição(ões) ativa(s) em {module.organizationsCount} organização(ões). 
                    Os assignments continuarão funcionando mesmo após o arquivamento.
                  </p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            disabled={isUpdating}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleToggle}
            disabled={isUpdating}
            className={newStatus ? 
              "bg-green-600 hover:bg-green-700 focus:ring-green-600" : 
              "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            }
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isUpdating ? `${action.charAt(0).toUpperCase() + action.slice(1)}ando...` : `${action.charAt(0).toUpperCase() + action.slice(1)} Módulo`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}