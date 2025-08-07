'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
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

interface DeepCleanupDialogProps {
  children: React.ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
}

export function DeepCleanupDialog({ children, onConfirm, disabled = false }: DeepCleanupDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Limpeza completa de sessões
          </DialogTitle>
          <DialogDescription>
            Esta ação executará uma limpeza abrangente de todas as sessões antigas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Operações incluídas:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-orange-800 dark:text-orange-200">
                <li>Encerrar sessões inativas há mais de 7 dias</li>
                <li>Remover todas as sessões expiradas</li>
                <li>Arquivar sessões antigas (30+ dias)</li>
                <li>Limpar logs de sessão antigos</li>
                <li>Gerar relatório detalhado</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Atenção:</strong> Esta operação é mais abrangente e pode demorar alguns segundos. 
                  Usuários com sessões inativas serão desconectados.
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onConfirm} variant="destructive">
            Executar Limpeza Completa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}