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
import { Input } from '@/shared/ui/input';
import { FileX, Loader2, AlertTriangle } from 'lucide-react';
import { purgeBaseModule } from '@/app/actions/admin/modules/base-modules';

interface BaseModule {
  id: string;
  name: string;
  slug: string;
  category: string;
  archived_at: string | null;
  deleted_at: string | null;
}

interface PurgeBaseModuleDialogProps {
  module: BaseModule;
  onSuccess?: () => void;
  onOptimisticPurge?: (moduleId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  trigger: React.ReactNode;
}

export function PurgeBaseModuleDialog({module, onSuccess, onOptimisticPurge, onServerSuccess, onServerError, trigger }: PurgeBaseModuleDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const router = useRouter();

  const confirmationText = `EXCLUIR ${module.name}`;

  const handlePurge = async () => {
    setIsLoading(true);
    
    try {
      const hasOptimisticCallbacks = onOptimisticPurge && onServerSuccess && onServerError;
      let operationId: string | null = null;

      // MODO OTIMÍSTICO: Se há todos os callbacks necessários
      if (hasOptimisticCallbacks) {
        // Aplicar purge otimístico (hard delete)
        operationId = onOptimisticPurge(module.id);
        console.log('🗑️ MODO OTIMÍSTICO: Módulo purgado otimisticamente:', operationId);

        // UI cleanup imediato (sem onSuccess para evitar reload)
        setIsOpen(false);

        // Server action em background
        try {
          const result = await purgeBaseModule(module.id);

          if (result.success) {
            // Confirmar operação otimística
            onServerSuccess(operationId, result.data);
            console.log('✅ MODO OTIMÍSTICO: Purge confirmado pelo servidor:', operationId);
            
            // Toast apenas após confirmação
            toast.success(result.message || 'Módulo excluído permanentemente');
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
        console.log('🔄 MODO TRADICIONAL: Purgando módulo...');
        
        const result = await purgeBaseModule(module.id);
        
        if (result.success) {
          toast.success(result.message || 'Módulo excluído permanentemente');
          setIsOpen(false);
          onSuccess?.();
          router.refresh();
        } else {
          toast.error(result.error || 'Erro ao excluir módulo permanentemente');
        }
      }

    } catch (error) {
      console.error('Erro geral ao purgar módulo:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const isConfirmationValid = confirmationInput === confirmationText;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileX className="w-5 h-5 text-red-600" />
            Excluir Módulo Permanentemente
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">ATENÇÃO: Esta ação é irreversível!</span>
                </div>
              </div>
              
              <p>
                Você está prestes a excluir permanentemente o módulo <strong>"{module.name}"</strong>.
              </p>
              
              <div className="mt-4">
                <strong>Esta ação irá:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Remover o módulo permanentemente do banco de dados</li>
                  <li>Impossibilitar a recuperação do módulo</li>
                  <li>Pode causar erros se houver implementações ou assignments associados</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 my-4">
                <div className="text-yellow-800 text-sm">
                  <strong>Pré-requisito:</strong> O módulo deve estar em estado "soft-deleted" antes de ser purgado.
                </div>
              </div>
              
              <div>
                <strong>Para confirmar, digite:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-sm">{confirmationText}</code>
              </div>
              
              <div className="mt-4">
                <Input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={confirmationText}
                  className="w-full"
                />
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
            onClick={handlePurge}
            disabled={isLoading || !isConfirmationValid}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <FileX className="mr-2 h-4 w-4" />
                Excluir Permanentemente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}