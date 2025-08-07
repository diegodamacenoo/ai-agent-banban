'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { X } from 'lucide-react';
import { ModuleCreationWizard } from '../development/components/ModuleCreationWizard';
import { ModuleWizardProvider } from '../contexts/ModuleWizardContext';
import { SystemConfigProvider } from '../contexts/SystemConfigContext';

interface ModuleCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog fullscreen para criação de módulos
 * Contém o wizard de criação em uma interface modal
 */
export function ModuleCreationDialog({ open, onOpenChange }: ModuleCreationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-screen h-screen m-0 rounded-none border-0 p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header fixo */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b bg-white sticky top-0 z-10">
          <div>
            <DialogTitle className="text-2xl font-bold">
              Criar Novo Módulo
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Use o wizard para criar um módulo personalizado com configurações guiadas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="shrink-0"
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </DialogHeader>

        {/* Conteúdo do wizard com scroll otimizado */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/50 dialog-scroll-area hw-accelerated">
          <div className="max-w-7xl mx-auto">
            <SystemConfigProvider>
              <ModuleWizardProvider>
                <ModuleCreationWizard />
              </ModuleWizardProvider>
            </SystemConfigProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}