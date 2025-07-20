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

// Import da server action
import { updateBaseModule } from '@/app/actions/admin/modules/base-modules';

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

interface ToggleActiveStatusDialogProps {
  module: BaseModule;
  onSuccess?: () => void;
  onOptimisticUpdate?: (updatedModule: BaseModule) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  trigger?: React.ReactNode;
}

export function ToggleActiveStatusDialog({module, onSuccess, onOptimisticUpdate, onServerSuccess, onServerError, trigger }: ToggleActiveStatusDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Só deve trabalhar com is_active (sem considerar archived_at)
  const newStatus = !module.is_active;
  const action = newStatus ? 'ativar' : 'desativar';
  const actionPast = newStatus ? 'ativado' : 'desativado';

  const handleToggle = async () => {
    setIsUpdating(true);
    
    try {
      const hasOptimisticCallbacks = onOptimisticUpdate && onServerSuccess && onServerError;
      let operationId: string | null = null;

      // MODO OTIMÍSTICO: Se há todos os callbacks necessários
      if (hasOptimisticCallbacks) {
        // Criar módulo atualizado para estado otimístico
        const updatedModule = {
          ...module,
          is_active: newStatus,
          updated_at: new Date().toISOString()
        };

        // Aplicar update otimístico
        operationId = onOptimisticUpdate(updatedModule);
        console.log(`⚡ MODO OTIMÍSTICO: Módulo ${action} otimisticamente:`, operationId);

        // UI cleanup imediato (sem onSuccess para evitar reload)
        setOpen(false);

        // Server action em background
        try {
          const result = await updateBaseModule({
            id: module.id,
            is_active: newStatus,
          });

          if (result.success) {
            // Confirmar operação otimística
            onServerSuccess(operationId, result.data);
            console.log(`✅ MODO OTIMÍSTICO: ${action} confirmado pelo servidor:`, operationId);
            
            // Toast apenas após confirmação
            toast.success(`O módulo base "${module.name}" foi ${actionPast}.`, {
              title: `Módulo ${actionPast} com sucesso!`,
            });
          } else {
            // Reverter operação otimística
            onServerError(operationId, result.error || 'Erro no servidor');
            console.log(`❌ MODO OTIMÍSTICO: Erro do servidor, revertendo:`, operationId);
          }
        } catch (serverError) {
          // Reverter operação otimística em caso de exceção
          onServerError(operationId, 'Erro inesperado na conexão');
          console.error(`❌ MODO OTIMÍSTICO: Exceção do servidor:`, serverError);
        }

      } else {
        // MODO TRADICIONAL: Sem estado otimístico
        console.log(`🔄 MODO TRADICIONAL: ${action} módulo...`);
        
        const result = await updateBaseModule({
          id: module.id,
          is_active: newStatus,
        });
        
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
      }

    } catch (error) {
      console.debug(`Erro geral ao ${action} módulo base:`, error);
      toast.error('Ocorreu um erro inesperado. Tente novamente.', {
        title: `Erro ao ${action} módulo`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Verificar impacto da ação
  const hasActiveAssignments = module.is_active && (module.assignmentsCount || 0) > 0;

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className={newStatus ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}>
      <Power className="w-4 h-4" />
      {newStatus ? 'Ativar' : 'Desativar'}
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
            {newStatus ? 'Ativar' : 'Desativar'} Módulo
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
                    Status atual: {module.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="secondary">{module.category}</Badge>                
                </div>
              </div>

              {/* Informações sobre o impacto */}
              {newStatus ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Ativando módulo</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    O módulo ficará disponível para novos assignments e operações normais.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Desativando módulo</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    O módulo será desativado temporariamente. Não aceitará novos assignments, mas assignments existentes continuarão funcionando.
                  </p>
                </div>
              )}

              {/* Aviso sobre assignments ativos */}
              {hasActiveAssignments && !newStatus && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Atenção: Módulo possui assignments ativos</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Este módulo possui {module.assignmentsCount} assignment(s) ativo(s) em {module.organizationsCount} organização(ões). 
                    Os assignments continuarão funcionando normalmente.
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
              "bg-red-600 hover:bg-red-700 focus:ring-red-600"
            }
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpdating ? `${action.charAt(0).toUpperCase() + action.slice(1)}ando...` : `${action.charAt(0).toUpperCase() + action.slice(1)} Módulo`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}