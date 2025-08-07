'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { UserX, AlertTriangle, Shield } from 'lucide-react';
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

interface TerminateAllSessionsDialogProps {
  children: React.ReactNode;
  onConfirm: () => void;
  userName: string;
}

export function TerminateAllSessionsDialog({ 
  children, 
  onConfirm, 
  userName
}: TerminateAllSessionsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-500" />
            Encerrar todas as sessões
          </DialogTitle>
          <DialogDescription>
            Esta ação encerrará <strong>TODAS</strong> as sessões ativas do usuário <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Sessões afetadas:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
                <li>Todas as sessões web ativas</li>
                <li>Sessões mobile (se existirem)</li>
                <li>Tokens de API ativos</li>
                <li>Sessões em diferentes dispositivos</li>
              </ul>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Ação irreversível:</strong> O usuário será desconectado de todos os dispositivos 
                  e precisará fazer login novamente.
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Útil em casos de comprometimento de conta ou necessidade de segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onConfirm} variant="destructive">
            Encerrar Todas as Sessões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}