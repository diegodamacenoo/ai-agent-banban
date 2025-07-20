'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/ui/toast';
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
import { RotateCcw, Loader2 } from 'lucide-react';
import { restoreBaseModule } from '@/app/actions/admin/modules/base-modules';

interface BaseModule {
  id: string;
  name: string;
  slug: string;
  category: string;
  archived_at: string | null;
  deleted_at: string | null;
}

interface RestoreBaseModuleDialogProps {
  module: BaseModule;
  onSuccess?: () => void;
  onOptimisticRestore?: (moduleId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  trigger: React.ReactNode;
}

export function RestoreBaseModuleDialog({module, onSuccess, onOptimisticRestore, onServerSuccess, onServerError, trigger }: RestoreBaseModuleDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const isArchived = module.archived_at !== null;
  const isDeleted = module.deleted_at !== null;

  const handleRestore = async () => {
    setIsLoading(true);
    
    try {
      const hasOptimisticCallbacks = onOptimisticRestore && onServerSuccess && onServerError;
      let operationId: string | null = null;

      // MODO OTIMÍSTICO: Se há todos os callbacks necessários
      if (hasOptimisticCallbacks) {
        // Aplicar restore otimístico
        operationId = onOptimisticRestore(module.id);
        console.log('🔄 MODO OTIMÍSTICO: Módulo restaurado otimisticamente:', operationId);

        // UI cleanup imediato (sem onSuccess para evitar reload)
        setIsOpen(false);

        // Server action em background
        try {
          const result = await restoreBaseModule(module.id);

          if (result.success) {
            // Confirmar operação otimística
            onServerSuccess(operationId, result.data);
            console.log('✅ MODO OTIMÍSTICO: Restore confirmado pelo servidor:', operationId);
            
            // Toast apenas após confirmação
            toast.success(result.message || 'Módulo restaurado com sucesso');
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
        console.log('🔄 MODO TRADICIONAL: Restaurando módulo...');
        
        const result = await restoreBaseModule(module.id);
        
        if (result.success) {
          toast.success(result.message || 'Módulo restaurado com sucesso');
          setIsOpen(false);
          onSuccess?.();
          router.refresh();
        } else {
          toast.error(result.error || 'Erro ao restaurar módulo');
        }
      }

    } catch (error) {
      console.error('Erro geral ao restaurar módulo:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Restaurar Módulo
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>
                Você tem certeza que deseja restaurar o módulo <strong className="font-medium">"{module.name}"</strong>?
              </p>
              <div className="mt-4">
                <strong className="font-medium">Esta ação irá:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Tornar o módulo visível novamente nas listagens</li>
                  <li>Restaurar automaticamente todas as implementações associadas</li>
                  <li>Reativar o módulo para novas configurações</li>
                  {isDeleted && <li>Remover a marcação de exclusão</li>}
                  {isArchived && <li>Remover a marcação de arquivamento</li>}
                </ul>
              </div>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">
                  O módulo voltará a estar disponível para atribuição a novos tenants.
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            disabled={isLoading}
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRestore}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Restaurando...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Restaurar Módulo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}