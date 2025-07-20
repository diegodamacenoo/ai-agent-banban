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
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/shared/ui/toast';

// Import da server action
import { deleteBaseModule } from '@/app/actions/admin/modules/base-modules';

// Tipo do módulo base
interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  // Dados derivados para validação
  implementationsCount?: number;
  assignmentsCount?: number;
  organizationsCount?: number;
}

interface DeleteBaseModuleDialogProps {
  module: BaseModule;
  onSuccess?: () => void;
  onOptimisticDelete?: (moduleId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  trigger?: React.ReactNode;
}

export function DeleteBaseModuleDialog({module, onSuccess, onOptimisticDelete, onServerSuccess, onServerError, trigger }: DeleteBaseModuleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const hasOptimisticCallbacks = onOptimisticDelete && onServerSuccess && onServerError;
      let operationId: string | null = null;

      // MODO OTIMÍSTICO: Se há todos os callbacks necessários
      if (hasOptimisticCallbacks) {
        // Aplicar delete otimístico (soft delete)
        operationId = onOptimisticDelete(module.id);
        console.log('🗑️ MODO OTIMÍSTICO: Módulo deletado otimisticamente:', operationId);

        // UI cleanup imediato (sem onSuccess para evitar reload)
        setOpen(false);

        // Server action em background
        try {
          const result = await deleteBaseModule(module.id);

          if (result.success) {
            // Confirmar operação otimística
            onServerSuccess(operationId, result.data);
            console.log('✅ MODO OTIMÍSTICO: Delete confirmado pelo servidor:', operationId);
            
            // Toast apenas após confirmação
            toast.success(`O módulo base "${module.name}" foi removido do sistema.`, {
              title: 'Módulo excluído com sucesso!',
            });
          } else {
            // Reverter operação otimística
            onServerError(operationId, result.error || 'Erro no servidor');
            console.log('❌ MODO OTIMÍSTICO: Erro do servidor, revertendo:', operationId);
          }
        } catch (serverError) {
          // Reverter operação otimística em caso de exceção
          onServerError(operationId, 'Erro inesperado na conexão');
          console.error('❌ MODO OTIMÍSTICO: Exceção do servidor:', serverError);
        }

      } else {
        // MODO TRADICIONAL: Sem estado otimístico
        console.log('🔄 MODO TRADICIONAL: Deletando módulo...');
        
        const result = await deleteBaseModule(module.id);
        
        if (result.success) {
          toast.success(`O módulo base "${module.name}" foi removido do sistema.`, {
            title: 'Módulo excluído com sucesso!',
          });
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(result.error || 'Ocorreu um erro inesperado.', {
            title: 'Erro ao excluir módulo',
          });
        }
      }

    } catch (error) {
      console.debug('Erro geral ao excluir módulo base:', error);
      toast.error('Ocorreu um erro inesperado. Tente novamente.', {
        title: 'Erro ao excluir módulo',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Verificar se o módulo pode ser excluído
  const hasImplementations = (module.implementationsCount || 0) > 0;
  const hasAssignments = (module.assignmentsCount || 0) > 0;
  const canDelete = !hasImplementations && !hasAssignments;

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
      <Trash2 className="w-4 h-4" />
      Excluir
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
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você está prestes a excluir o módulo base:
              </p>
              
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="font-medium">{module.name}</div>
                <div className="text-sm text-muted-foreground">{module.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{module.category}</Badge>
                  <Badge variant={module.is_active ? "default" : "secondary"}>
                    {module.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              {/* Verificações de segurança */}
              {hasImplementations && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Atenção: Módulo possui implementações</span>
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Este módulo possui {module.implementationsCount} implementação(ões). 
                    Exclua todas as implementações antes de remover o módulo base.
                  </div>
                </div>
              )}

              {hasAssignments && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Atenção: Módulo possui assignments ativos</span>
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    Este módulo possui {module.assignmentsCount} assignment(s) ativo(s) em {module.organizationsCount} organização(ões). 
                    Remova todos os assignments antes de excluir o módulo.
                  </div>
                </div>
              )}

            {canDelete && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Esta ação não pode ser desfeita</span>
                </div>
                <div className="text-sm text-red-700 mt-1">
                  O módulo base será permanentemente removido do sistema.
                </div>
              </div>
            )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            disabled={isDeleting}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            variant="destructive"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Excluindo...' : 'Excluir Módulo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}