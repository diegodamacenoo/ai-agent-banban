'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/toast';

interface EditConfigurationDialogProps {
  tenantId: string;
  baseModuleId: string;
  moduleName: string;
  organizationName: string;
  currentConfig: Record<string, any>;
  onSuccess: () => void;
  trigger: React.ReactNode;
  updateModuleConfig: (tenantId: string, baseModuleId: string, config: Record<string, any>) => Promise<void>;
  onOptimisticUpdate?: (updatedAssignment: any) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

export function EditConfigurationDialog({tenantId,
  baseModuleId,
  moduleName,
  organizationName,
  currentConfig,
  onSuccess,
  trigger,
  updateModuleConfig,
  onOptimisticUpdate,
  onServerSuccess,
  onServerError,
}: EditConfigurationDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configValue, setConfigValue] = useState(JSON.stringify(currentConfig, null, 2));
  
  // Atualizar configValue quando currentConfig mudar
  useEffect(() => {
    if (isOpen) {
      setConfigValue(JSON.stringify(currentConfig, null, 2));
    }
  }, [currentConfig, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    let operationId: string | undefined;
    
    try {
      const parsedConfig = JSON.parse(configValue);
      
      // Se temos estado otimístico, fechar dialog imediatamente para UX instantânea
      if (onOptimisticUpdate) {
        setIsOpen(false);
        toast.success('Configuração atualizada!');
        onSuccess();
      }
      
      await updateModuleConfig(tenantId, baseModuleId, parsedConfig);
      
      // Se não usou otimístico, fazer callback tradicional
      if (!onOptimisticUpdate) {
        toast.success('Configuração atualizada com sucesso!');
        onSuccess();
        setIsOpen(false);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('JSON inválido. Verifique a sintaxe da configuração.');
      } else {
        toast.error('Erro ao salvar configuração. Tente novamente.');
      }
      
      // Se usou otimístico e deu erro, reabrir dialog
      if (onOptimisticUpdate) {
        setIsOpen(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setConfigValue(JSON.stringify(currentConfig, null, 2));
    setIsOpen(false);
  };
  
  // Resetar configValue quando abrir o dialog
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setConfigValue(JSON.stringify(currentConfig, null, 2));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Configuração do Módulo</DialogTitle>
          <DialogDescription>
            Edite a configuração personalizada do módulo{' '}
            <span className="font-semibold text-primary">{moduleName}</span> para a organização{' '}
            <span className="font-semibold text-primary">{organizationName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="config">Configuração JSON</Label>
            <Textarea
              id="config"
              value={configValue}
              onChange={(e) => setConfigValue(e.target.value)}
              placeholder='{ "feature_flag": true, "max_items": 100 }'
              className="font-mono text-sm min-h-[200px]"
              rows={10}
            />
            <p className="text-sm text-muted-foreground">
              Configure as opções específicas para este módulo em formato JSON válido.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}