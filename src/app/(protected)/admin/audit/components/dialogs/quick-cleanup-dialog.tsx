'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Clock } from 'lucide-react';
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

interface QuickCleanupDialogProps {
  children: React.ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
}

export function QuickCleanupDialog({ children, onConfirm, disabled = false }: QuickCleanupDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Limpeza rápida de sessões
          </DialogTitle>
          <DialogDescription>
            Esta ação removerá apenas as sessões expiradas (mais rápida e segura).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">O que será removido:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>Sessões que já expiraram naturalmente</li>
                <li>Tokens JWT inválidos no banco</li>
                <li>Registros de sessão órfãos</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>✓ Seguro:</strong> Não afeta sessões ativas nem usuários conectados
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Executar Limpeza Rápida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}