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
import { deleteSimpleTenantAssignment } from '@/app/actions/admin/modules/tenant-module-assignments';

interface DeleteAssignmentDialogProps {
  tenantId: string;
  baseModuleId: string;
  moduleName: string;
  organizationName: string;
  onSuccess: () => void;
  trigger: React.ReactNode;
  onOptimisticDelete?: (tenantId: string, baseModuleId: string, assignmentInfo?: { organizationName: string, moduleName: string }) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

export function DeleteAssignmentDialog({
  tenantId,
  baseModuleId,
  moduleName,
  organizationName,
  onSuccess,
  trigger,
  onOptimisticDelete,
  onServerSuccess,
  onServerError,
}: DeleteAssignmentDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    let operationId: string | undefined;

    try {
      // Delete otimístico IMEDIATO
      if (onOptimisticDelete) {
        operationId = onOptimisticDelete(tenantId, baseModuleId, {
          organizationName,
          moduleName
        });
        
        // Fechar diálogo imediatamente para UX rápida
        setIsOpen(false);
        toast.success('Atribuição removida!');
        onSuccess();
      }

      // Server action em background
      const result = await deleteSimpleTenantAssignment(tenantId, baseModuleId);
      
      if (result.success) {
        // Confirmar operação otimística
        if (operationId && onServerSuccess) {
          onServerSuccess(operationId);
        }
        
        // Se não usou otimístico, fazer callback tradicional
        if (!onOptimisticDelete) {
          toast.success(result.message);
          onSuccess();
          setIsOpen(false);
        }
      } else {
        // Reverter operação otimística
        if (operationId && onServerError) {
          onServerError(operationId, result.message || 'Erro no servidor');
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      // Reverter operação otimística em caso de erro
      if (operationId && onServerError) {
        onServerError(operationId, 'Erro de conexão');
      } else {
        toast.error('Ocorreu um erro ao tentar excluir a atribuição.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Você tem certeza que deseja excluir a atribuição do módulo{' '}
            <span className="font-semibold text-primary">{moduleName}</span> para a organização{' '}
            <span className="font-semibold text-primary">{organizationName}</span>? Esta ação não pode ser desfeita.
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
            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
