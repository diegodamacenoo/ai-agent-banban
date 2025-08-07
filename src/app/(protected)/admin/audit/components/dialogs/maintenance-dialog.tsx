'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Settings, AlertTriangle, Clock, Shield, Database } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface MaintenanceDialogProps {
  children: React.ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
}

export function MaintenanceDialog({ children, onConfirm, disabled = false }: MaintenanceDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Manutenção programada do sistema
          </DialogTitle>
          <DialogDescription>
            Executa manutenção completa incluindo limpeza, segurança e otimização de cache.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Operações incluídas:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Limpeza completa de sessões</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Análise de segurança automática</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Database className="h-4 w-4 shrink-0" />
                  <span>Atualização de cache do sistema</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Relatório detalhado de manutenção</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Atenção:</strong> Esta operação pode demorar alguns segundos e deve ser 
                  executada preferencialmente em horários de baixo uso do sistema.
                </div>
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>✓ Recomendado:</strong> Execute semanalmente para manter a performance ideal do sistema.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Executar Manutenção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}