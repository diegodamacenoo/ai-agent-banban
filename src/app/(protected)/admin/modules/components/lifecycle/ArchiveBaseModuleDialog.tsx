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
import { Archive, Loader2 } from 'lucide-react';
import { archiveBaseModule } from '@/app/actions/admin/modules/base-modules';

interface BaseModule {
  id: string;
  name: string;
  slug: string;
  category: string;
  archived_at: string | null;
  deleted_at: string | null;
}

interface ArchiveBaseModuleDialogProps {
  module: BaseModule;
  onSuccess?: () => void;
  onOptimisticArchive?: (moduleId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  trigger: React.ReactNode;
}

export function ArchiveBaseModuleDialog({
  module, onSuccess, onOptimisticArchive, onServerSuccess, onServerError, trigger }: ArchiveBaseModuleDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleArchive = async () => {
    setIsLoading(true);
    
    try {
      const hasOptimisticCallbacks = onOptimisticArchive && onServerSuccess && onServerError;
      let operationId: string | null = null;

      // MODO OTIMÍSTICO: Se há todos os callbacks necessários
      if (hasOptimisticCallbacks) {
        // Aplicar update otimístico
        operationId = onOptimisticArchive(module.id);
        console.log('🗂️ MODO OTIMÍSTICO: Módulo arquivado otimisticamente:', operationId);

        // UI cleanup imediato (sem onSuccess para evitar reload)
        setIsOpen(false);

        // Server action em background
        try {
          const result = await archiveBaseModule(module.id);

          if (result.success) {
            // Confirmar operação otimística
            onServerSuccess(operationId, result.data);
            console.log('✅ MODO OTIMÍSTICO: Arquivamento confirmado pelo servidor:', operationId);
            
            // Toast apenas após confirmação
            toast.success(result.message || 'Módulo arquivado com sucesso');
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
        console.log('🔄 MODO TRADICIONAL: Arquivando módulo...');
        
        const result = await archiveBaseModule(module.id);
        
        if (result.success) {
          toast.success(result.message || 'Módulo arquivado com sucesso');
          setIsOpen(false);
          onSuccess?.();
          router.refresh();
        } else {
          toast.error(result.error || 'Erro ao arquivar módulo');
        }
      }

    } catch (error) {
      console.error('Erro geral ao arquivar módulo:', error);
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
            Arquivar Módulo
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>
                Você tem certeza que deseja arquivar o módulo <strong className="font-medium">"{module.name}"</strong>?
              </p>
              <div className="mt-4">
                <strong className="font-medium">Esta ação irá:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Remover o módulo das listagens padrão</li>
                  <li>Arquivar automaticamente todas as implementações associadas</li>
                  <li>Manter os assignments de tenants existentes</li>
                  <li>Permitir restauração posterior</li>
                </ul>
              </div>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">
                  O módulo permanecerá funcional para tenants que já o possuem, mas não aparecerá em novas configurações.
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
            onClick={handleArchive}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Arquivando...
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Arquivar Módulo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}