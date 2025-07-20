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
import { useToast } from '@/shared/ui/toast';
import { deleteImplementation } from '@/app/actions/admin/modules/module-implementations';
import { Loader2, Trash2 } from 'lucide-react';

interface ModuleImplementation {
  id: string;
  name: string;
}

interface DeleteImplementationDialogProps {
  implementation: ModuleImplementation;
  onDelete: () => void;
  children: React.ReactNode;
  onOptimisticDelete?: (implementationId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

export function DeleteImplementationDialog({implementation,
  onDelete,
  children,
  onOptimisticDelete,
  onServerSuccess,
  onServerError,
}: DeleteImplementationDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    let operationId: string | undefined;

    try {
      // Delete otimístico IMEDIATO
      if (onOptimisticDelete) {
        operationId = onOptimisticDelete(implementation.id);
        
        // Fechar diálogo imediatamente para UX rápida
        setIsOpen(false);
        toast.success(`Implementação "${implementation.name}" removida!`);
        onDelete();
      }

      // Server action em background
      const result = await deleteImplementation(implementation.id);
      
      if (result.success) {
        // Confirmar operação otimística
        if (operationId && onServerSuccess) {
          onServerSuccess(operationId);
        }
        
        // Se não usou otimístico, fazer callback tradicional
        if (!onOptimisticDelete) {
          toast.success(`Implementação "${implementation.name}" removida com sucesso.`);
          onDelete();
          setIsOpen(false);
        }
      } else {
        // Reverter operação otimística
        if (operationId && onServerError) {
          onServerError(operationId, result.error || 'Erro no servidor');
        } else {
          toast.error(result.error || 'Falha ao remover a implementação.');
        }
      }
    } catch (error) {
      // Reverter operação otimística em caso de erro
      if (operationId && onServerError) {
        onServerError(operationId, 'Erro de conexão');
      } else {
        toast.error('Ocorreu um erro ao tentar remover a implementação.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Remoção</DialogTitle>
          <DialogDescription>
            Tem certeza de que deseja remover a implementação{' '}
            <span className="font-semibold text-foreground">
              {implementation.name}
            </span>
            ? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            disabled={isDeleting}
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            <span>Remover</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
